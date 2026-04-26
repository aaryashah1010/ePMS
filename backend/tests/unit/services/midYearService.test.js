const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy } = require('../../helpers/spies');
const { ForbiddenError, NotFoundError, ValidationError } = require('../../../src/utils/errors');

const modulePath = path.join(__dirname, '../../../src/services/midYearService.js');

test('createOrUpdateMidYear creates a new review during the correct phase', async () => {
  const create = createAsyncSpy(async ({ data }) => ({ id: 'review-1', ...data }));

  const service = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: {
        findUnique: createAsyncSpy(async () => ({ id: 'cycle-1', status: 'ACTIVE', phase: 'MID_YEAR_REVIEW' })),
      },
      midYearReview: {
        findUnique: createAsyncSpy(async () => null),
        create,
        update: createAsyncSpy(async () => undefined),
      },
    },
  });

  const review = await service.createOrUpdateMidYear('user-1', 'cycle-1', { progress: 'Halfway done' });

  assert.equal(create.calls.length, 1);
  assert.equal(review.userId, 'user-1');
  assert.equal(review.cycleId, 'cycle-1');
});

test('createOrUpdateMidYear updates an existing draft instead of creating a new record', async () => {
  const update = createAsyncSpy(async ({ data }) => ({ id: 'review-1', ...data }));

  const service = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: {
        findUnique: createAsyncSpy(async () => ({ id: 'cycle-1', status: 'ACTIVE', phase: 'MID_YEAR_REVIEW' })),
      },
      midYearReview: {
        findUnique: createAsyncSpy(async () => ({ id: 'review-1', status: 'DRAFT' })),
        create: createAsyncSpy(async () => undefined),
        update,
      },
    },
  });

  await service.createOrUpdateMidYear('user-1', 'cycle-1', { progress: 'Updated text' });

  assert.equal(update.calls.length, 1);
  assert.deepEqual(update.calls[0][0].where, { userId_cycleId: { userId: 'user-1', cycleId: 'cycle-1' } });
});

test('submitMidYear rejects missing or already submitted reviews', async () => {
  const missingService = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => null) },
      midYearReview: {
        findUnique: createAsyncSpy(async () => null),
        update: createAsyncSpy(async () => undefined),
      },
    },
  });

  await assert.rejects(() => missingService.submitMidYear('user-1', 'cycle-1'), NotFoundError);

  const submittedService = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => null) },
      midYearReview: {
        findUnique: createAsyncSpy(async () => ({ id: 'review-1', status: 'SUBMITTED' })),
        update: createAsyncSpy(async () => undefined),
      },
    },
  });

  await assert.rejects(() => submittedService.submitMidYear('user-1', 'cycle-1'), ValidationError);
});

test('addReportingRemarks enforces officer ownership and stores the parsed manager rating', async () => {
  const update = createAsyncSpy(async ({ data }) => ({ id: 'review-1', ...data }));

  const service = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => null) },
      midYearReview: {
        findUnique: createAsyncSpy(async () => ({
          id: 'review-1',
          status: 'SUBMITTED',
          user: { id: 'user-1', reportingOfficerId: 'officer-1' },
        })),
        update,
      },
    },
  });

  const review = await service.addReportingRemarks('officer-1', 'user-1', 'cycle-1', 'Keep pushing', '4.5');

  assert.equal(update.calls[0][0].data.status, 'REPORTING_DONE');
  assert.equal(update.calls[0][0].data.managerRating, 4.5);
  assert.equal(review.reportingRemarks, 'Keep pushing');
});

test('addReportingRemarks rejects the wrong officer', async () => {
  const service = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => null) },
      midYearReview: {
        findUnique: createAsyncSpy(async () => ({
          id: 'review-1',
          status: 'SUBMITTED',
          user: { id: 'user-1', reportingOfficerId: 'actual-officer' },
        })),
        update: createAsyncSpy(async () => undefined),
      },
    },
  });

  await assert.rejects(
    () => service.addReportingRemarks('wrong-officer', 'user-1', 'cycle-1', 'Nope', 4),
    ForbiddenError,
  );
});
