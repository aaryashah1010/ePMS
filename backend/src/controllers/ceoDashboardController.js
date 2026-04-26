const ceoDashboardService = require('../services/ceoDashboardService');

async function getDashboard(req, res, next) {
  try {
    const cycleId = req.params.cycleId || null;
    const data = await ceoDashboardService.getFullDashboard(cycleId);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
}

module.exports = { getDashboard };
