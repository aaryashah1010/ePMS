const cycleService = require('../services/cycleService');
const { logAudit } = require('../utils/auditLogger');

async function createCycle(req, res, next) {
  try {
    const cycle = await cycleService.createCycle({ ...req.body, createdBy: req.user.id });
    await logAudit({ userId: req.user.id, action: 'CREATE_CYCLE', entity: 'AppraisalCycle', entityId: cycle.id, newValue: cycle });
    res.status(201).json({ success: true, cycle });
  } catch (err) { next(err); }
}

async function getAllCycles(req, res, next) {
  try {
    const cycles = await cycleService.getAllCycles(req.query);
    res.json({ success: true, cycles });
  } catch (err) { next(err); }
}

async function getCycleById(req, res, next) {
  try {
    const cycle = await cycleService.getCycleById(req.params.id);
    res.json({ success: true, cycle });
  } catch (err) { next(err); }
}

async function updateCycle(req, res, next) {
  try {
    const cycle = await cycleService.updateCycle(req.params.id, req.body);
    await logAudit({ userId: req.user.id, action: 'UPDATE_CYCLE', entity: 'AppraisalCycle', entityId: cycle.id });
    res.json({ success: true, cycle });
  } catch (err) { next(err); }
}

async function advancePhase(req, res, next) {
  try {
    const cycle = await cycleService.advancePhase(req.params.id);
    await logAudit({ userId: req.user.id, action: 'ADVANCE_PHASE', entity: 'AppraisalCycle', entityId: cycle.id, newValue: { phase: cycle.phase, status: cycle.status } });
    res.json({ success: true, cycle });
  } catch (err) { next(err); }
}

async function closeCycle(req, res, next) {
  try {
    const cycle = await cycleService.closeCycle(req.params.id);
    await logAudit({ userId: req.user.id, action: 'CLOSE_CYCLE', entity: 'AppraisalCycle', entityId: cycle.id });
    res.json({ success: true, cycle });
  } catch (err) { next(err); }
}

async function getActiveCycle(req, res, next) {
  try {
    const cycle = await cycleService.getActiveCycle();
    res.json({ success: true, cycle });
  } catch (err) { next(err); }
}

module.exports = { createCycle, getAllCycles, getCycleById, updateCycle, advancePhase, closeCycle, getActiveCycle };
