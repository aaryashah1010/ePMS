const cron = require('node-cron');
const prisma = require('../utils/prisma');

function initCycleScheduler() {
  // Run every day at midnight (0 0 * * *)
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[Scheduler] Running daily cycle auto-close check...');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find active cycles where end date has passed
      const pastDueCycles = await prisma.appraisalCycle.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            lt: today
          }
        }
      });

      if (pastDueCycles.length > 0) {
        console.log(`[Scheduler] Found ${pastDueCycles.length} cycle(s) to close.`);
      }

      for (const cycle of pastDueCycles) {
        await prisma.appraisalCycle.update({
          where: { id: cycle.id },
          data: { status: 'CLOSED' }
        });
        
        console.log(`[Scheduler] Auto-closed cycle: ${cycle.name}`);
      }
    } catch (err) {
      console.error('[Scheduler] Error in cycle scheduler:', err);
    }
  });
}

module.exports = { initCycleScheduler };
