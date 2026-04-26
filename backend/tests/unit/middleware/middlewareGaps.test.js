const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy, createRes } = require('../../helpers/spies');
const { errorHandler } = require('../../../src/middleware/errorHandler');
const { AuthError } = require('../../../src/utils/errors');

test('errorHandler maps Prisma P2025 not-found errors to 404', () => {
  process.env.NODE_ENV = 'production';
  const res = createRes();
  errorHandler({ code: 'P2025' }, {}, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { success: false, message: 'Record not found' });
});

test('errorHandler hides stack trace in production for app errors', () => {
  process.env.NODE_ENV = 'production';
  const res = createRes();
  const err = Object.assign(new Error('not allowed'), { statusCode: 403, isOperational: true });

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, 'not allowed');
  assert.equal(res.body.stack, undefined);
});

test('authenticate rejects inactive users with AuthError', async () => {
  process.env.JWT_SECRET = 'secret';
  const modulePath = path.join(__dirname, '../../../src/middleware/auth.js');
  const findUnique = createAsyncSpy(async () => ({ id: 'u1', isActive: false, role: 'EMPLOYEE' }));

  const { authenticate } = loadModule(modulePath, {
    jsonwebtoken: { verify: () => ({ id: 'u1' }) },
    '../utils/prisma': { user: { findUnique } },
  });

  let nextArg;
  await authenticate(
    { headers: { authorization: 'Bearer token' }, socket: { remoteAddress: '127.0.0.1' } },
    {},
    (arg) => { nextArg = arg; },
  );

  assert.ok(nextArg instanceof AuthError);
  assert.match(nextArg.message, /not found|inactive/i);
});

test('cycleScheduler.initCycleScheduler skips updates when there are no past-due cycles', async () => {
  const modulePath = path.join(__dirname, '../../../src/cron/cycleScheduler.js');
  const findMany = createAsyncSpy(async () => ([]));
  const update = createAsyncSpy(async () => undefined);

  const originalLog = console.log;
  console.log = () => {};

  let scheduledHandler;
  try {
    const { initCycleScheduler } = loadModule(modulePath, {
      'node-cron': {
        schedule(_, handler) {
          scheduledHandler = handler;
        },
      },
      '../utils/prisma': { appraisalCycle: { findMany, update } },
    });
    initCycleScheduler();
    await scheduledHandler();
  } finally {
    console.log = originalLog;
  }

  assert.equal(findMany.calls.length, 1);
  assert.equal(update.calls.length, 0);
});
