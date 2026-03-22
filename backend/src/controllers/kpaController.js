const kpaService = require('../services/kpaService');
const { logAudit } = require('../utils/auditLogger');

async function createKpa(req, res, next) {
  try {
    const kpa = await kpaService.createKpa(req.user.id, req.params.cycleId, req.body);
    await logAudit({ userId: req.user.id, action: 'CREATE_KPA', entity: 'KpaGoal', entityId: kpa.id, newValue: req.body });
    res.status(201).json({ success: true, kpa });
  } catch (err) { next(err); }
}

async function getMyKpas(req, res, next) {
  try {
    const kpas = await kpaService.getKpas(req.user.id, req.params.cycleId);
    res.json({ success: true, kpas });
  } catch (err) { next(err); }
}

async function updateKpa(req, res, next) {
  try {
    const kpa = await kpaService.updateKpa(req.params.id, req.user.id, req.body);
    await logAudit({ userId: req.user.id, action: 'UPDATE_KPA', entity: 'KpaGoal', entityId: kpa.id, newValue: req.body });
    res.json({ success: true, kpa });
  } catch (err) { next(err); }
}

async function deleteKpa(req, res, next) {
  try {
    await kpaService.deleteKpa(req.params.id, req.user.id);
    await logAudit({ userId: req.user.id, action: 'DELETE_KPA', entity: 'KpaGoal', entityId: req.params.id });
    res.json({ success: true, message: 'KPA deleted' });
  } catch (err) { next(err); }
}

async function submitKpas(req, res, next) {
  try {
    const result = await kpaService.submitKpas(req.user.id, req.params.cycleId);
    await logAudit({ userId: req.user.id, action: 'SUBMIT_KPAS', entity: 'KpaGoal', entityId: req.params.cycleId });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function getKpasForOfficer(req, res, next) {
  try {
    const kpas = await kpaService.getKpasForOfficer(req.user.id, req.params.cycleId);
    res.json({ success: true, kpas });
  } catch (err) { next(err); }
}

async function getEmployeeKpas(req, res, next) {
  try {
    const kpas = await kpaService.getKpas(req.params.userId, req.params.cycleId);
    res.json({ success: true, kpas });
  } catch (err) { next(err); }
}

module.exports = { createKpa, getMyKpas, updateKpa, deleteKpa, submitKpas, getKpasForOfficer, getEmployeeKpas };
