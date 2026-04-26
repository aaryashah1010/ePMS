const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy } = require('../../helpers/spies');
const { ConflictError, NotFoundError } = require('../../../src/utils/errors');

const modulePath = path.join(__dirname, '../../../src/services/userService.js');

test('createUser hashes the password, stores reporting history, and sends email', async () => {
  process.env.BCRYPT_ROUNDS = '10';

  const findUnique = createAsyncSpy(async () => null);
  const hash = createAsyncSpy(async () => 'hashed-password');
  const create = createAsyncSpy(async ({ data }) => ({
    id: 'user-1',
    name: data.name,
    email: data.email,
    role: data.role,
    department: data.department,
    employeeCode: data.employeeCode,
    reportingOfficerId: data.reportingOfficerId,
    reviewingOfficerId: data.reviewingOfficerId,
    acceptingOfficerId: data.acceptingOfficerId,
    isActive: true,
    createdAt: new Date(),
  }));
  const reportingHistoryCreate = createAsyncSpy(async () => undefined);
  const sendEmail = createAsyncSpy(async () => undefined);

  const service = loadModule(modulePath, {
    bcryptjs: { hash },
    '../utils/prisma': {
      user: { findUnique, create },
      reportingHistory: { create: reportingHistoryCreate },
    },
    '../utils/emailService': { sendEmail },
  });

  const user = await service.createUser({
    name: 'Alice',
    email: 'alice@example.com',
    password: 'plain',
    role: 'EMPLOYEE',
    department: 'Engineering',
    employeeCode: 'EMP001',
    reportingOfficerId: 'manager-1',
  });

  assert.equal(hash.calls[0][1], 10);
  assert.equal(create.calls[0][0].data.password, 'hashed-password');
  assert.equal(reportingHistoryCreate.calls.length, 1);
  assert.equal(sendEmail.calls.length, 1);
  assert.equal(user.email, 'alice@example.com');
});

test('createUser rejects duplicate emails', async () => {
  const service = loadModule(modulePath, {
    bcryptjs: { hash: createAsyncSpy(async () => 'hash') },
    '../utils/prisma': {
      user: { findUnique: createAsyncSpy(async () => ({ id: 'existing' })) },
      reportingHistory: { create: createAsyncSpy(async () => undefined) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  await assert.rejects(
    () => service.createUser({ email: 'alice@example.com', password: 'plain' }),
    ConflictError,
  );
});

test('updateUser prevents self-assignment to officer fields', async () => {
  const service = loadModule(modulePath, {
    bcryptjs: { hash: createAsyncSpy(async () => 'hash') },
    '../utils/prisma': {
      user: {
        findUnique: createAsyncSpy(async () => ({
          id: 'user-1',
          reportingOfficerId: null,
          reviewingOfficerId: null,
          acceptingOfficerId: null,
        })),
        update: createAsyncSpy(async () => undefined),
      },
      reportingHistory: {
        updateMany: createAsyncSpy(async () => undefined),
        create: createAsyncSpy(async () => undefined),
      },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  await assert.rejects(
    () => service.updateUser('user-1', { reportingOfficerId: 'user-1' }),
    ConflictError,
  );
});

test('updateUser hashes new passwords and rolls reporting history when officers change', async () => {
  process.env.BCRYPT_ROUNDS = '8';

  const findUnique = createAsyncSpy(async () => ({
    id: 'user-1',
    reportingOfficerId: 'ro-1',
    reviewingOfficerId: 'rv-1',
    acceptingOfficerId: 'ac-1',
  }));
  const hash = createAsyncSpy(async () => 'fresh-hash');
  const update = createAsyncSpy(async ({ data }) => ({
    id: 'user-1',
    reportingOfficerId: data.reportingOfficerId,
    reviewingOfficerId: data.reviewingOfficerId,
    acceptingOfficerId: data.acceptingOfficerId,
  }));
  const updateMany = createAsyncSpy(async () => undefined);
  const reportingHistoryCreate = createAsyncSpy(async () => undefined);

  const service = loadModule(modulePath, {
    bcryptjs: { hash },
    '../utils/prisma': {
      user: { findUnique, update },
      reportingHistory: { updateMany, create: reportingHistoryCreate },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  await service.updateUser('user-1', {
    password: 'new-password',
    reportingOfficerId: 'ro-2',
    reviewingOfficerId: 'rv-1',
    acceptingOfficerId: 'ac-1',
  });

  assert.equal(hash.calls[0][1], 8);
  assert.equal(update.calls[0][0].data.password, 'fresh-hash');
  assert.equal(updateMany.calls.length, 1);
  assert.equal(reportingHistoryCreate.calls.length, 1);
});

test('getUserById throws for missing users', async () => {
  const service = loadModule(modulePath, {
    bcryptjs: { hash: createAsyncSpy(async () => 'hash') },
    '../utils/prisma': {
      user: {
        findUnique: createAsyncSpy(async () => null),
        create: createAsyncSpy(async () => undefined),
        update: createAsyncSpy(async () => undefined),
      },
      reportingHistory: { create: createAsyncSpy(async () => undefined), updateMany: createAsyncSpy(async () => undefined) },
    },
    '../utils/emailService': { sendEmail: createAsyncSpy(async () => undefined) },
  });

  await assert.rejects(() => service.getUserById('missing'), NotFoundError);
});
