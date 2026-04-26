const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy } = require('../../helpers/spies');
const { ForbiddenError, NotFoundError, ValidationError } = require('../../../src/utils/errors');

const modulePath = path.join(__dirname, '../../../src/services/appraisalService.js');

test('getOrCreateAppraisal creates a draft when one does not yet exist', async () => {
  const create = createAsyncSpy(async ({ data }) => ({ id: 'appraisal-1', ...data }));

  const service = loadModule(modulePath, {
    '../utils/prisma': {
      annualAppraisal: {
        findUnique: createAsyncSpy(async () => null),
        create,
      },
      appraisalCycle: {
        findUnique: createAsyncSpy(async () => ({ id: 'cycle-1' })),
      },
    },
    './calculationEngine': {
      computeKpaScore: () => 0,
      computeAttributeScore: () => 0,
      computeFinalScore: () => 0,
      getRatingBand: () => 'Poor',
    },
  });

  const appraisal = await service.getOrCreateAppraisal('user-1', 'cycle-1');

  assert.equal(create.calls.length, 1);
  assert.equal(appraisal.userId, 'user-1');
  assert.equal(appraisal.cycleId, 'cycle-1');
});

test('updateSelfAssessment only works during the annual appraisal phase', async () => {
  const service = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: {
        findUnique: createAsyncSpy(async () => ({ id: 'cycle-1', phase: 'MID_YEAR_REVIEW' })),
      },
      annualAppraisal: {
        findUnique: createAsyncSpy(async () => ({ id: 'appraisal-1', status: 'DRAFT' })),
        create: createAsyncSpy(async () => undefined),
        update: createAsyncSpy(async () => undefined),
      },
    },
    './calculationEngine': {
      computeKpaScore: () => 0,
      computeAttributeScore: () => 0,
      computeFinalScore: () => 0,
      getRatingBand: () => 'Poor',
    },
  });

  await assert.rejects(
    () => service.updateSelfAssessment('user-1', 'cycle-1', 'Summary text'),
    ValidationError,
  );
});

test('advanceAppraisalStatus enforces officer hierarchy', async () => {
  const service = loadModule(modulePath, {
    '../utils/prisma': {
      annualAppraisal: {
        findUnique: createAsyncSpy(async () => ({
          id: 'appraisal-1',
          status: 'SUBMITTED',
          user: {
            id: 'user-1',
            reportingOfficerId: 'right-officer',
            reviewingOfficerId: 'reviewer-1',
            acceptingOfficerId: 'accepting-1',
          },
          kpaRatings: [],
          attributeRatings: [],
        })),
        update: createAsyncSpy(async () => undefined),
      },
      kpaGoal: { findMany: createAsyncSpy(async () => []) },
      appraisalCycle: { findUnique: createAsyncSpy(async () => ({ kpaWeight: 60, valuesWeight: 20, competenciesWeight: 20 })) },
    },
    './calculationEngine': {
      computeKpaScore: () => 90,
      computeAttributeScore: () => 80,
      computeFinalScore: () => 86,
      getRatingBand: () => 'Good',
    },
  });

  await assert.rejects(
    () => service.advanceAppraisalStatus('wrong-officer', 'user-1', 'cycle-1', 'remarks', 'SUBMITTED'),
    ForbiddenError,
  );
});

test('advanceAppraisalStatus finalizes scores at the accepting stage', async () => {
  const update = createAsyncSpy(async ({ data }) => ({ id: 'appraisal-1', ...data }));

  const service = loadModule(modulePath, {
    '../utils/prisma': {
      annualAppraisal: {
        findUnique: createAsyncSpy(async () => ({
          id: 'appraisal-1',
          status: 'REVIEWING_DONE',
          user: {
            id: 'user-1',
            reportingOfficerId: 'reporting-1',
            reviewingOfficerId: 'reviewing-1',
            acceptingOfficerId: 'accepting-1',
          },
          kpaRatings: [{ rating: 50 }],
          attributeRatings: [{ rating: 4 }],
        })),
        update,
      },
      kpaGoal: { findMany: createAsyncSpy(async () => ([{ id: 'kpa-1', weightage: 50 }])) },
      appraisalCycle: { findUnique: createAsyncSpy(async () => ({ kpaWeight: 60, valuesWeight: 20, competenciesWeight: 20 })) },
    },
    './calculationEngine': {
      computeKpaScore: () => 88,
      computeAttributeScore: (_ratings, type) => (type === 'VALUES' ? 76 : 84),
      computeFinalScore: () => 84.8,
      getRatingBand: () => 'Good',
    },
  });

  const appraisal = await service.advanceAppraisalStatus('accepting-1', 'user-1', 'cycle-1', 'Looks good', 'REVIEWING_DONE');

  assert.equal(update.calls.length, 1);
  assert.equal(update.calls[0][0].data.status, 'ACCEPTING_DONE');
  assert.equal(appraisal.status, 'ACCEPTING_DONE');
});

test('hrFinalizeAll finalizes every accepting-done appraisal', async () => {
  const update = createAsyncSpy(async ({ where, data }) => ({ id: where.id, ...data }));

  const service = loadModule(modulePath, {
    '../utils/prisma': {
      annualAppraisal: {
        findMany: createAsyncSpy(async () => ([
          {
            id: 'appraisal-1',
            userId: 'user-1',
            kpaRatings: [],
            attributeRatings: [],
          },
          {
            id: 'appraisal-2',
            userId: 'user-2',
            kpaRatings: [],
            attributeRatings: [],
          },
        ])),
        update,
      },
      appraisalCycle: {
        findUnique: createAsyncSpy(async () => ({ kpaWeight: 60, valuesWeight: 20, competenciesWeight: 20 })),
      },
      kpaGoal: {
        findMany: createAsyncSpy(async () => ([{ id: 'kpa-1', weightage: 100 }])),
      },
    },
    './calculationEngine': {
      computeKpaScore: () => 92,
      computeAttributeScore: () => 80,
      computeFinalScore: () => 87.2,
      getRatingBand: () => 'Good',
    },
  });

  const results = await service.hrFinalizeAll('cycle-1');

  assert.equal(update.calls.length, 2);
  assert.equal(results.length, 2);
  assert.equal(update.calls[0][0].data.status, 'FINALIZED');
});

test('submitAppraisal rejects missing appraisals', async () => {
  const service = loadModule(modulePath, {
    '../utils/prisma': {
      annualAppraisal: {
        findUnique: createAsyncSpy(async () => null),
        update: createAsyncSpy(async () => undefined),
      },
      kpaGoal: { findMany: createAsyncSpy(async () => []) },
      appraisalCycle: { findUnique: createAsyncSpy(async () => ({ id: 'cycle-1' })) },
    },
    './calculationEngine': {
      computeKpaScore: () => 0,
      computeAttributeScore: () => 0,
      computeFinalScore: () => 0,
      getRatingBand: () => 'Poor',
    },
  });

  await assert.rejects(() => service.submitAppraisal('user-1', 'cycle-1'), NotFoundError);
});
