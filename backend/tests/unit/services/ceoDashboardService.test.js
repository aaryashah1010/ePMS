const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy } = require('../../helpers/spies');

const modulePath = path.join(__dirname, '../../../src/services/ceoDashboardService.js');

function buildMocks(overrides = {}) {
  return {
    '../utils/prisma': {
      appraisalCycle: {
        findUnique: createAsyncSpy(async () => ({ id: 'c1', name: 'FY2026', year: 2026, phase: 'ANNUAL_APPRAISAL', status: 'ACTIVE' })),
        findFirst: createAsyncSpy(async () => ({ id: 'c1', name: 'FY2026', year: 2026, phase: 'ANNUAL_APPRAISAL', status: 'ACTIVE' })),
        findMany: createAsyncSpy(async () => ([
          { id: 'c1', name: 'FY2026', year: 2026, status: 'ACTIVE' },
          { id: 'c0', name: 'FY2025', year: 2025, status: 'CLOSED' },
        ])),
      },
      user: {
        count: createAsyncSpy(async () => 10),
      },
      kpaGoal: {
        findMany: createAsyncSpy(async () => ([
          { userId: 'u1', status: 'REPORTING_DONE' },
          { userId: 'u2', status: 'DRAFT' },
        ])),
      },
      midYearReview: {
        findMany: createAsyncSpy(async () => ([
          { userId: 'u1', status: 'REPORTING_DONE' },
          { userId: 'u2', status: 'SUBMITTED' },
        ])),
        count: createAsyncSpy(async () => 1),
      },
      annualAppraisal: {
        findMany: createAsyncSpy(async () => ([
          { userId: 'u1', status: 'FINALIZED', finalScore: 4.5, ratingBand: 'Outstanding', user: { name: 'Alice', department: 'Eng' } },
          { userId: 'u2', status: 'SUBMITTED', finalScore: null, ratingBand: null, user: { name: 'Bob', department: 'Eng' } },
          { userId: 'u3', status: 'FINALIZED', finalScore: 3.2, ratingBand: 'Average', user: { name: 'Carol', department: 'Design' } },
        ])),
        count: createAsyncSpy(async () => 1),
      },
      ...overrides,
    },
  };
}

test('getFullDashboard resolves the active cycle when no cycleId is passed', async () => {
  const mocks = buildMocks();
  const service = loadModule(modulePath, mocks);

  const result = await service.getFullDashboard(null);

  assert.equal(mocks['../utils/prisma'].appraisalCycle.findFirst.calls.length, 1);
  assert.equal(result.cycle.id, 'c1');
  assert.ok(result.cycleStatus);
  assert.ok(result.performanceSummary);
  assert.ok(Array.isArray(result.departmentPerformance));
  assert.ok(Array.isArray(result.alerts));
  assert.ok(Array.isArray(result.topPerformers));
  assert.ok(Array.isArray(result.bottomPerformers));
});

test('getFullDashboard returns an empty payload when no cycle exists', async () => {
  const service = loadModule(modulePath, {
    '../utils/prisma': {
      appraisalCycle: {
        findUnique: createAsyncSpy(async () => null),
        findFirst: createAsyncSpy(async () => null),
        findMany: createAsyncSpy(async () => ([])),
      },
      user: { count: createAsyncSpy(async () => 0) },
      kpaGoal: { findMany: createAsyncSpy(async () => []) },
      midYearReview: { findMany: createAsyncSpy(async () => []), count: createAsyncSpy(async () => 0) },
      annualAppraisal: { findMany: createAsyncSpy(async () => []), count: createAsyncSpy(async () => 0) },
    },
  });

  const result = await service.getFullDashboard(null);
  assert.equal(result.cycle, null);
  assert.equal(result.cycleStatus, null);
  assert.deepEqual(result.alerts, []);
  assert.deepEqual(result.topPerformers, []);
});

test('getFullDashboard builds stage progress and overall completion', async () => {
  const service = loadModule(modulePath, buildMocks());
  const result = await service.getFullDashboard('c1');

  const stages = result.cycleStatus.stages.map((s) => s.stage);
  assert.deepEqual(stages, [
    'Goal Setting',
    'Mid Year Review',
    'Annual Self Appraisal',
    'RO Rating',
    'RevO Review',
    'AO Acceptance',
    'HR Finalized',
  ]);

  // 2 finalized of 10 employees → 20%
  assert.equal(result.cycleStatus.overallCompletion, 20);
});

test('getFullDashboard groups department performance and ranks departments by average', async () => {
  const service = loadModule(modulePath, buildMocks());
  const result = await service.getFullDashboard('c1');

  assert.equal(result.departmentPerformance.length, 2);
  // Eng has 1 finalized at 4.5; Design has 1 at 3.2 → Eng first
  assert.equal(result.departmentPerformance[0].department, 'Eng');
  assert.equal(result.departmentPerformance[0].avgScore, 4.5);
});

test('getFullDashboard surfaces alerts for pending RO ratings and incomplete mid-year reviews', async () => {
  const mocks = buildMocks({
    annualAppraisal: {
      findMany: createAsyncSpy(async () => ([
        { userId: 'u1', status: 'SUBMITTED', finalScore: null, ratingBand: null, user: { name: 'Bob', department: 'Eng' } },
      ])),
      count: createAsyncSpy(async () => 1),
    },
    midYearReview: {
      findMany: createAsyncSpy(async () => []),
      count: createAsyncSpy(async () => 2),
    },
  });
  const service = loadModule(modulePath, mocks);

  const result = await service.getFullDashboard('c1');

  assert.ok(result.alerts.some((a) => /RO rating pending/.test(a.text)));
  assert.ok(result.alerts.some((a) => /Mid Year Reviews incomplete/.test(a.text)));
});

test('getFullDashboard returns top and bottom performers sorted by score', async () => {
  let topCall = 0;
  const finalizedSet = [
    { user: { name: 'Alice', department: 'Eng' }, finalScore: 4.8, ratingBand: 'Outstanding' },
    { user: { name: 'Bob', department: 'Eng' }, finalScore: 4.2, ratingBand: 'Good' },
  ];
  const bottomSet = [
    { user: { name: 'Bob', department: 'Eng' }, finalScore: 4.2, ratingBand: 'Good' },
    { user: { name: 'Alice', department: 'Eng' }, finalScore: 4.8, ratingBand: 'Outstanding' },
  ];

  const findMany = createAsyncSpy(async (args) => {
    // First two calls in getFullDashboard (cycleStatus + perfSummary) hit different filters,
    // then deptPerf (with include), then top, then bottom, then yearOnYear loops.
    if (args && args.orderBy && args.orderBy.finalScore === 'desc') return finalizedSet;
    if (args && args.orderBy && args.orderBy.finalScore === 'asc') return bottomSet;
    if (args && args.include) {
      return finalizedSet.map(f => ({ ...f, status: 'FINALIZED' }));
    }
    if (args && args.where && args.where.status === 'FINALIZED') {
      return finalizedSet.map(f => ({ ratingBand: f.ratingBand, finalScore: f.finalScore }));
    }
    return [];
  });

  const mocks = buildMocks({
    annualAppraisal: {
      findMany,
      count: createAsyncSpy(async () => 2),
    },
  });
  const service = loadModule(modulePath, mocks);

  const result = await service.getFullDashboard('c1');

  assert.equal(result.topPerformers[0].name, 'Alice');
  assert.equal(result.bottomPerformers[0].name, 'Bob');
});
