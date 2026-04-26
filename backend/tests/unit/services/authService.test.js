const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy, createSpy } = require('../../helpers/spies');
const { AuthError, NotFoundError } = require('../../../src/utils/errors');

const modulePath = path.join(__dirname, '../../../src/services/authService.js');

test('login returns a signed token and strips the password field', async () => {
  process.env.JWT_SECRET = 'secret';
  process.env.JWT_EXPIRES_IN = '8h';

  const findUnique = createAsyncSpy(async () => ({
    id: 'user-1',
    email: 'alice@example.com',
    password: 'hashed',
    role: 'EMPLOYEE',
    isActive: true,
  }));
  const compare = createAsyncSpy(async () => true);
  const sign = createSpy(() => 'jwt-token');

  const service = loadModule(modulePath, {
    bcryptjs: { compare, hash: createAsyncSpy(async () => 'unused') },
    jsonwebtoken: { sign },
    '../utils/prisma': { user: { findUnique, update: createAsyncSpy(async () => undefined) } },
  });

  const result = await service.login('alice@example.com', 'password');

  assert.equal(compare.calls.length, 1);
  assert.equal(sign.calls.length, 1);
  assert.equal(result.token, 'jwt-token');
  assert.equal(result.user.password, undefined);
  assert.equal(result.user.email, 'alice@example.com');
});

test('login rejects inactive or unknown users', async () => {
  const service = loadModule(modulePath, {
    bcryptjs: { compare: createAsyncSpy(async () => false), hash: createAsyncSpy(async () => '') },
    jsonwebtoken: { sign: createSpy(() => 'token') },
    '../utils/prisma': { user: { findUnique: createAsyncSpy(async () => null) } },
  });

  await assert.rejects(() => service.login('missing@example.com', 'pw'), AuthError);
});

test('changePassword validates the current password before updating', async () => {
  process.env.BCRYPT_ROUNDS = '12';

  const findUnique = createAsyncSpy(async () => ({ id: 'user-1', password: 'old-hash' }));
  const compare = createAsyncSpy(async () => true);
  const hash = createAsyncSpy(async () => 'new-hash');
  const update = createAsyncSpy(async () => undefined);

  const service = loadModule(modulePath, {
    bcryptjs: { compare, hash },
    jsonwebtoken: { sign: createSpy(() => 'token') },
    '../utils/prisma': { user: { findUnique, update } },
  });

  const result = await service.changePassword('user-1', 'old-password', 'new-password');

  assert.equal(hash.calls[0][1], 12);
  assert.deepEqual(update.calls[0][0], { where: { id: 'user-1' }, data: { password: 'new-hash' } });
  assert.equal(result.message, 'Password changed successfully');
});

test('changePassword throws when the user cannot be found', async () => {
  const service = loadModule(modulePath, {
    bcryptjs: { compare: createAsyncSpy(async () => false), hash: createAsyncSpy(async () => '') },
    jsonwebtoken: { sign: createSpy(() => 'token') },
    '../utils/prisma': { user: { findUnique: createAsyncSpy(async () => null), update: createAsyncSpy(async () => undefined) } },
  });

  await assert.rejects(() => service.changePassword('missing', 'x', 'y'), NotFoundError);
});
