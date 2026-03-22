const midYearService = require('../services/midYearService');
const { logAudit } = require('../utils/auditLogger');

async function saveMyMidYear(req, res, next) {
  try {
    const review = await midYearService.createOrUpdateMidYear(req.user.id, req.params.cycleId, req.body);
    await logAudit({ userId: req.user.id, action: 'SAVE_MID_YEAR', entity: 'MidYearReview', entityId: review.id });
    res.json({ success: true, review });
  } catch (err) { next(err); }
}

async function submitMyMidYear(req, res, next) {
  try {
    const review = await midYearService.submitMidYear(req.user.id, req.params.cycleId);
    await logAudit({ userId: req.user.id, action: 'SUBMIT_MID_YEAR', entity: 'MidYearReview', entityId: review.id });
    res.json({ success: true, review });
  } catch (err) { next(err); }
}

async function getMyMidYear(req, res, next) {
  try {
    const review = await midYearService.getMidYearById(req.user.id, req.params.cycleId);
    res.json({ success: true, review });
  } catch (err) { next(err); }
}

async function addRemarks(req, res, next) {
  try {
    const { userId } = req.params;
    const { remarks } = req.body;
    const review = await midYearService.addReportingRemarks(req.user.id, userId, req.params.cycleId, remarks);
    await logAudit({ userId: req.user.id, action: 'ADD_MID_YEAR_REMARKS', entity: 'MidYearReview', entityId: review.id });
    res.json({ success: true, review });
  } catch (err) { next(err); }
}

async function getTeamMidYear(req, res, next) {
  try {
    const reviews = await midYearService.getMidYearForOfficer(req.user.id, req.params.cycleId);
    res.json({ success: true, reviews });
  } catch (err) { next(err); }
}

async function getEmployeeMidYear(req, res, next) {
  try {
    const review = await midYearService.getMidYearById(req.params.userId, req.params.cycleId);
    res.json({ success: true, review });
  } catch (err) { next(err); }
}

module.exports = { saveMyMidYear, submitMyMidYear, getMyMidYear, addRemarks, getTeamMidYear, getEmployeeMidYear };
