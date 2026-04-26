const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy } = require('../../helpers/spies');
const { NotFoundError } = require('../../../src/utils/errors');

const modulePath = path.join(__dirname, '../../../src/services/reportService.js');

test('individualReport assembles the user appraisal, KPAs, and mid-year review', async () => {
  const service = loadModule(modulePath, {
    '../utils/prisma': {
      user: {
        findUnique: createAsyncSpy(async () => ({
          id: 'user-1',
          name: 'Alice',
          email: 'alice@example.com',
          department: 'Engineering',
          employeeCode: 'EMP001',
          role: 'EMPLOYEE',
        })),
      },
      annualAppraisal: {
        findUnique: createAsyncSpy(async () => ({ id: 'appraisal-1', status: 'FINALIZED' })),
      },
      kpaGoal: {
        findMany: createAsyncSpy(async () => ([{ id: 'kpa-1', title: 'Delivery' }])),
      },
      midYearReview: {
        findUnique: createAsyncSpy(async () => ({ id: 'mid-1', status: 'REPORTING_DONE' })),
      },
    },
  });

  const report = await service.individualReport('user-1', 'cycle-1');

  assert.equal(report.user.name, 'Alice');
  assert.equal(report.appraisal.status, 'FINALIZED');
  assert.equal(report.kpas.length, 1);
  assert.equal(report.midYear.id, 'mid-1');
});

test('individualReport throws when the user is missing', async () => {
  const service = loadModule(modulePath, {
    '../utils/prisma': {
      user: { findUnique: createAsyncSpy(async () => null) },
      annualAppraisal: { findUnique: createAsyncSpy(async () => null) },
      kpaGoal: { findMany: createAsyncSpy(async () => []) },
      midYearReview: { findUnique: createAsyncSpy(async () => null) },
    },
  });

  await assert.rejects(() => service.individualReport('missing', 'cycle-1'), NotFoundError);
});

test('departmentSummary groups employees and calculates per-department averages', async () => {
  const service = loadModule(modulePath, {
    '../utils/prisma': {
      annualAppraisal: {
        findMany: createAsyncSpy(async () => ([
          {
            status: 'FINALIZED',
            finalScore: 80,
            ratingBand: 'Good',
            user: { id: 'u1', name: 'Alice', department: 'Engineering', employeeCode: 'EMP001' },
          },
          {
            status: 'SUBMITTED',
            finalScore: null,
            ratingBand: null,
            user: { id: 'u2', name: 'Bob', department: 'Engineering', employeeCode: 'EMP002' },
          },
          {
            status: 'FINALIZED',
            finalScore: 90,
            ratingBand: 'Outstanding',
            user: { id: 'u3', name: 'Carol', department: 'Design', employeeCode: 'EMP003' },
          },
        ])),
      },
    },
  });

  const summary = await service.departmentSummary('cycle-1');

  assert.equal(summary.length, 2);
  const engineering = summary.find((dept) => dept.department === 'Engineering');
  assert.equal(engineering.avgFinalScore, 80);
  assert.equal(engineering.totalEmployees, 2);
  assert.equal(engineering.finalized, 1);
});

test('ratingDistribution returns counts and percentages for finalized appraisals', async () => {
  const service = loadModule(modulePath, {
    '../utils/prisma': {
      annualAppraisal: {
        findMany: createAsyncSpy(async () => ([
          { ratingBand: 'Good' },
          { ratingBand: 'Good' },
          { ratingBand: 'Outstanding' },
        ])),
      },
    },
  });

  const distribution = await service.ratingDistribution('cycle-1');

  assert.equal(distribution.total, 3);
  assert.equal(distribution.distribution.Good, 2);
  assert.equal(distribution.percentages.Outstanding, 33.3);
});

test('cycleProgress derives goal, mid-year, and appraisal status counts', async () => {
  const service = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: {
        findUnique: createAsyncSpy(async () => ({ id: 'cycle-1', phase: 'ANNUAL_APPRAISAL' })),
      },
      kpaGoal: {
        findMany: createAsyncSpy(async () => ([
          { userId: 'u1', status: 'SUBMITTED' },
          { userId: 'u1', status: 'REPORTING_DONE' },
          { userId: 'u2', status: 'DRAFT' },
        ])),
      },
      midYearReview: {
        groupBy: createAsyncSpy(async () => ([
          { userId: 'u1', status: 'REPORTING_DONE' },
          { userId: 'u2', status: 'SUBMITTED' },
        ])),
      },
      annualAppraisal: {
        groupBy: createAsyncSpy(async () => ([
          { status: 'SUBMITTED', _count: { status: 2 } },
          { status: 'FINALIZED', _count: { status: 1 } },
        ])),
      },
    },
  });

  const progress = await service.cycleProgress('cycle-1');

  assert.equal(progress.goalProgress.SUBMITTED, 1);
  assert.equal(progress.goalProgress.DRAFT, 1);
  assert.equal(progress.midYearProgress.REPORTING_DONE, 1);
  assert.equal(progress.appraisalProgress.SUBMITTED, 2);
  assert.equal(progress.appraisalProgress.FINALIZED, 1);
});
