const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy, createRes } = require('../../helpers/spies');

const modulePath = path.join(__dirname, '../../../src/controllers/authController.js');

test('login returns the auth payload and records an audit entry', async () => {
  const login = createAsyncSpy(async () => ({
    token: 'jwt-token',
    user: { id: 'user-1', email: 'alice@example.com' },
  }));
  const logAudit = createAsyncSpy(async () => undefined);

  const controller = loadModule(modulePath, {
    '../services/authService': { login, changePassword: createAsyncSpy(async () => undefined) },
    '../utils/auditLogger': { logAudit },
  });

  const res = createRes();
  let nextArg;

  await controller.login({ body: { email: 'alice@example.com', password: 'secret' } }, res, (arg) => { nextArg = arg; });

  assert.equal(nextArg, undefined);
  assert.equal(login.calls.length, 1);
  assert.equal(logAudit.calls.length, 1);
  assert.deepEqual(res.body, {
    success: true,
    token: 'jwt-token',
    user: { id: 'user-1', email: 'alice@example.com' },
  });
});

test('me returns the authenticated user without extra service calls', async () => {
  const controller = loadModule(modulePath, {
    '../services/authService': { login: createAsyncSpy(async () => undefined), changePassword: createAsyncSpy(async () => undefined) },
    '../utils/auditLogger': { logAudit: createAsyncSpy(async () => undefined) },
  });

  const res = createRes();
  await controller.me({ user: { id: 'user-1', role: 'HR' } }, res);

  assert.deepEqual(res.body, { success: true, user: { id: 'user-1', role: 'HR' } });
});

test('changePassword forwards service errors through next', async () => {
  const changePassword = createAsyncSpy(async () => {
    throw new Error('bad password');
  });

  const controller = loadModule(modulePath, {
    '../services/authService': { login: createAsyncSpy(async () => undefined), changePassword },
    '../utils/auditLogger': { logAudit: createAsyncSpy(async () => undefined) },
  });

  const res = createRes();
  let nextArg;
  await controller.changePassword({ user: { id: 'user-1' }, body: { oldPassword: 'a', newPassword: 'b' } }, res, (arg) => { nextArg = arg; });

  assert.equal(res.body, undefined);
  assert.equal(nextArg.message, 'bad password');
});
