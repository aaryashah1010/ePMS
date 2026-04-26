const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy, createRes } = require('../../helpers/spies');

const kpaControllerPath = path.join(__dirname, '../../../src/controllers/kpaController.js');
const midYearControllerPath = path.join(__dirname, '../../../src/controllers/midYearController.js');
const appraisalControllerPath = path.join(__dirname, '../../../src/controllers/appraisalController.js');

test('kpaController.createKpa uses the logged-in user and returns 201', async () => {
  const createKpa = createAsyncSpy(async () => ({ id: 'kpa-1', title: 'Delivery' }));

  const controller = loadModule(kpaControllerPath, {
    '../services/kpaService': {
      createKpa,
      getKpas: createAsyncSpy(async () => []),
      updateKpa: createAsyncSpy(async () => undefined),
      deleteKpa: createAsyncSpy(async () => undefined),
      submitKpas: createAsyncSpy(async () => ({ count: 0 })),
      getKpasForOfficer: createAsyncSpy(async () => []),
      reviewKpas: createAsyncSpy(async () => ({ message: 'ok' })),
    },
    '../utils/auditLogger': { logAudit: createAsyncSpy(async () => undefined) },
  });

  const res = createRes();
  await controller.createKpa({ user: { id: 'user-1' }, params: { cycleId: 'cycle-1' }, body: { title: 'Delivery' } }, res, () => {});

  assert.equal(createKpa.calls[0][0], 'user-1');
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.kpa.id, 'kpa-1');
});

test('midYearController.addRemarks maps body fields into the service call', async () => {
  const addReportingRemarks = createAsyncSpy(async () => ({ id: 'review-1', status: 'REPORTING_DONE' }));

  const controller = loadModule(midYearControllerPath, {
    '../services/midYearService': {
      createOrUpdateMidYear: createAsyncSpy(async () => undefined),
      submitMidYear: createAsyncSpy(async () => undefined),
      getMidYearById: createAsyncSpy(async () => undefined),
      addReportingRemarks,
      getMidYearForOfficer: createAsyncSpy(async () => []),
    },
    '../utils/auditLogger': { logAudit: createAsyncSpy(async () => undefined) },
  });

  const res = createRes();
  await controller.addRemarks({
    user: { id: 'officer-1' },
    params: { userId: 'user-1', cycleId: 'cycle-1' },
    body: { remarks: 'Looks fine', rating: 4.4 },
  }, res, () => {});

  assert.deepEqual(addReportingRemarks.calls[0], ['officer-1', 'user-1', 'cycle-1', 'Looks fine', 4.4]);
  assert.equal(res.body.review.status, 'REPORTING_DONE');
});

test('appraisalController.getMyAppraisal creates then loads the appraisal', async () => {
  const getOrCreateAppraisal = createAsyncSpy(async () => ({ id: 'appraisal-1' }));
  const getAppraisalFull = createAsyncSpy(async () => ({ id: 'appraisal-1', status: 'DRAFT' }));

  const controller = loadModule(appraisalControllerPath, {
    '../services/appraisalService': {
      getOrCreateAppraisal,
      getAppraisalFull,
      updateSelfAssessment: createAsyncSpy(async () => undefined),
      submitAppraisal: createAsyncSpy(async () => undefined),
      saveKpaRatings: createAsyncSpy(async () => []),
      saveAttributeRatings: createAsyncSpy(async () => []),
      advanceAppraisalStatus: createAsyncSpy(async () => undefined),
      getAppraisalsForOfficer: createAsyncSpy(async () => []),
      hrFinalizeAll: createAsyncSpy(async () => []),
    },
    '../utils/auditLogger': { logAudit: createAsyncSpy(async () => undefined) },
  });

  const res = createRes();
  await controller.getMyAppraisal({ user: { id: 'user-1' }, params: { cycleId: 'cycle-1' } }, res, () => {});

  assert.equal(getOrCreateAppraisal.calls.length, 1);
  assert.equal(getAppraisalFull.calls.length, 1);
  assert.equal(res.body.appraisal.id, 'appraisal-1');
});

test('appraisalController.hrFinalizeAll returns the number of finalized appraisals', async () => {
  const hrFinalizeAll = createAsyncSpy(async () => ([{ id: 'a1' }, { id: 'a2' }]));

  const controller = loadModule(appraisalControllerPath, {
    '../services/appraisalService': {
      getOrCreateAppraisal: createAsyncSpy(async () => undefined),
      getAppraisalFull: createAsyncSpy(async () => undefined),
      updateSelfAssessment: createAsyncSpy(async () => undefined),
      submitAppraisal: createAsyncSpy(async () => undefined),
      saveKpaRatings: createAsyncSpy(async () => []),
      saveAttributeRatings: createAsyncSpy(async () => []),
      advanceAppraisalStatus: createAsyncSpy(async () => undefined),
      getAppraisalsForOfficer: createAsyncSpy(async () => []),
      hrFinalizeAll,
    },
    '../utils/auditLogger': { logAudit: createAsyncSpy(async () => undefined) },
  });

  const res = createRes();
  await controller.hrFinalizeAll({ user: { id: 'hr-1' }, params: { cycleId: 'cycle-1' } }, res, () => {});

  assert.equal(hrFinalizeAll.calls[0][0], 'cycle-1');
  assert.deepEqual(res.body, { success: true, finalized: 2 });
});
