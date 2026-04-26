const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy } = require('../../helpers/spies');
const { NotFoundError, ValidationError } = require('../../../src/utils/errors');

const modulePath = path.join(__dirname, '../../../src/services/cycleService.js');

test('createCycle rejects start dates in the past', async () => {
  const service = loadModule(modulePath, {
    '../utils/prisma': { appraisalCycle: { create: createAsyncSpy(async () => undefined) }, user: { findMany: createAsyncSpy(async () => []) } },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await assert.rejects(
    () => service.createCycle({ startDate: yesterday, endDate: tomorrow }),
    ValidationError,
  );
});

test('updateCycle ignores immutable fields and validates endDate', async () => {
  const findUnique = createAsyncSpy(async () => ({
    id: 'cycle-1',
    name: 'Annual Appraisal 2024',
    year: 2024,
    startDate: new Date('2026-05-01T00:00:00Z'),
    endDate: new Date('2026-06-01T00:00:00Z'),
    status: 'ACTIVE',
  }));
  const update = createAsyncSpy(async ({ data }) => ({ id: 'cycle-1', ...data }));

  const service = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique, update },
      user: { findMany: createAsyncSpy(async () => []) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  await service.updateCycle('cycle-1', {
    name: 'Should be ignored',
    year: 2030,
    startDate: '2030-01-01',
    endDate: '2026-07-01',
    status: 'CLOSED',
  });

  assert.equal(update.calls[0][0].data.name, undefined);
  assert.equal(update.calls[0][0].data.year, undefined);
  assert.equal(update.calls[0][0].data.startDate, undefined);
  assert.ok(update.calls[0][0].data.endDate instanceof Date);
});

test('advancePhase moves the cycle forward and closes the last phase', async () => {
  const findUnique = createAsyncSpy(async ({ where }) => {
    if (where.id === 'goal-cycle') {
      return { id: 'goal-cycle', phase: 'GOAL_SETTING', status: 'ACTIVE' };
    }
    return { id: 'annual-cycle', phase: 'ANNUAL_APPRAISAL', status: 'ACTIVE' };
  });
  const update = createAsyncSpy(async ({ where, data }) => ({ id: where.id, name: where.id, ...data }));

  const service = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique, update },
      user: { findMany: createAsyncSpy(async () => []) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  const advanced = await service.advancePhase('goal-cycle');
  const closed = await service.advancePhase('annual-cycle');

  assert.equal(advanced.phase, 'MID_YEAR_REVIEW');
  assert.equal(closed.status, 'CLOSED');
});

test('getCycleById throws when the cycle is missing', async () => {
  const service = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => null) },
      user: { findMany: createAsyncSpy(async () => []) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  await assert.rejects(() => service.getCycleById('missing'), NotFoundError);
});

test('getPendingWork reports unresolved employees during annual appraisal', async () => {
  const appraisalCycleFindUnique = createAsyncSpy(async () => ({
    id: 'cycle-1',
    phase: 'ANNUAL_APPRAISAL',
    status: 'ACTIVE',
  }));
  const userFindMany = createAsyncSpy(async () => ([
    { id: 'emp-1', name: 'Alice', employeeCode: 'EMP001' },
    { id: 'emp-2', name: 'Bob', employeeCode: 'EMP002' },
  ]));
  const annualFindUnique = createAsyncSpy(async ({ where }) => {
    if (where.userId_cycleId.userId === 'emp-1') {
      return { status: 'FINALIZED' };
    }
    return { status: 'SUBMITTED' };
  });

  const service = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: appraisalCycleFindUnique },
      user: { findMany: userFindMany },
      kpaGoal: { findMany: createAsyncSpy(async () => []) },
      midYearReview: { findUnique: createAsyncSpy(async () => null) },
      annualAppraisal: { findUnique: annualFindUnique },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  const pending = await service.getPendingWork('cycle-1');

  assert.deepEqual(pending, { pendingCount: 1, pendingEmployees: ['Bob'] });
});
