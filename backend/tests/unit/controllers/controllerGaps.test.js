const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy, createRes } = require('../../helpers/spies');

const cycleControllerPath = path.join(__dirname, '../../../src/controllers/cycleController.js');
const kpaControllerPath = path.join(__dirname, '../../../src/controllers/kpaController.js');
const midYearControllerPath = path.join(__dirname, '../../../src/controllers/midYearController.js');
const appraisalControllerPath = path.join(__dirname, '../../../src/controllers/appraisalController.js');
const reportControllerPath = path.join(__dirname, '../../../src/controllers/reportController.js');
const attributeControllerPath = path.join(__dirname, '../../../src/controllers/attributeController.js');
const auditControllerPath = path.join(__dirname, '../../../src/controllers/auditController.js');
const userControllerPath = path.join(__dirname, '../../../src/controllers/userController.js');

function emptyAudit() {
  return { logAudit: createAsyncSpy(async () => undefined) };
}

function userServiceStub(overrides = {}) {
  return {
    createUser: createAsyncSpy(async () => undefined),
    getAllUsers: createAsyncSpy(async () => []),
    getUserById: createAsyncSpy(async () => undefined),
    updateUser: createAsyncSpy(async () => undefined),
    getReportees: createAsyncSpy(async () => []),
    getReviewees: createAsyncSpy(async () => []),
    getAppraisees: createAsyncSpy(async () => []),
    ...overrides,
  };
}

function cycleServiceStub(overrides = {}) {
  return {
    createCycle: createAsyncSpy(async () => undefined),
    getAllCycles: createAsyncSpy(async () => []),
    getCycleById: createAsyncSpy(async () => undefined),
    getActiveCycle: createAsyncSpy(async () => []),
    updateCycle: createAsyncSpy(async () => undefined),
    advancePhase: createAsyncSpy(async () => undefined),
    closeCycle: createAsyncSpy(async () => undefined),
    deleteCycle: createAsyncSpy(async () => undefined),
    getPendingWork: createAsyncSpy(async () => ({ pendingCount: 0, pendingEmployees: [] })),
    ...overrides,
  };
}

function kpaServiceStub(overrides = {}) {
  return {
    createKpa: createAsyncSpy(async () => undefined),
    getKpas: createAsyncSpy(async () => []),
    updateKpa: createAsyncSpy(async () => undefined),
    deleteKpa: createAsyncSpy(async () => undefined),
    submitKpas: createAsyncSpy(async () => ({ count: 0 })),
    getKpasForOfficer: createAsyncSpy(async () => []),
    reviewKpas: createAsyncSpy(async () => ({ message: 'ok' })),
    ...overrides,
  };
}

function midYearServiceStub(overrides = {}) {
  return {
    createOrUpdateMidYear: createAsyncSpy(async () => undefined),
    submitMidYear: createAsyncSpy(async () => undefined),
    getMidYearById: createAsyncSpy(async () => undefined),
    addReportingRemarks: createAsyncSpy(async () => undefined),
    getMidYearForOfficer: createAsyncSpy(async () => []),
    ...overrides,
  };
}

function appraisalServiceStub(overrides = {}) {
  return {
    getOrCreateAppraisal: createAsyncSpy(async () => undefined),
    getAppraisalFull: createAsyncSpy(async () => undefined),
    updateSelfAssessment: createAsyncSpy(async () => undefined),
    submitAppraisal: createAsyncSpy(async () => undefined),
    saveKpaRatings: createAsyncSpy(async () => []),
    saveAttributeRatings: createAsyncSpy(async () => []),
    advanceAppraisalStatus: createAsyncSpy(async () => undefined),
    getAppraisalsForOfficer: createAsyncSpy(async () => []),
    hrFinalizeAll: createAsyncSpy(async () => []),
    ...overrides,
  };
}

// ---------- userController gaps ----------

test('userController.getProfile loads the authenticated user', async () => {
  const getUserById = createAsyncSpy(async () => ({ id: 'me', name: 'Me' }));
  const controller = loadModule(userControllerPath, {
    '../services/userService': userServiceStub({ getUserById }),
    '../utils/auditLogger': emptyAudit(),
  });

  const res = createRes();
  await controller.getProfile({ user: { id: 'me' } }, res, () => {});

  assert.equal(getUserById.calls[0][0], 'me');
  assert.equal(res.body.user.name, 'Me');
});

test('userController.getAllUsers forwards query filters to the service', async () => {
  const getAllUsers = createAsyncSpy(async () => ([{ id: 'u1' }]));
  const controller = loadModule(userControllerPath, {
    '../services/userService': userServiceStub({ getAllUsers }),
    '../utils/auditLogger': emptyAudit(),
  });

  const res = createRes();
  await controller.getAllUsers({ query: { role: 'HR' } }, res, () => {});

  assert.deepEqual(getAllUsers.calls[0][0], { role: 'HR' });
  assert.equal(res.body.users.length, 1);
});

test('userController.getMyReportees, getMyReviewees, getMyAppraisees use the logged-in officer id', async () => {
  const getReportees = createAsyncSpy(async () => ([]));
  const getReviewees = createAsyncSpy(async () => ([]));
  const getAppraisees = createAsyncSpy(async () => ([]));
  const controller = loadModule(userControllerPath, {
    '../services/userService': userServiceStub({ getReportees, getReviewees, getAppraisees }),
    '../utils/auditLogger': emptyAudit(),
  });

  const req = { user: { id: 'off-1' } };
  await controller.getMyReportees(req, createRes(), () => {});
  await controller.getMyReviewees(req, createRes(), () => {});
  await controller.getMyAppraisees(req, createRes(), () => {});

  assert.equal(getReportees.calls[0][0], 'off-1');
  assert.equal(getReviewees.calls[0][0], 'off-1');
  assert.equal(getAppraisees.calls[0][0], 'off-1');
});

// ---------- cycleController gaps ----------

test('cycleController.advancePhase logs the phase change with the new state', async () => {
  const advancePhase = createAsyncSpy(async () => ({ id: 'c1', phase: 'MID_YEAR_REVIEW', status: 'ACTIVE' }));
  const logAudit = createAsyncSpy(async () => undefined);
  const controller = loadModule(cycleControllerPath, {
    '../services/cycleService': cycleServiceStub({ advancePhase }),
    '../utils/auditLogger': { logAudit },
  });

  const res = createRes();
  await controller.advancePhase({ params: { id: 'c1' }, user: { id: 'hr-1' } }, res, () => {});

  assert.equal(advancePhase.calls.length, 1);
  assert.equal(logAudit.calls[0][0].action, 'ADVANCE_PHASE');
  assert.equal(res.body.cycle.phase, 'MID_YEAR_REVIEW');
});

test('cycleController.closeCycle closes the cycle and audits the action', async () => {
  const closeCycle = createAsyncSpy(async () => ({ id: 'c1', status: 'CLOSED' }));
  const logAudit = createAsyncSpy(async () => undefined);
  const controller = loadModule(cycleControllerPath, {
    '../services/cycleService': cycleServiceStub({ closeCycle }),
    '../utils/auditLogger': { logAudit },
  });

  const res = createRes();
  await controller.closeCycle({ params: { id: 'c1' }, user: { id: 'hr-1' } }, res, () => {});

  assert.equal(closeCycle.calls.length, 1);
  assert.equal(logAudit.calls[0][0].action, 'CLOSE_CYCLE');
});

test('cycleController.deleteCycle delegates to the service and audits the deletion', async () => {
  const deleteCycle = createAsyncSpy(async () => undefined);
  const logAudit = createAsyncSpy(async () => undefined);
  const controller = loadModule(cycleControllerPath, {
    '../services/cycleService': cycleServiceStub({ deleteCycle }),
    '../utils/auditLogger': { logAudit },
  });

  const res = createRes();
  await controller.deleteCycle({ params: { id: 'c1' }, user: { id: 'hr-1' } }, res, () => {});

  assert.equal(deleteCycle.calls[0][0], 'c1');
  assert.equal(logAudit.calls[0][0].action, 'DELETE_CYCLE');
  assert.match(res.body.message, /deleted/i);
});

test('cycleController.getActiveCycle returns active cycles', async () => {
  const getActiveCycle = createAsyncSpy(async () => ([{ id: 'c1' }]));
  const controller = loadModule(cycleControllerPath, {
    '../services/cycleService': cycleServiceStub({ getActiveCycle }),
    '../utils/auditLogger': emptyAudit(),
  });

  const res = createRes();
  await controller.getActiveCycle({}, res, () => {});

  assert.equal(res.body.cycles.length, 1);
});

test('cycleController.getCycleById and getAllCycles call through to the service', async () => {
  const getCycleById = createAsyncSpy(async () => ({ id: 'c1' }));
  const getAllCycles = createAsyncSpy(async () => ([]));
  const controller = loadModule(cycleControllerPath, {
    '../services/cycleService': cycleServiceStub({ getCycleById, getAllCycles }),
    '../utils/auditLogger': emptyAudit(),
  });

  await controller.getCycleById({ params: { id: 'c1' } }, createRes(), () => {});
  await controller.getAllCycles({ query: { year: '2026' } }, createRes(), () => {});

  assert.equal(getCycleById.calls[0][0], 'c1');
  assert.deepEqual(getAllCycles.calls[0][0], { year: '2026' });
});

test('cycleController.updateCycle audits the update and returns the cycle', async () => {
  const updateCycle = createAsyncSpy(async () => ({ id: 'c1', status: 'ACTIVE' }));
  const logAudit = createAsyncSpy(async () => undefined);
  const controller = loadModule(cycleControllerPath, {
    '../services/cycleService': cycleServiceStub({ updateCycle }),
    '../utils/auditLogger': { logAudit },
  });

  const res = createRes();
  await controller.updateCycle({ params: { id: 'c1' }, body: { status: 'ACTIVE' }, user: { id: 'hr-1' } }, res, () => {});

  assert.equal(updateCycle.calls[0][0], 'c1');
  assert.equal(logAudit.calls[0][0].action, 'UPDATE_CYCLE');
});

// ---------- kpaController gaps ----------

test('kpaController.getMyKpas uses the logged-in user', async () => {
  const getKpas = createAsyncSpy(async () => ([{ id: 'k1' }]));
  const controller = loadModule(kpaControllerPath, {
    '../services/kpaService': kpaServiceStub({ getKpas }),
    '../utils/auditLogger': emptyAudit(),
  });

  const res = createRes();
  await controller.getMyKpas({ user: { id: 'u1' }, params: { cycleId: 'c1' } }, res, () => {});

  assert.deepEqual(getKpas.calls[0], ['u1', 'c1']);
  assert.equal(res.body.kpas.length, 1);
});

test('kpaController.updateKpa audits and returns the updated KPA', async () => {
  const updateKpa = createAsyncSpy(async () => ({ id: 'k1', title: 'Updated' }));
  const logAudit = createAsyncSpy(async () => undefined);
  const controller = loadModule(kpaControllerPath, {
    '../services/kpaService': kpaServiceStub({ updateKpa }),
    '../utils/auditLogger': { logAudit },
  });

  const res = createRes();
  await controller.updateKpa({ params: { id: 'k1' }, body: { title: 'Updated' }, user: { id: 'u1' } }, res, () => {});

  assert.equal(updateKpa.calls[0][0], 'k1');
  assert.equal(logAudit.calls[0][0].action, 'UPDATE_KPA');
  assert.equal(res.body.kpa.title, 'Updated');
});

test('kpaController.deleteKpa removes the KPA and audits the action', async () => {
  const deleteKpa = createAsyncSpy(async () => undefined);
  const logAudit = createAsyncSpy(async () => undefined);
  const controller = loadModule(kpaControllerPath, {
    '../services/kpaService': kpaServiceStub({ deleteKpa }),
    '../utils/auditLogger': { logAudit },
  });

  const res = createRes();
  await controller.deleteKpa({ params: { id: 'k1' }, user: { id: 'u1' } }, res, () => {});

  assert.equal(deleteKpa.calls.length, 1);
  assert.match(res.body.message, /deleted/i);
});

test('kpaController.submitKpas reports the submitted count', async () => {
  const submitKpas = createAsyncSpy(async () => ({ message: 'ok', count: 3 }));
  const controller = loadModule(kpaControllerPath, {
    '../services/kpaService': kpaServiceStub({ submitKpas }),
    '../utils/auditLogger': emptyAudit(),
  });

  const res = createRes();
  await controller.submitKpas({ user: { id: 'u1' }, params: { cycleId: 'c1' } }, res, () => {});

  assert.equal(res.body.count, 3);
});

test('kpaController.reviewKpas appends action into audit metadata', async () => {
  const reviewKpas = createAsyncSpy(async () => ({ message: 'accepted' }));
  const logAudit = createAsyncSpy(async () => undefined);
  const controller = loadModule(kpaControllerPath, {
    '../services/kpaService': kpaServiceStub({ reviewKpas }),
    '../utils/auditLogger': { logAudit },
  });

  const res = createRes();
  await controller.reviewKpas({
    user: { id: 'off-1' },
    params: { cycleId: 'c1', userId: 'emp-1' },
    body: { action: 'ACCEPT', remarks: null },
  }, res, () => {});

  assert.equal(reviewKpas.calls[0][3], 'ACCEPT');
  assert.equal(logAudit.calls[0][0].action, 'REVIEW_KPAS_ACCEPT');
});

test('kpaController.getKpasForOfficer and getEmployeeKpas dispatch correctly', async () => {
  const getKpasForOfficer = createAsyncSpy(async () => ([{ id: 'k1' }]));
  const getKpas = createAsyncSpy(async () => ([{ id: 'k2' }]));
  const controller = loadModule(kpaControllerPath, {
    '../services/kpaService': kpaServiceStub({ getKpasForOfficer, getKpas }),
    '../utils/auditLogger': emptyAudit(),
  });

  await controller.getKpasForOfficer({ user: { id: 'off-1' }, params: { cycleId: 'c1' } }, createRes(), () => {});
  await controller.getEmployeeKpas({ params: { cycleId: 'c1', userId: 'emp-1' } }, createRes(), () => {});

  assert.equal(getKpasForOfficer.calls[0][0], 'off-1');
  assert.deepEqual(getKpas.calls[0], ['emp-1', 'c1']);
});

// ---------- midYearController gaps ----------

test('midYearController.saveMyMidYear and submitMyMidYear delegate to the service', async () => {
  const createOrUpdateMidYear = createAsyncSpy(async () => ({ id: 'r1' }));
  const submitMidYear = createAsyncSpy(async () => ({ id: 'r1', status: 'SUBMITTED' }));
  const controller = loadModule(midYearControllerPath, {
    '../services/midYearService': midYearServiceStub({ createOrUpdateMidYear, submitMidYear }),
    '../utils/auditLogger': emptyAudit(),
  });

  await controller.saveMyMidYear({ user: { id: 'u1' }, params: { cycleId: 'c1' }, body: { progress: 'ok' } }, createRes(), () => {});
  await controller.submitMyMidYear({ user: { id: 'u1' }, params: { cycleId: 'c1' } }, createRes(), () => {});

  assert.equal(createOrUpdateMidYear.calls.length, 1);
  assert.equal(submitMidYear.calls.length, 1);
});

test('midYearController.getMyMidYear and getEmployeeMidYear pull the right user', async () => {
  const getMidYearById = createAsyncSpy(async (userId) => ({ id: 'r1', userId }));
  const controller = loadModule(midYearControllerPath, {
    '../services/midYearService': midYearServiceStub({ getMidYearById }),
    '../utils/auditLogger': emptyAudit(),
  });

  const myRes = createRes();
  await controller.getMyMidYear({ user: { id: 'u1' }, params: { cycleId: 'c1' } }, myRes, () => {});
  const otherRes = createRes();
  await controller.getEmployeeMidYear({ params: { userId: 'emp-1', cycleId: 'c1' } }, otherRes, () => {});

  assert.equal(myRes.body.review.userId, 'u1');
  assert.equal(otherRes.body.review.userId, 'emp-1');
});

test('midYearController.getTeamMidYear lists reviews for the officer', async () => {
  const getMidYearForOfficer = createAsyncSpy(async () => ([{ id: 'r1' }]));
  const controller = loadModule(midYearControllerPath, {
    '../services/midYearService': midYearServiceStub({ getMidYearForOfficer }),
    '../utils/auditLogger': emptyAudit(),
  });

  const res = createRes();
  await controller.getTeamMidYear({ user: { id: 'off-1' }, params: { cycleId: 'c1' } }, res, () => {});

  assert.equal(getMidYearForOfficer.calls[0][0], 'off-1');
  assert.equal(res.body.reviews.length, 1);
});

// ---------- appraisalController gaps ----------

test('appraisalController.updateSelfAssessment and submitAppraisal log audit entries', async () => {
  const updateSelfAssessment = createAsyncSpy(async () => ({ id: 'a1' }));
  const submitAppraisal = createAsyncSpy(async () => ({ id: 'a1', status: 'SUBMITTED' }));
  const logAudit = createAsyncSpy(async () => undefined);
  const controller = loadModule(appraisalControllerPath, {
    '../services/appraisalService': appraisalServiceStub({ updateSelfAssessment, submitAppraisal }),
    '../utils/auditLogger': { logAudit },
  });

  await controller.updateSelfAssessment({
    user: { id: 'u1' }, params: { cycleId: 'c1' }, body: { achievements: 'Did things' },
  }, createRes(), () => {});
  await controller.submitAppraisal({ user: { id: 'u1' }, params: { cycleId: 'c1' } }, createRes(), () => {});

  assert.equal(updateSelfAssessment.calls.length, 1);
  assert.equal(submitAppraisal.calls.length, 1);
  assert.equal(logAudit.calls.length, 2);
  assert.equal(logAudit.calls[0][0].action, 'UPDATE_SELF_ASSESSMENT');
  assert.equal(logAudit.calls[1][0].action, 'SUBMIT_APPRAISAL');
});

test('appraisalController officer actions pass the correct expectedStatus', async () => {
  const advanceAppraisalStatus = createAsyncSpy(async () => ({ id: 'a1' }));
  const logAudit = createAsyncSpy(async () => undefined);
  const controller = loadModule(appraisalControllerPath, {
    '../services/appraisalService': appraisalServiceStub({ advanceAppraisalStatus }),
    '../utils/auditLogger': { logAudit },
  });

  const req = (officer) => ({
    user: { id: officer },
    params: { cycleId: 'c1', userId: 'u1' },
    body: { remarks: 'remarks' },
  });

  await controller.reportingOfficerAction(req('rep-1'), createRes(), () => {});
  await controller.reviewingOfficerAction(req('rev-1'), createRes(), () => {});
  await controller.acceptingOfficerAction(req('acc-1'), createRes(), () => {});

  assert.equal(advanceAppraisalStatus.calls[0][4], 'SUBMITTED');
  assert.equal(advanceAppraisalStatus.calls[1][4], 'REPORTING_DONE');
  assert.equal(advanceAppraisalStatus.calls[2][4], 'REVIEWING_DONE');

  assert.equal(logAudit.calls[0][0].action, 'REPORTING_DONE');
  assert.equal(logAudit.calls[1][0].action, 'REVIEWING_DONE');
  assert.equal(logAudit.calls[2][0].action, 'ACCEPTING_DONE');
});

test('appraisalController.saveKpaRatings and saveAttributeRatings forward ratings and audit', async () => {
  const saveKpaRatings = createAsyncSpy(async () => ([{ id: 'r1' }]));
  const saveAttributeRatings = createAsyncSpy(async () => ([{ id: 'r2' }]));
  const logAudit = createAsyncSpy(async () => undefined);
  const controller = loadModule(appraisalControllerPath, {
    '../services/appraisalService': appraisalServiceStub({ saveKpaRatings, saveAttributeRatings }),
    '../utils/auditLogger': { logAudit },
  });

  await controller.saveKpaRatings({
    user: { id: 'off-1' }, params: { appraisalId: 'a1' }, body: { ratings: [{ kpaGoalId: 'k1', rating: 30 }] },
  }, createRes(), () => {});

  await controller.saveAttributeRatings({
    user: { id: 'off-1' }, params: { appraisalId: 'a1' }, body: { ratings: [{ attributeId: 'att-1', rating: 4 }] },
  }, createRes(), () => {});

  assert.equal(saveKpaRatings.calls[0][1], 'a1');
  assert.equal(saveAttributeRatings.calls[0][1], 'a1');
  assert.equal(logAudit.calls[0][0].action, 'SAVE_KPA_RATINGS');
  assert.equal(logAudit.calls[1][0].action, 'SAVE_ATTRIBUTE_RATINGS');
});

test('appraisalController.getEmployeeAppraisal returns the targeted user appraisal', async () => {
  const getAppraisalFull = createAsyncSpy(async () => ({ id: 'a1', userId: 'u1' }));
  const controller = loadModule(appraisalControllerPath, {
    '../services/appraisalService': appraisalServiceStub({ getAppraisalFull }),
    '../utils/auditLogger': emptyAudit(),
  });

  const res = createRes();
  await controller.getEmployeeAppraisal({ params: { cycleId: 'c1', userId: 'u1' } }, res, () => {});

  assert.deepEqual(getAppraisalFull.calls[0], ['u1', 'c1']);
  assert.equal(res.body.appraisal.userId, 'u1');
});

test('appraisalController.getTeamAppraisals queries by officer id and role', async () => {
  const getAppraisalsForOfficer = createAsyncSpy(async () => ([{ id: 'a1' }]));
  const controller = loadModule(appraisalControllerPath, {
    '../services/appraisalService': appraisalServiceStub({ getAppraisalsForOfficer }),
    '../utils/auditLogger': emptyAudit(),
  });

  const res = createRes();
  await controller.getTeamAppraisals({ user: { id: 'off-1', role: 'REPORTING' }, params: { cycleId: 'c1' } }, res, () => {});

  assert.deepEqual(getAppraisalsForOfficer.calls[0], ['off-1', 'c1', 'REPORTING']);
  assert.equal(res.body.appraisals.length, 1);
});

// ---------- reportController gaps ----------

test('reportController.individualReport returns the assembled report', async () => {
  const individualReport = createAsyncSpy(async () => ({ user: { id: 'u1' }, kpas: [], appraisal: null, midYear: null }));
  const controller = loadModule(reportControllerPath, {
    '../services/reportService': {
      individualReport,
      departmentSummary: createAsyncSpy(async () => undefined),
      ratingDistribution: createAsyncSpy(async () => undefined),
      cycleProgress: createAsyncSpy(async () => undefined),
    },
    '../utils/exportService': {
      generateIndividualPDF: () => undefined,
      generateDepartmentExcel: () => undefined,
    },
  });

  const res = createRes();
  await controller.individualReport({ params: { userId: 'u1', cycleId: 'c1' } }, res, () => {});

  assert.equal(res.body.report.user.id, 'u1');
});

test('reportController.ratingDistribution and cycleProgress return their service payloads', async () => {
  const ratingDistribution = createAsyncSpy(async () => ({ total: 0 }));
  const cycleProgress = createAsyncSpy(async () => ({ goalProgress: {} }));
  const controller = loadModule(reportControllerPath, {
    '../services/reportService': {
      individualReport: createAsyncSpy(async () => undefined),
      departmentSummary: createAsyncSpy(async () => undefined),
      ratingDistribution,
      cycleProgress,
    },
    '../utils/exportService': {
      generateIndividualPDF: () => undefined,
      generateDepartmentExcel: () => undefined,
    },
  });

  const distRes = createRes();
  await controller.ratingDistribution({ params: { cycleId: 'c1' } }, distRes, () => {});
  const progRes = createRes();
  await controller.cycleProgress({ params: { cycleId: 'c1' } }, progRes, () => {});

  assert.deepEqual(distRes.body.distribution, { total: 0 });
  assert.deepEqual(progRes.body.progress, { goalProgress: {} });
});

test('reportController.exportIndividualPDF streams the PDF after building the report', async () => {
  const individualReport = createAsyncSpy(async () => ({ user: { name: 'Alice' } }));
  const generateIndividualPDF = createAsyncSpy(async () => undefined);
  const controller = loadModule(reportControllerPath, {
    '../services/reportService': {
      individualReport,
      departmentSummary: createAsyncSpy(async () => undefined),
      ratingDistribution: createAsyncSpy(async () => undefined),
      cycleProgress: createAsyncSpy(async () => undefined),
    },
    '../utils/exportService': {
      generateIndividualPDF,
      generateDepartmentExcel: () => undefined,
    },
  });

  await controller.exportIndividualPDF({ params: { userId: 'u1', cycleId: 'c1' } }, createRes(), () => {});

  assert.equal(individualReport.calls.length, 1);
  assert.equal(generateIndividualPDF.calls.length, 1);
});

test('reportController.departmentSummary returns the grouped summary', async () => {
  const departmentSummary = createAsyncSpy(async () => ([{ department: 'Eng' }]));
  const controller = loadModule(reportControllerPath, {
    '../services/reportService': {
      individualReport: createAsyncSpy(async () => undefined),
      departmentSummary,
      ratingDistribution: createAsyncSpy(async () => undefined),
      cycleProgress: createAsyncSpy(async () => undefined),
    },
    '../utils/exportService': {
      generateIndividualPDF: () => undefined,
      generateDepartmentExcel: () => undefined,
    },
  });

  const res = createRes();
  await controller.departmentSummary({ params: { cycleId: 'c1' }, query: {} }, res, () => {});

  assert.equal(departmentSummary.calls[0][0], 'c1');
  assert.equal(res.body.summary.length, 1);
});

// ---------- attributeController gaps ----------

test('attributeController.createAttribute returns 201 with the created attribute', async () => {
  const create = createAsyncSpy(async ({ data }) => ({ id: 'attr-1', ...data }));
  const controller = loadModule(attributeControllerPath, {
    '../utils/prisma': {
      attributeMaster: { create, findMany: createAsyncSpy(async () => []), update: createAsyncSpy(async () => undefined) },
    },
  });

  const res = createRes();
  await controller.createAttribute({ body: { name: 'Teamwork', type: 'VALUES' } }, res, () => {});

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.attribute.name, 'Teamwork');
});

test('attributeController.updateAttribute returns the updated attribute', async () => {
  const update = createAsyncSpy(async ({ data }) => ({ id: 'attr-1', ...data }));
  const controller = loadModule(attributeControllerPath, {
    '../utils/prisma': {
      attributeMaster: { create: createAsyncSpy(async () => undefined), findMany: createAsyncSpy(async () => []), update },
    },
  });

  const res = createRes();
  await controller.updateAttribute({ params: { id: 'attr-1' }, body: { name: 'Updated' } }, res, () => {});

  assert.equal(update.calls[0][0].where.id, 'attr-1');
  assert.equal(res.body.attribute.name, 'Updated');
});

test('attributeController.deleteAttribute soft-deletes by setting isActive false', async () => {
  const update = createAsyncSpy(async () => undefined);
  const controller = loadModule(attributeControllerPath, {
    '../utils/prisma': {
      attributeMaster: { create: createAsyncSpy(async () => undefined), findMany: createAsyncSpy(async () => []), update },
    },
  });

  const res = createRes();
  await controller.deleteAttribute({ params: { id: 'attr-1' } }, res, () => {});

  assert.deepEqual(update.calls[0][0].data, { isActive: false });
  assert.match(res.body.message, /deactivated/i);
});

// ---------- auditController gap ----------

test('auditController.getMyAuditLogs returns the latest 100 logs for the user', async () => {
  const findMany = createAsyncSpy(async () => ([{ id: 'log-1' }]));
  const controller = loadModule(auditControllerPath, {
    '../utils/prisma': { auditLog: { findMany, count: createAsyncSpy(async () => 0) } },
  });

  const res = createRes();
  await controller.getMyAuditLogs({ user: { id: 'u1' } }, res, () => {});

  assert.equal(findMany.calls[0][0].where.userId, 'u1');
  assert.equal(findMany.calls[0][0].take, 100);
  assert.equal(res.body.logs.length, 1);
});
