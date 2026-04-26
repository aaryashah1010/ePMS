const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule, clearModule } = require('../helpers/module');
const { createSpy } = require('../helpers/spies');

const modulePath = path.join(__dirname, '../../server.js');

test('server wires middleware, routes, scheduler, and starts listening', () => {
  process.env.PORT = '5050';
  process.env.NODE_ENV = 'test';
  process.env.CORS_ORIGIN = 'http://localhost:8080';

  const use = createSpy(() => {});
  const get = createSpy(() => {});
  const listen = createSpy((port, cb) => {
    if (cb) cb();
    return { close() {} };
  });

  const app = { use, get, listen };

  const express = () => app;
  express.json = createSpy(() => 'json-middleware');

  const cors = createSpy((options) => ({ type: 'cors', options }));
  const helmet = createSpy(() => 'helmet-middleware');
  const morgan = createSpy((format) => ({ type: 'morgan', format }));
  const rateLimit = createSpy((options) => ({ type: 'rate-limit', options }));
  const initCycleScheduler = createSpy(() => {});
  const log = createSpy(() => {});

  const routeMocks = {
    './src/routes/auth': { name: 'auth-routes' },
    './src/routes/users': { name: 'user-routes' },
    './src/routes/cycles': { name: 'cycle-routes' },
    './src/routes/kpa': { name: 'kpa-routes' },
    './src/routes/midYear': { name: 'midyear-routes' },
    './src/routes/appraisal': { name: 'appraisal-routes' },
    './src/routes/reports': { name: 'report-routes' },
    './src/routes/audit': { name: 'audit-routes' },
    './src/routes/attributes': { name: 'attribute-routes' },
  };

  const originalLog = console.log;
  console.log = log;

  try {
    loadModule(modulePath, {
      express,
      cors,
      helmet,
      morgan,
      'express-rate-limit': rateLimit,
      './src/cron/cycleScheduler': { initCycleScheduler },
      './src/middleware/errorHandler': { errorHandler: 'error-handler', notFound: 'not-found' },
      ...routeMocks,
    });
  } finally {
    console.log = originalLog;
    clearModule(modulePath);
  }

  assert.equal(initCycleScheduler.calls.length, 1);
  assert.equal(helmet.calls.length, 1);
  assert.deepEqual(cors.calls[0][0], { origin: 'http://localhost:8080', credentials: true });
  assert.deepEqual(rateLimit.calls[0][0], { windowMs: 15 * 60 * 1000, max: 200 });
  assert.equal(express.json.calls[0][0].limit, '10mb');
  assert.equal(morgan.calls[0][0], 'dev');
  assert.equal(get.calls[0][0], '/health');
  assert.equal(listen.calls[0][0], '5050');

  const mountedPaths = use.calls.map((call) => call[0]);
  assert.ok(mountedPaths.includes('/api/auth'));
  assert.ok(mountedPaths.includes('/api/users'));
  assert.ok(mountedPaths.includes('/api/cycles'));
  assert.ok(mountedPaths.includes('/api/kpa'));
  assert.ok(mountedPaths.includes('/api/mid-year'));
  assert.ok(mountedPaths.includes('/api/appraisal'));
  assert.ok(mountedPaths.includes('/api/reports'));
  assert.ok(mountedPaths.includes('/api/audit'));
  assert.ok(mountedPaths.includes('/api/attributes'));
});
