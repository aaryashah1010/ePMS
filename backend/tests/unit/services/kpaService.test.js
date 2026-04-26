const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy } = require('../../helpers/spies');
const { ForbiddenError, ValidationError } = require('../../../src/utils/errors');

const modulePath = path.join(__dirname, '../../../src/services/kpaService.js');

test('createKpa rejects totals above 100 percent', async () => {
  const service = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => ({ id: 'cycle-1', status: 'ACTIVE', phase: 'GOAL_SETTING' })) },
      kpaGoal: {
        findMany: createAsyncSpy(async () => [{ weightage: 70 }, { weightage: 25 }]),
        create: createAsyncSpy(async () => undefined),
      },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  await assert.rejects(
    () => service.createKpa('user-1', 'cycle-1', { title: 'Delivery', weightage: 10 }),
    ValidationError,
  );
});

test('updateKpa blocks edits from other users', async () => {
  const service = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => null) },
      kpaGoal: {
        findUnique: createAsyncSpy(async () => ({ id: 'kpa-1', userId: 'owner-1', status: 'DRAFT' })),
        findMany: createAsyncSpy(async () => []),
        update: createAsyncSpy(async () => undefined),
      },
      user: { findUnique: createAsyncSpy(async () => null) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  await assert.rejects(
    () => service.updateKpa('kpa-1', 'intruder', { title: 'Updated' }),
    ForbiddenError,
  );
});

test('submitKpas requires an exact 100 percent total and emails the reporting officer', async () => {
  const updateMany = createAsyncSpy(async () => ({ count: 2 }));
  const sendEmail = createAsyncSpy(async () => undefined);
  const service = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => null) },
      kpaGoal: {
        findMany: createAsyncSpy(async () => ([
          { id: 'kpa-1', weightage: 40, status: 'DRAFT' },
          { id: 'kpa-2', weightage: 60, status: 'DRAFT' },
        ])),
        updateMany,
      },
      user: {
        findUnique: createAsyncSpy(async () => ({
          id: 'user-1',
          name: 'Alice',
          reportingOfficer: { email: 'manager@example.com', name: 'Manager' },
        })),
      },
    },
    '../utils/emailService': { sendEmail },
  });

  const result = await service.submitKpas('user-1', 'cycle-1');

  assert.equal(updateMany.calls.length, 1);
  assert.equal(sendEmail.calls.length, 1);
  assert.equal(result.count, 2);
});

test('reviewKpas requires rejection remarks', async () => {
  const service = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => null) },
      user: { findUnique: createAsyncSpy(async () => ({ id: 'emp-1', reportingOfficerId: 'off-1', email: 'emp@example.com', name: 'Emp' })) },
      kpaGoal: {
        findMany: createAsyncSpy(async () => ([{ id: 'k1', status: 'SUBMITTED' }])),
        updateMany: createAsyncSpy(async () => undefined),
      },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  await assert.rejects(
    () => service.reviewKpas('off-1', 'cycle-1', 'emp-1', 'REJECT', ''),
    ValidationError,
  );
});
