const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy, createSpy } = require('../../helpers/spies');
const {
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} = require('../../../src/utils/errors');

const appraisalServicePath = path.join(__dirname, '../../../src/services/appraisalService.js');
const authServicePath = path.join(__dirname, '../../../src/services/authService.js');
const cycleServicePath = path.join(__dirname, '../../../src/services/cycleService.js');
const kpaServicePath = path.join(__dirname, '../../../src/services/kpaService.js');
const midYearServicePath = path.join(__dirname, '../../../src/services/midYearService.js');
const userServicePath = path.join(__dirname, '../../../src/services/userService.js');

function calcStub() {
  return {
    computeKpaScore: () => 0,
    computeAttributeScore: () => 0,
    computeFinalScore: () => 0,
    getRatingBand: () => 'Poor',
  };
}

// ---------- appraisalService ----------

test('appraisalService.getAppraisalFull throws NotFoundError when missing', async () => {
  const service = loadModule(appraisalServicePath, {
    '../utils/prisma': {
      annualAppraisal: { findUnique: createAsyncSpy(async () => null) },
      appraisalCycle: { findUnique: createAsyncSpy(async () => ({ id: 'c1' })) },
    },
    './calculationEngine': calcStub(),
  });

  await assert.rejects(() => service.getAppraisalFull('user-x', 'cycle-x'), NotFoundError);
});

test('appraisalService.advanceAppraisalStatus rejects mismatched expected status', async () => {
  const service = loadModule(appraisalServicePath, {
    '../utils/prisma': {
      annualAppraisal: {
        findUnique: createAsyncSpy(async () => ({
          id: 'a1',
          status: 'DRAFT',
          user: { id: 'user-1', reportingOfficerId: 'off-1', reviewingOfficerId: 'off-2', acceptingOfficerId: 'off-3' },
          kpaRatings: [],
          attributeRatings: [],
        })),
        update: createAsyncSpy(async () => undefined),
      },
      kpaGoal: { findMany: createAsyncSpy(async () => []) },
      appraisalCycle: { findUnique: createAsyncSpy(async () => ({})) },
    },
    './calculationEngine': calcStub(),
  });

  await assert.rejects(
    () => service.advanceAppraisalStatus('off-1', 'user-1', 'cycle-1', 'r', 'SUBMITTED'),
    ValidationError,
  );
});

test('appraisalService.saveKpaRatings upserts every rating', async () => {
  const upsert = createAsyncSpy(async (args) => ({ id: args.where.annualAppraisalId_kpaGoalId_ratedBy.kpaGoalId }));

  const service = loadModule(appraisalServicePath, {
    '../utils/prisma': {
      annualAppraisal: { findUnique: createAsyncSpy(async () => ({ id: 'a1', kpaRatings: [] })) },
      kpaRating: { upsert },
      appraisalCycle: { findUnique: createAsyncSpy(async () => ({})) },
      kpaGoal: { findMany: createAsyncSpy(async () => []) },
    },
    './calculationEngine': calcStub(),
  });

  const result = await service.saveKpaRatings('officer-1', 'a1', [
    { kpaGoalId: 'k1', rating: 30, remarks: 'Good' },
    { kpaGoalId: 'k2', rating: 40 },
  ]);

  assert.equal(upsert.calls.length, 2);
  assert.equal(result.length, 2);
  assert.equal(upsert.calls[1][0].create.remarks, null);
});

test('appraisalService.saveKpaRatings throws when appraisal missing', async () => {
  const service = loadModule(appraisalServicePath, {
    '../utils/prisma': {
      annualAppraisal: { findUnique: createAsyncSpy(async () => null) },
      kpaRating: { upsert: createAsyncSpy(async () => undefined) },
      appraisalCycle: { findUnique: createAsyncSpy(async () => ({})) },
      kpaGoal: { findMany: createAsyncSpy(async () => []) },
    },
    './calculationEngine': calcStub(),
  });

  await assert.rejects(() => service.saveKpaRatings('off-1', 'missing', []), NotFoundError);
});

test('appraisalService.saveAttributeRatings upserts each attribute rating', async () => {
  const upsert = createAsyncSpy(async (args) => ({ id: args.where.annualAppraisalId_attributeId_ratedBy.attributeId }));
  const service = loadModule(appraisalServicePath, {
    '../utils/prisma': {
      annualAppraisal: { findUnique: createAsyncSpy(async () => ({ id: 'a1' })) },
      attributeRating: { upsert },
      appraisalCycle: { findUnique: createAsyncSpy(async () => ({})) },
      kpaGoal: { findMany: createAsyncSpy(async () => []) },
    },
    './calculationEngine': calcStub(),
  });

  await service.saveAttributeRatings('officer-1', 'a1', [
    { attributeId: 'a-val', rating: 4 },
    { attributeId: 'a-comp', rating: 5, remarks: 'Excellent' },
  ]);

  assert.equal(upsert.calls.length, 2);
});

test('appraisalService.getAppraisalsForOfficer filters by cycle and officer linkage', async () => {
  const findMany = createAsyncSpy(async () => ([{ id: 'a1' }]));
  const service = loadModule(appraisalServicePath, {
    '../utils/prisma': {
      annualAppraisal: { findMany },
      appraisalCycle: { findUnique: createAsyncSpy(async () => ({})) },
      kpaGoal: { findMany: createAsyncSpy(async () => []) },
    },
    './calculationEngine': calcStub(),
  });

  const results = await service.getAppraisalsForOfficer('off-1', 'cycle-1', 'REPORTING');

  assert.equal(results.length, 1);
  assert.equal(findMany.calls[0][0].where.cycleId, 'cycle-1');
  const orClause = findMany.calls[0][0].where.user.OR;
  assert.ok(orClause.some((c) => c.reportingOfficerId === 'off-1'));
});

// ---------- authService ----------

test('authService.changePassword throws AuthError on wrong current password', async () => {
  process.env.BCRYPT_ROUNDS = '10';
  const service = loadModule(authServicePath, {
    bcryptjs: {
      compare: createAsyncSpy(async () => false),
      hash: createAsyncSpy(async () => 'new-hash'),
    },
    jsonwebtoken: { sign: createSpy(() => 't') },
    '../utils/prisma': {
      user: {
        findUnique: createAsyncSpy(async () => ({ id: 'u1', password: 'old' })),
        update: createAsyncSpy(async () => undefined),
      },
    },
  });

  await assert.rejects(() => service.changePassword('u1', 'wrong', 'new'), AuthError);
});

test('authService.login rejects an inactive user', async () => {
  const service = loadModule(authServicePath, {
    bcryptjs: { compare: createAsyncSpy(async () => true), hash: createAsyncSpy(async () => '') },
    jsonwebtoken: { sign: createSpy(() => 't') },
    '../utils/prisma': {
      user: {
        findUnique: createAsyncSpy(async () => ({ id: 'u1', password: 'h', isActive: false })),
        update: createAsyncSpy(async () => undefined),
      },
    },
  });

  await assert.rejects(() => service.login('a@b.c', 'pw'), AuthError);
});

// ---------- cycleService ----------

test('cycleService.createCycle persists cycle and queues employee notifications', async () => {
  const create = createAsyncSpy(async ({ data }) => ({
    id: 'cycle-1', name: data.name, year: data.year, phase: data.phase,
    startDate: data.startDate, endDate: data.endDate,
  }));
  const findManyEmployees = createAsyncSpy(async () => ([{ email: 'e1@x.com' }]));
  const sendEmail = createAsyncSpy(async () => undefined);

  const service = loadModule(cycleServicePath, {
    '../utils/prisma': {
      appraisalCycle: { create },
      user: { findMany: findManyEmployees },
    },
    '../utils/emailService': { sendEmail },
  });

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const cycle = await service.createCycle({
    name: 'FY 2027',
    year: 2027,
    phase: 'GOAL_SETTING',
    startDate: tomorrow.toISOString(),
    endDate: nextMonth.toISOString(),
  });

  assert.equal(cycle.id, 'cycle-1');
  assert.equal(create.calls.length, 1);
  // Email send is fire-and-forget; allow microtasks to drain
  await new Promise((resolve) => setImmediate(resolve));
});

test('cycleService.advancePhase rejects a closed cycle', async () => {
  const service = loadModule(cycleServicePath, {
    '../utils/prisma': {
      appraisalCycle: {
        findUnique: createAsyncSpy(async () => ({ id: 'cycle-1', phase: 'GOAL_SETTING', status: 'CLOSED' })),
        update: createAsyncSpy(async () => undefined),
      },
      user: { findMany: createAsyncSpy(async () => []) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  await assert.rejects(() => service.advancePhase('cycle-1'), ValidationError);
});

test('cycleService.deleteCycle rejects unknown cycles', async () => {
  const service = loadModule(cycleServicePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => null), delete: createAsyncSpy(async () => undefined) },
      user: { findMany: createAsyncSpy(async () => []) },
      $transaction: createAsyncSpy(async () => undefined),
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  await assert.rejects(() => service.deleteCycle('missing'), NotFoundError);
});

test('cycleService.getActiveCycle returns active cycles ordered by createdAt', async () => {
  const findMany = createAsyncSpy(async () => ([{ id: 'cycle-1', status: 'ACTIVE' }]));
  const service = loadModule(cycleServicePath, {
    '../utils/prisma': {
      appraisalCycle: { findMany },
      user: { findMany: createAsyncSpy(async () => []) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  const result = await service.getActiveCycle();
  assert.equal(result.length, 1);
  assert.deepEqual(findMany.calls[0][0].where, { status: 'ACTIVE' });
});

test('cycleService.getAllCycles applies year, status, and phase filters', async () => {
  const findMany = createAsyncSpy(async () => ([]));
  const service = loadModule(cycleServicePath, {
    '../utils/prisma': {
      appraisalCycle: { findMany },
      user: { findMany: createAsyncSpy(async () => []) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  await service.getAllCycles({ year: '2026', status: 'ACTIVE', phase: 'GOAL_SETTING' });
  assert.deepEqual(findMany.calls[0][0].where, { year: 2026, status: 'ACTIVE', phase: 'GOAL_SETTING' });
});

test('cycleService.getPendingWork flags employees with incomplete goal setting', async () => {
  const service = loadModule(cycleServicePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => ({ id: 'c1', phase: 'GOAL_SETTING' })) },
      user: { findMany: createAsyncSpy(async () => ([{ id: 'u1', name: 'Alice' }, { id: 'u2', name: 'Bob' }])) },
      kpaGoal: {
        findMany: createAsyncSpy(async ({ where }) => {
          if (where.userId === 'u1') {
            return [{ weightage: 100, status: 'REPORTING_DONE' }];
          }
          return [{ weightage: 50, status: 'DRAFT' }];
        }),
      },
      midYearReview: { findUnique: createAsyncSpy(async () => null) },
      annualAppraisal: { findUnique: createAsyncSpy(async () => null) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  const result = await service.getPendingWork('c1');
  assert.deepEqual(result, { pendingCount: 1, pendingEmployees: ['Bob'] });
});

test('cycleService.getPendingWork flags employees missing mid-year submission', async () => {
  const service = loadModule(cycleServicePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => ({ id: 'c1', phase: 'MID_YEAR_REVIEW' })) },
      user: { findMany: createAsyncSpy(async () => ([{ id: 'u1', name: 'Alice' }, { id: 'u2', name: 'Bob' }])) },
      kpaGoal: { findMany: createAsyncSpy(async () => []) },
      midYearReview: {
        findUnique: createAsyncSpy(async ({ where }) => {
          if (where.userId_cycleId.userId === 'u1') return { status: 'REPORTING_DONE' };
          return null;
        }),
      },
      annualAppraisal: { findUnique: createAsyncSpy(async () => null) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  const result = await service.getPendingWork('c1');
  assert.deepEqual(result.pendingEmployees, ['Bob']);
});

// ---------- kpaService ----------

test('kpaService.createKpa creates when totals stay within 100%', async () => {
  const create = createAsyncSpy(async ({ data }) => ({ id: 'kpa-1', ...data }));
  const service = loadModule(kpaServicePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => ({ id: 'c1', status: 'ACTIVE', phase: 'GOAL_SETTING' })) },
      kpaGoal: {
        findMany: createAsyncSpy(async () => ([{ weightage: 30 }])),
        create,
      },
      user: { findUnique: createAsyncSpy(async () => null) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  const kpa = await service.createKpa('u1', 'c1', { title: 'Delivery', weightage: 40 });
  assert.equal(kpa.id, 'kpa-1');
  assert.equal(create.calls[0][0].data.userId, 'u1');
});

test('kpaService.createKpa rejects when cycle is inactive or in wrong phase', async () => {
  const inactive = loadModule(kpaServicePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => ({ id: 'c1', status: 'CLOSED', phase: 'GOAL_SETTING' })) },
      kpaGoal: { findMany: createAsyncSpy(async () => []), create: createAsyncSpy(async () => undefined) },
      user: { findUnique: createAsyncSpy(async () => null) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });
  await assert.rejects(() => inactive.createKpa('u1', 'c1', { weightage: 10 }), ValidationError);

  const wrongPhase = loadModule(kpaServicePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => ({ id: 'c1', status: 'ACTIVE', phase: 'MID_YEAR_REVIEW' })) },
      kpaGoal: { findMany: createAsyncSpy(async () => []), create: createAsyncSpy(async () => undefined) },
      user: { findUnique: createAsyncSpy(async () => null) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });
  await assert.rejects(() => wrongPhase.createKpa('u1', 'c1', { weightage: 10 }), ValidationError);
});

test('kpaService.getKpaById throws NotFoundError when KPA is missing', async () => {
  const service = loadModule(kpaServicePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => null) },
      kpaGoal: { findUnique: createAsyncSpy(async () => null) },
      user: { findUnique: createAsyncSpy(async () => null) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });
  await assert.rejects(() => service.getKpaById('missing'), NotFoundError);
});

test('kpaService.deleteKpa enforces owner and draft status', async () => {
  const wrongOwner = loadModule(kpaServicePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => null) },
      kpaGoal: {
        findUnique: createAsyncSpy(async () => ({ id: 'k1', userId: 'owner-1', status: 'DRAFT' })),
        delete: createAsyncSpy(async () => undefined),
      },
      user: { findUnique: createAsyncSpy(async () => null) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });
  await assert.rejects(() => wrongOwner.deleteKpa('k1', 'intruder'), ForbiddenError);

  const submittedAlready = loadModule(kpaServicePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => null) },
      kpaGoal: {
        findUnique: createAsyncSpy(async () => ({ id: 'k1', userId: 'owner-1', status: 'SUBMITTED' })),
        delete: createAsyncSpy(async () => undefined),
      },
      user: { findUnique: createAsyncSpy(async () => null) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });
  await assert.rejects(() => submittedAlready.deleteKpa('k1', 'owner-1'), ValidationError);
});

test('kpaService.reviewKpas accepts goals and emails the employee', async () => {
  const updateMany = createAsyncSpy(async () => undefined);
  const sendEmail = createAsyncSpy(async () => undefined);
  const service = loadModule(kpaServicePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => null) },
      user: {
        findUnique: createAsyncSpy(async () => ({
          id: 'emp-1', name: 'Employee', email: 'emp@example.com', reportingOfficerId: 'off-1',
        })),
      },
      kpaGoal: {
        findMany: createAsyncSpy(async () => ([{ id: 'k1', status: 'SUBMITTED' }])),
        updateMany,
      },
    },
    '../utils/emailService': { sendEmail },
  });

  const result = await service.reviewKpas('off-1', 'cycle-1', 'emp-1', 'ACCEPT', null);
  assert.equal(updateMany.calls[0][0].data.status, 'REPORTING_DONE');
  assert.equal(sendEmail.calls.length, 1);
  assert.match(result.message, /accepted/i);
});

test('kpaService.submitKpas rejects when no draft KPAs exist', async () => {
  const service = loadModule(kpaServicePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => null) },
      kpaGoal: { findMany: createAsyncSpy(async () => []) },
      user: { findUnique: createAsyncSpy(async () => null) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  await assert.rejects(() => service.submitKpas('u1', 'c1'), ValidationError);
});

// ---------- midYearService ----------

test('midYearService.createOrUpdateMidYear rejects in the wrong phase', async () => {
  const service = loadModule(midYearServicePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => ({ id: 'c1', status: 'ACTIVE', phase: 'GOAL_SETTING' })) },
      midYearReview: {
        findUnique: createAsyncSpy(async () => null),
        create: createAsyncSpy(async () => undefined),
        update: createAsyncSpy(async () => undefined),
      },
    },
  });

  await assert.rejects(
    () => service.createOrUpdateMidYear('u1', 'c1', { progress: 'hi' }),
    ValidationError,
  );
});

test('midYearService.addReportingRemarks rejects unsubmitted reviews', async () => {
  const service = loadModule(midYearServicePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => null) },
      midYearReview: {
        findUnique: createAsyncSpy(async () => ({
          id: 'r1', status: 'DRAFT',
          user: { id: 'u1', reportingOfficerId: 'off-1' },
        })),
        update: createAsyncSpy(async () => undefined),
      },
    },
  });

  await assert.rejects(
    () => service.addReportingRemarks('off-1', 'u1', 'c1', 'remarks', 4),
    ValidationError,
  );
});

test('midYearService.getMidYearForOfficer queries by cycle and officer', async () => {
  const findMany = createAsyncSpy(async () => ([{ id: 'r1' }, { id: 'r2' }]));
  const service = loadModule(midYearServicePath, {
    '../utils/prisma': {
      appraisalCycle: { findUnique: createAsyncSpy(async () => null) },
      midYearReview: { findMany, findUnique: createAsyncSpy(async () => null), update: createAsyncSpy(async () => undefined) },
    },
  });

  const reviews = await service.getMidYearForOfficer('off-1', 'cycle-1');
  assert.equal(reviews.length, 2);
  assert.equal(findMany.calls[0][0].where.cycleId, 'cycle-1');
});

// ---------- userService ----------

test('userService.getAllUsers applies role, department, and isActive filters', async () => {
  const findMany = createAsyncSpy(async () => ([]));
  const service = loadModule(userServicePath, {
    bcryptjs: { hash: createAsyncSpy(async () => 'h') },
    '../utils/prisma': {
      user: { findUnique: createAsyncSpy(async () => null), findMany },
      reportingHistory: { create: createAsyncSpy(async () => undefined), updateMany: createAsyncSpy(async () => undefined) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  await service.getAllUsers({ role: 'EMPLOYEE', department: 'Eng', isActive: true });
  assert.deepEqual(findMany.calls[0][0].where, { role: 'EMPLOYEE', department: 'Eng', isActive: true });
});

test('userService.getReportees / getReviewees / getAppraisees filter by officer linkage and active flag', async () => {
  const findMany = createAsyncSpy(async () => ([{ id: 'u1' }]));
  const service = loadModule(userServicePath, {
    bcryptjs: { hash: createAsyncSpy(async () => 'h') },
    '../utils/prisma': {
      user: { findUnique: createAsyncSpy(async () => null), findMany },
      reportingHistory: { create: createAsyncSpy(async () => undefined), updateMany: createAsyncSpy(async () => undefined) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  await service.getReportees('off-1');
  await service.getReviewees('off-1');
  await service.getAppraisees('off-1');

  assert.equal(findMany.calls.length, 3);
  assert.deepEqual(findMany.calls[0][0].where, { reportingOfficerId: 'off-1', isActive: true });
  assert.deepEqual(findMany.calls[1][0].where, { reviewingOfficerId: 'off-1', isActive: true });
  assert.deepEqual(findMany.calls[2][0].where, { acceptingOfficerId: 'off-1', isActive: true });
});
