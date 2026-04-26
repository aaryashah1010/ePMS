const test = require('node:test');
const assert = require('node:assert/strict');

const { errorHandler, notFound } = require('../../../src/middleware/errorHandler');
const { ValidationError } = require('../../../src/utils/errors');
const { createRes } = require('../../helpers/spies');

test('errorHandler returns operational errors with stack in non-production', () => {
  process.env.NODE_ENV = 'development';

  const err = new ValidationError('bad request');
  const res = createRes();
  const originalError = console.error;
  console.error = () => {};

  try {
    errorHandler(err, {}, res, () => {});
  } finally {
    console.error = originalError;
  }

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'bad request');
  assert.ok(res.body.stack);
});

test('errorHandler maps Prisma conflict errors', () => {
  process.env.NODE_ENV = 'production';
  const res = createRes();

  errorHandler({ code: 'P2002' }, {}, res, () => {});

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, { success: false, message: 'Record already exists' });
});

test('errorHandler hides internal details in production', () => {
  process.env.NODE_ENV = 'production';

  const res = createRes();
  errorHandler(new Error('boom'), {}, res, () => {});

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { success: false, message: 'Internal server error' });
});

test('notFound returns a route-specific message', () => {
  const res = createRes();

  notFound({ originalUrl: '/missing' }, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { success: false, message: 'Route /missing not found' });
});
