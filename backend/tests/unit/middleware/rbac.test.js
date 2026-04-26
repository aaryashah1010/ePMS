const test = require('node:test');
const assert = require('node:assert/strict');

const { authorize } = require('../../../src/middleware/rbac');
const { ForbiddenError } = require('../../../src/utils/errors');

test('authorize allows matching roles', () => {
  const middleware = authorize('HR', 'EMPLOYEE');
  let nextArg;

  middleware({ user: { role: 'HR' } }, {}, (arg) => { nextArg = arg; });

  assert.equal(nextArg, undefined);
});

test('authorize rejects missing users', () => {
  const middleware = authorize('HR');
  let nextArg;

  middleware({}, {}, (arg) => { nextArg = arg; });

  assert.ok(nextArg instanceof ForbiddenError);
  assert.equal(nextArg.message, 'Not authenticated');
});

test('authorize rejects unsupported roles', () => {
  const middleware = authorize('HR');
  let nextArg;

  middleware({ user: { role: 'EMPLOYEE' } }, {}, (arg) => { nextArg = arg; });

  assert.ok(nextArg instanceof ForbiddenError);
  assert.equal(nextArg.message, "Role 'EMPLOYEE' is not authorized");
});
