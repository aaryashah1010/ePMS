const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy, createRes } = require('../../helpers/spies');

const modulePath = path.join(__dirname, '../../../src/controllers/ceoDashboardController.js');

test('ceoDashboardController.getDashboard passes the cycleId through to the service', async () => {
  const getFullDashboard = createAsyncSpy(async () => ({ cycle: { id: 'c1' }, alerts: [] }));
  const controller = loadModule(modulePath, {
    '../services/ceoDashboardService': { getFullDashboard },
  });

  const res = createRes();
  await controller.getDashboard({ params: { cycleId: 'c1' } }, res, () => {});

  assert.equal(getFullDashboard.calls[0][0], 'c1');
  assert.equal(res.body.success, true);
  assert.equal(res.body.cycle.id, 'c1');
});

test('ceoDashboardController.getDashboard defaults cycleId to null when none is provided', async () => {
  const getFullDashboard = createAsyncSpy(async () => ({ cycle: null, alerts: [] }));
  const controller = loadModule(modulePath, {
    '../services/ceoDashboardService': { getFullDashboard },
  });

  const res = createRes();
  await controller.getDashboard({ params: {} }, res, () => {});

  assert.equal(getFullDashboard.calls[0][0], null);
});

test('ceoDashboardController.getDashboard forwards service errors through next', async () => {
  const getFullDashboard = createAsyncSpy(async () => { throw new Error('boom'); });
  const controller = loadModule(modulePath, {
    '../services/ceoDashboardService': { getFullDashboard },
  });

  let nextArg;
  await controller.getDashboard({ params: { cycleId: 'c1' } }, createRes(), (err) => { nextArg = err; });

  assert.ok(nextArg instanceof Error);
  assert.equal(nextArg.message, 'boom');
});
