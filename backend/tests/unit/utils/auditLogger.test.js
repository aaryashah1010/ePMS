const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy, createSpy } = require('../../helpers/spies');

const modulePath = path.join(__dirname, '../../../src/utils/auditLogger.js');

test('logAudit writes normalized fields into auditLog.create', async () => {
  const create = createAsyncSpy(async () => undefined);

  const { logAudit } = loadModule(modulePath, {
    '@prisma/client': {
      PrismaClient: class PrismaClient {
        constructor() {
          this.auditLog = { create };
        }
      },
    },
  });

  await logAudit({
    userId: 'user-1',
    action: 'LOGIN',
    entity: 'User',
    entityId: undefined,
    oldValue: undefined,
    newValue: { role: 'HR' },
  });

  assert.equal(create.calls.length, 1);
  assert.deepEqual(create.calls[0][0], {
    data: {
      userId: 'user-1',
      action: 'LOGIN',
      entity: 'User',
      entityId: null,
      oldValue: null,
      newValue: { role: 'HR' },
      ipAddress: null,
    },
  });
});

test('logAudit swallows persistence failures', async () => {
  const create = createAsyncSpy(async () => {
    throw new Error('db down');
  });
  const error = createSpy(() => {});

  const { logAudit } = loadModule(modulePath, {
    '@prisma/client': {
      PrismaClient: class PrismaClient {
        constructor() {
          this.auditLog = { create };
        }
      },
    },
  });

  const originalError = console.error;
  console.error = error;

  try {
    await logAudit({ userId: 'user-1', action: 'LOGIN', entity: 'User' });
  } finally {
    console.error = originalError;
  }

  assert.equal(error.calls.length, 1);
  assert.equal(error.calls[0][0], 'Audit log failed:');
});
