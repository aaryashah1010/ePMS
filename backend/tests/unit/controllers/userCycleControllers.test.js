const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy, createRes } = require('../../helpers/spies');

const userControllerPath = path.join(__dirname, '../../../src/controllers/userController.js');
const cycleControllerPath = path.join(__dirname, '../../../src/controllers/cycleController.js');

test('userController.createUser returns 201 and logs the created user', async () => {
  const createUser = createAsyncSpy(async () => ({ id: 'user-1', email: 'alice@example.com', role: 'EMPLOYEE' }));
  const logAudit = createAsyncSpy(async () => undefined);

  const controller = loadModule(userControllerPath, {
    '../services/userService': {
      createUser,
      getAllUsers: createAsyncSpy(async () => []),
      getUserById: createAsyncSpy(async () => undefined),
      updateUser: createAsyncSpy(async () => undefined),
      getReportees: createAsyncSpy(async () => []),
      getReviewees: createAsyncSpy(async () => []),
      getAppraisees: createAsyncSpy(async () => []),
    },
    '../utils/auditLogger': { logAudit },
  });

  const res = createRes();
  await controller.createUser({ body: { email: 'alice@example.com' }, user: { id: 'hr-1' } }, res, () => {});

  assert.equal(res.statusCode, 201);
  assert.equal(createUser.calls.length, 1);
  assert.equal(logAudit.calls.length, 1);
  assert.equal(res.body.user.id, 'user-1');
});

test('userController.updateUser loads the previous user and returns the updated one', async () => {
  const getUserById = createAsyncSpy(async (id) => ({ id, email: 'before@example.com' }));
  const updateUser = createAsyncSpy(async () => ({ id: 'user-1', email: 'after@example.com' }));

  const controller = loadModule(userControllerPath, {
    '../services/userService': {
      createUser: createAsyncSpy(async () => undefined),
      getAllUsers: createAsyncSpy(async () => []),
      getUserById,
      updateUser,
      getReportees: createAsyncSpy(async () => []),
      getReviewees: createAsyncSpy(async () => []),
      getAppraisees: createAsyncSpy(async () => []),
    },
    '../utils/auditLogger': { logAudit: createAsyncSpy(async () => undefined) },
  });

  const res = createRes();
  await controller.updateUser({ params: { id: 'user-1' }, body: { department: 'Engineering' }, user: { id: 'hr-1' } }, res, () => {});

  assert.equal(getUserById.calls.length, 1);
  assert.equal(updateUser.calls.length, 1);
  assert.equal(res.body.user.email, 'after@example.com');
});

test('cycleController.createCycle injects createdBy and returns 201', async () => {
  const createCycle = createAsyncSpy(async (payload) => ({ id: 'cycle-1', ...payload }));
  const logAudit = createAsyncSpy(async () => undefined);

  const controller = loadModule(cycleControllerPath, {
    '../services/cycleService': {
      createCycle,
      getAllCycles: createAsyncSpy(async () => []),
      getCycleById: createAsyncSpy(async () => undefined),
      getActiveCycle: createAsyncSpy(async () => []),
      updateCycle: createAsyncSpy(async () => undefined),
      advancePhase: createAsyncSpy(async () => undefined),
      closeCycle: createAsyncSpy(async () => undefined),
      deleteCycle: createAsyncSpy(async () => undefined),
      getPendingWork: createAsyncSpy(async () => ({ pendingCount: 0, pendingEmployees: [] })),
    },
    '../utils/auditLogger': { logAudit },
  });

  const res = createRes();
  await controller.createCycle({ body: { name: 'FY 2026' }, user: { id: 'hr-1' } }, res, () => {});

  assert.equal(res.statusCode, 201);
  assert.equal(createCycle.calls[0][0].createdBy, 'hr-1');
  assert.equal(logAudit.calls.length, 1);
});

test('cycleController.getPendingWork merges the service payload into the response body', async () => {
  const getPendingWork = createAsyncSpy(async () => ({ pendingCount: 2, pendingEmployees: ['Alice', 'Bob'] }));

  const controller = loadModule(cycleControllerPath, {
    '../services/cycleService': {
      createCycle: createAsyncSpy(async () => undefined),
      getAllCycles: createAsyncSpy(async () => []),
      getCycleById: createAsyncSpy(async () => undefined),
      getActiveCycle: createAsyncSpy(async () => []),
      updateCycle: createAsyncSpy(async () => undefined),
      advancePhase: createAsyncSpy(async () => undefined),
      closeCycle: createAsyncSpy(async () => undefined),
      deleteCycle: createAsyncSpy(async () => undefined),
      getPendingWork,
    },
    '../utils/auditLogger': { logAudit: createAsyncSpy(async () => undefined) },
  });

  const res = createRes();
  await controller.getPendingWork({ params: { id: 'cycle-1' } }, res, () => {});

  assert.deepEqual(res.body, {
    success: true,
    pendingCount: 2,
    pendingEmployees: ['Alice', 'Bob'],
  });
});
