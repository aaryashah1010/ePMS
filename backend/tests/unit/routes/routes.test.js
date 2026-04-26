const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { getRouteDescriptors } = require('../../helpers/spies');

function loadRouter(modulePath, controllerMock) {
  const authorizeCalls = [];
  const authenticate = function authenticate(req, res, next) {
    if (next) next();
  };
  const authorize = (...roles) => {
    authorizeCalls.push(roles);
    return function authorized(req, res, next) {
      if (next) next();
    };
  };

  const router = loadModule(modulePath, {
    '../controllers/authController': controllerMock,
    '../controllers/userController': controllerMock,
    '../controllers/cycleController': controllerMock,
    '../controllers/kpaController': controllerMock,
    '../controllers/midYearController': controllerMock,
    '../controllers/appraisalController': controllerMock,
    '../controllers/reportController': controllerMock,
    '../controllers/auditController': controllerMock,
    '../controllers/attributeController': controllerMock,
    '../controllers/ceoDashboardController': controllerMock,
    '../middleware/auth': { authenticate },
    '../middleware/rbac': { authorize },
  });

  return { router, authorizeCalls };
}

function makeControllerMock(names) {
  return Object.fromEntries(names.map((name) => [name, function handler() {}]));
}

test('auth routes expose login, me, and change-password endpoints', () => {
  const authPath = path.join(__dirname, '../../../src/routes/auth.js');
  const { router } = loadRouter(authPath, makeControllerMock(['login', 'me', 'changePassword']));

  assert.deepEqual(
    getRouteDescriptors(router).map(({ path, methods }) => ({ path, methods })),
    [
      { path: '/login', methods: ['post'] },
      { path: '/me', methods: ['get'] },
      { path: '/change-password', methods: ['post'] },
    ],
  );
});

test('user routes register profile, officer, and HR-only endpoints', () => {
  const usersPath = path.join(__dirname, '../../../src/routes/users.js');
  const { router, authorizeCalls } = loadRouter(usersPath, makeControllerMock([
    'getProfile',
    'getMyReportees',
    'getMyReviewees',
    'getMyAppraisees',
    'getAllUsers',
    'createUser',
    'getUserById',
    'updateUser',
  ]));

  assert.deepEqual(
    getRouteDescriptors(router).map(({ path, methods }) => ({ path, methods })),
    [
      { path: '/profile', methods: ['get'] },
      { path: '/reportees', methods: ['get'] },
      { path: '/reviewees', methods: ['get'] },
      { path: '/appraisees', methods: ['get'] },
      { path: '/', methods: ['get'] },
      { path: '/', methods: ['post'] },
      { path: '/:id', methods: ['get'] },
      { path: '/:id', methods: ['put'] },
    ],
  );
  assert.ok(authorizeCalls.some((roles) => roles.includes('HR')));
});

test('cycle routes include active, pending-work, phase, and delete operations', () => {
  const cyclesPath = path.join(__dirname, '../../../src/routes/cycles.js');
  const { router } = loadRouter(cyclesPath, makeControllerMock([
    'getActiveCycle',
    'getAllCycles',
    'createCycle',
    'getCycleById',
    'getPendingWork',
    'updateCycle',
    'advancePhase',
    'closeCycle',
    'deleteCycle',
  ]));

  assert.deepEqual(
    getRouteDescriptors(router).map(({ path, methods }) => ({ path, methods })),
    [
      { path: '/active', methods: ['get'] },
      { path: '/', methods: ['get'] },
      { path: '/', methods: ['post'] },
      { path: '/:id', methods: ['get'] },
      { path: '/:id/pending-work', methods: ['get'] },
      { path: '/:id', methods: ['put'] },
      { path: '/:id/advance-phase', methods: ['post'] },
      { path: '/:id/close', methods: ['post'] },
      { path: '/:id', methods: ['delete'] },
    ],
  );
});

test('kpa routes expose employee and officer flows', () => {
  const kpaPath = path.join(__dirname, '../../../src/routes/kpa.js');
  const { router } = loadRouter(kpaPath, makeControllerMock([
    'createKpa',
    'getMyKpas',
    'submitKpas',
    'updateKpa',
    'deleteKpa',
    'reviewKpas',
    'getKpasForOfficer',
    'getEmployeeKpas',
  ]));

  assert.deepEqual(
    getRouteDescriptors(router).map(({ path, methods }) => ({ path, methods })),
    [
      { path: '/cycle/:cycleId', methods: ['post'] },
      { path: '/cycle/:cycleId/my', methods: ['get'] },
      { path: '/cycle/:cycleId/submit', methods: ['post'] },
      { path: '/:id', methods: ['put'] },
      { path: '/:id', methods: ['delete'] },
      { path: '/cycle/:cycleId/employee/:userId/review', methods: ['post'] },
      { path: '/cycle/:cycleId/team', methods: ['get'] },
      { path: '/cycle/:cycleId/employee/:userId', methods: ['get'] },
    ],
  );
});

test('mid-year routes expose employee and officer review paths', () => {
  const midYearPath = path.join(__dirname, '../../../src/routes/midYear.js');
  const { router } = loadRouter(midYearPath, makeControllerMock([
    'getMyMidYear',
    'saveMyMidYear',
    'submitMyMidYear',
    'getTeamMidYear',
    'addRemarks',
    'getEmployeeMidYear',
  ]));

  assert.deepEqual(
    getRouteDescriptors(router).map(({ path, methods }) => ({ path, methods })),
    [
      { path: '/cycle/:cycleId/my', methods: ['get'] },
      { path: '/cycle/:cycleId', methods: ['post'] },
      { path: '/cycle/:cycleId/submit', methods: ['post'] },
      { path: '/cycle/:cycleId/team', methods: ['get'] },
      { path: '/cycle/:cycleId/employee/:userId/remarks', methods: ['post'] },
      { path: '/cycle/:cycleId/employee/:userId', methods: ['get'] },
    ],
  );
});

test('appraisal routes include self, officer, rating, and HR finalization endpoints', () => {
  const appraisalPath = path.join(__dirname, '../../../src/routes/appraisal.js');
  const { router } = loadRouter(appraisalPath, makeControllerMock([
    'getMyAppraisal',
    'updateSelfAssessment',
    'submitAppraisal',
    'getEmployeeAppraisal',
    'saveKpaRatings',
    'saveAttributeRatings',
    'reportingOfficerAction',
    'reviewingOfficerAction',
    'acceptingOfficerAction',
    'getTeamAppraisals',
    'hrFinalizeAll',
  ]));

  assert.deepEqual(
    getRouteDescriptors(router).map(({ path, methods }) => ({ path, methods })),
    [
      { path: '/cycle/:cycleId/my', methods: ['get'] },
      { path: '/cycle/:cycleId/self-assessment', methods: ['put'] },
      { path: '/cycle/:cycleId/submit', methods: ['post'] },
      { path: '/cycle/:cycleId/employee/:userId', methods: ['get'] },
      { path: '/:appraisalId/kpa-ratings', methods: ['post'] },
      { path: '/:appraisalId/attribute-ratings', methods: ['post'] },
      { path: '/cycle/:cycleId/employee/:userId/reporting-done', methods: ['post'] },
      { path: '/cycle/:cycleId/employee/:userId/reviewing-done', methods: ['post'] },
      { path: '/cycle/:cycleId/employee/:userId/accepting-done', methods: ['post'] },
      { path: '/cycle/:cycleId/team', methods: ['get'] },
      { path: '/cycle/:cycleId/finalize-all', methods: ['post'] },
    ],
  );
});

test('ceo routes expose the dashboard endpoints behind MD authorization', () => {
  const ceoPath = path.join(__dirname, '../../../src/routes/ceo.js');
  const { router, authorizeCalls } = loadRouter(ceoPath, makeControllerMock(['getDashboard']));

  assert.deepEqual(
    getRouteDescriptors(router).map(({ path, methods }) => ({ path, methods })),
    [
      { path: '/dashboard', methods: ['get'] },
      { path: '/dashboard/:cycleId', methods: ['get'] },
    ],
  );
  assert.ok(authorizeCalls.some((roles) => roles.includes('MANAGING_DIRECTOR')));
});

test('report, audit, and attribute routers expose their expected endpoints', () => {
  const reportPath = path.join(__dirname, '../../../src/routes/reports.js');
  const auditPath = path.join(__dirname, '../../../src/routes/audit.js');
  const attributePath = path.join(__dirname, '../../../src/routes/attributes.js');

  const reportRouter = loadRouter(reportPath, makeControllerMock([
    'individualReport',
    'exportIndividualPDF',
    'departmentSummary',
    'exportDepartmentExcel',
    'ratingDistribution',
    'cycleProgress',
  ])).router;
  const auditRouter = loadRouter(auditPath, makeControllerMock(['getMyAuditLogs', 'getAuditLogs'])).router;
  const attributeRouter = loadRouter(attributePath, makeControllerMock(['getAllAttributes', 'createAttribute', 'updateAttribute', 'deleteAttribute'])).router;

  assert.deepEqual(
    getRouteDescriptors(reportRouter).map(({ path, methods }) => ({ path, methods })),
    [
      { path: '/cycle/:cycleId/individual/:userId', methods: ['get'] },
      { path: '/cycle/:cycleId/individual/:userId/export', methods: ['get'] },
      { path: '/cycle/:cycleId/department', methods: ['get'] },
      { path: '/cycle/:cycleId/department/export', methods: ['get'] },
      { path: '/cycle/:cycleId/distribution', methods: ['get'] },
      { path: '/cycle/:cycleId/progress', methods: ['get'] },
    ],
  );

  assert.deepEqual(
    getRouteDescriptors(auditRouter).map(({ path, methods }) => ({ path, methods })),
    [
      { path: '/my', methods: ['get'] },
      { path: '/', methods: ['get'] },
    ],
  );

  assert.deepEqual(
    getRouteDescriptors(attributeRouter).map(({ path, methods }) => ({ path, methods })),
    [
      { path: '/', methods: ['get'] },
      { path: '/', methods: ['post'] },
      { path: '/:id', methods: ['put'] },
      { path: '/:id', methods: ['delete'] },
    ],
  );
});
