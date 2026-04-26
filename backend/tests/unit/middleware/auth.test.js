const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy } = require('../../helpers/spies');
const { AuthError } = require('../../../src/utils/errors');

const modulePath = path.join(__dirname, '../../../src/middleware/auth.js');

test('authenticate attaches the active user and request IP', async () => {
  process.env.JWT_SECRET = 'secret';

  const verify = createAsyncSpy(() => ({ id: 'user-1' }));
  const findUnique = createAsyncSpy(async () => ({
    id: 'user-1',
    name: 'Alice',
    isActive: true,
    role: 'EMPLOYEE',
  }));

  const { authenticate } = loadModule(modulePath, {
    jsonwebtoken: { verify: (...args) => {
      verify(...args);
      return { id: 'user-1' };
    } },
    '../utils/prisma': { user: { findUnique } },
  });

  const req = {
    headers: { authorization: 'Bearer token-123', 'x-forwarded-for': '10.0.0.1' },
    socket: { remoteAddress: '127.0.0.1' },
  };

  let nextArg;
  await authenticate(req, {}, (arg) => { nextArg = arg; });

  assert.equal(verify.calls.length, 1);
  assert.deepEqual(verify.calls[0], ['token-123', 'secret']);
  assert.equal(findUnique.calls.length, 1);
  assert.equal(req.user.name, 'Alice');
  assert.equal(req.ip, '10.0.0.1');
  assert.equal(nextArg, undefined);
});

test('authenticate converts JWT errors into AuthError', async () => {
  process.env.JWT_SECRET = 'secret';

  const { authenticate } = loadModule(modulePath, {
    jsonwebtoken: {
      verify() {
        const err = new Error('bad token');
        err.name = 'JsonWebTokenError';
        throw err;
      },
    },
    '../utils/prisma': { user: { findUnique: createAsyncSpy(async () => null) } },
  });

  const req = { headers: { authorization: 'Bearer broken' }, socket: { remoteAddress: '127.0.0.1' } };
  let nextArg;

  await authenticate(req, {}, (arg) => { nextArg = arg; });

  assert.ok(nextArg instanceof AuthError);
  assert.equal(nextArg.message, 'Invalid or expired token');
});

test('authenticate rejects missing bearer tokens', async () => {
  const { authenticate } = loadModule(modulePath, {
    jsonwebtoken: { verify: () => ({ id: 'x' }) },
    '../utils/prisma': { user: { findUnique: createAsyncSpy(async () => null) } },
  });

  let nextArg;
  await authenticate({ headers: {}, socket: { remoteAddress: '127.0.0.1' } }, {}, (arg) => { nextArg = arg; });

  assert.ok(nextArg instanceof AuthError);
  assert.equal(nextArg.message, 'No token provided');
});
