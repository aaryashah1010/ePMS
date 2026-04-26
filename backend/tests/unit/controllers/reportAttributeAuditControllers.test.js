const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy, createRes } = require('../../helpers/spies');

const reportControllerPath = path.join(__dirname, '../../../src/controllers/reportController.js');
const attributeControllerPath = path.join(__dirname, '../../../src/controllers/attributeController.js');
const auditControllerPath = path.join(__dirname, '../../../src/controllers/auditController.js');

test('reportController.exportDepartmentExcel loads summary data and delegates export', async () => {
  const departmentSummary = createAsyncSpy(async () => ([{ department: 'Engineering', employees: [] }]));
  const generateDepartmentExcel = createAsyncSpy(async () => undefined);

  const controller = loadModule(reportControllerPath, {
    '../services/reportService': {
      individualReport: createAsyncSpy(async () => undefined),
      departmentSummary,
      ratingDistribution: createAsyncSpy(async () => undefined),
      cycleProgress: createAsyncSpy(async () => undefined),
    },
    '../utils/exportService': {
      generateIndividualPDF: () => undefined,
      generateDepartmentExcel,
    },
  });

  const res = createRes();
  await controller.exportDepartmentExcel({ params: { cycleId: 'cycle-1' }, query: { department: 'Engineering' } }, res, () => {});

  assert.deepEqual(departmentSummary.calls[0], ['cycle-1', 'Engineering']);
  assert.equal(generateDepartmentExcel.calls.length, 1);
});

test('attributeController.getAllAttributes converts isActive query strings into booleans', async () => {
  const findMany = createAsyncSpy(async () => ([{ id: 'attr-1', name: 'Teamwork' }]));

  const controller = loadModule(attributeControllerPath, {
    '../utils/prisma': {
      attributeMaster: {
        create: createAsyncSpy(async () => undefined),
        findMany,
        update: createAsyncSpy(async () => undefined),
      },
    },
  });

  const res = createRes();
  await controller.getAllAttributes({ query: { type: 'VALUES', isActive: 'true' } }, res, () => {});

  assert.deepEqual(findMany.calls[0][0], { where: { type: 'VALUES', isActive: true }, orderBy: { name: 'asc' } });
  assert.equal(res.body.attributes.length, 1);
});

test('auditController.getAuditLogs returns pagination metadata', async () => {
  const findMany = createAsyncSpy(async () => ([{ id: 'log-1' }]));
  const count = createAsyncSpy(async () => 1);

  const controller = loadModule(auditControllerPath, {
    '../utils/prisma': {
      auditLog: { findMany, count },
    },
  });

  const res = createRes();
  await controller.getAuditLogs({ query: { userId: 'user-1', page: '2', limit: '10' } }, res, () => {});

  assert.equal(findMany.calls[0][0].skip, 10);
  assert.deepEqual(res.body, {
    success: true,
    logs: [{ id: 'log-1' }],
    total: 1,
    page: 2,
    limit: 10,
  });
});
