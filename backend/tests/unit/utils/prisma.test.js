const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule, clearModule } = require('../../helpers/module');

const modulePath = path.join(__dirname, '../../../src/utils/prisma.js');

test('prisma client uses verbose logging in development', () => {
  process.env.NODE_ENV = 'development';

  let receivedOptions;
  class PrismaClient {
    constructor(options) {
      receivedOptions = options;
    }
  }

  const prisma = loadModule(modulePath, {
    '@prisma/client': { PrismaClient },
  });

  assert.ok(prisma);
  assert.deepEqual(receivedOptions, { log: ['warn', 'error'] });
  clearModule(modulePath);
});

test('prisma client limits logging outside development', () => {
  process.env.NODE_ENV = 'production';

  let receivedOptions;
  class PrismaClient {
    constructor(options) {
      receivedOptions = options;
    }
  }

  loadModule(modulePath, {
    '@prisma/client': { PrismaClient },
  });

  assert.deepEqual(receivedOptions, { log: ['error'] });
  clearModule(modulePath);
});
