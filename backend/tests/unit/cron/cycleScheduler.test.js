const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy } = require('../../helpers/spies');

const modulePath = path.join(__dirname, '../../../src/cron/cycleScheduler.js');

test('initCycleScheduler registers the midnight job and closes past-due cycles', async () => {
  const findMany = createAsyncSpy(async () => ([
    { id: 'cycle-1', name: 'FY2024' },
    { id: 'cycle-2', name: 'FY2023' },
  ]));
  const update = createAsyncSpy(async () => undefined);

  let scheduledPattern;
  let scheduledHandler;
  const originalLog = console.log;
  console.log = () => {};

  try {
    const { initCycleScheduler } = loadModule(modulePath, {
      'node-cron': {
        schedule(pattern, handler) {
          scheduledPattern = pattern;
          scheduledHandler = handler;
        },
      },
      '../utils/prisma': {
        appraisalCycle: { findMany, update },
      },
    });

    initCycleScheduler();
    assert.equal(scheduledPattern, '0 0 * * *');

    await scheduledHandler();
  } finally {
    console.log = originalLog;
  }

  assert.equal(findMany.calls.length, 1);
  assert.equal(update.calls.length, 2);
  assert.deepEqual(update.calls[0][0], {
    where: { id: 'cycle-1' },
    data: { status: 'CLOSED' },
  });
});
