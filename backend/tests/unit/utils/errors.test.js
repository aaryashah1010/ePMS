const test = require('node:test');
const assert = require('node:assert/strict');

const {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require('../../../src/utils/errors');

test('error classes expose consistent status codes and operational flags', () => {
  const appError = new AppError('boom', 418);
  const validation = new ValidationError('bad input');
  const auth = new AuthError();
  const forbidden = new ForbiddenError();
  const missing = new NotFoundError('Cycle');
  const conflict = new ConflictError('duplicate');

  assert.equal(appError.message, 'boom');
  assert.equal(appError.statusCode, 418);
  assert.equal(appError.isOperational, true);

  assert.equal(validation.statusCode, 400);
  assert.equal(auth.statusCode, 401);
  assert.equal(forbidden.statusCode, 403);
  assert.equal(missing.message, 'Cycle not found');
  assert.equal(missing.statusCode, 404);
  assert.equal(conflict.statusCode, 409);
});
