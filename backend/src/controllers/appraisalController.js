const appraisalService = require('../services/appraisalService');
const { logAudit } = require('../utils/auditLogger');

async function getMyAppraisal(req, res, next) {
  try {
    const appraisal = await appraisalService.getAppraisalFull(req.user.id, req.params.cycleId);
    res.json({ success: true, appraisal });
  } catch (err) { next(err); }
}

async function updateSelfAssessment(req, res, next) {
  try {
    const appraisal = await appraisalService.updateSelfAssessment(req.user.id, req.params.cycleId, req.body.achievements);
    await logAudit({ userId: req.user.id, action: 'UPDATE_SELF_ASSESSMENT', entity: 'AnnualAppraisal', entityId: appraisal.id });
    res.json({ success: true, appraisal });
  } catch (err) { next(err); }
}

async function submitAppraisal(req, res, next) {
  try {
    const appraisal = await appraisalService.submitAppraisal(req.user.id, req.params.cycleId);
    await logAudit({ userId: req.user.id, action: 'SUBMIT_APPRAISAL', entity: 'AnnualAppraisal', entityId: appraisal.id });
    res.json({ success: true, appraisal });
  } catch (err) { next(err); }
}

async function getEmployeeAppraisal(req, res, next) {
  try {
    const appraisal = await appraisalService.getAppraisalFull(req.params.userId, req.params.cycleId);
    res.json({ success: true, appraisal });
  } catch (err) { next(err); }
}

async function saveKpaRatings(req, res, next) {
  try {
    const { appraisalId } = req.params;
    const ratings = await appraisalService.saveKpaRatings(req.user.id, appraisalId, req.body.ratings);
    await logAudit({ userId: req.user.id, action: 'SAVE_KPA_RATINGS', entity: 'AnnualAppraisal', entityId: appraisalId });
    res.json({ success: true, ratings });
  } catch (err) { next(err); }
}

async function saveAttributeRatings(req, res, next) {
  try {
    const { appraisalId } = req.params;
    const ratings = await appraisalService.saveAttributeRatings(req.user.id, appraisalId, req.body.ratings);
    await logAudit({ userId: req.user.id, action: 'SAVE_ATTRIBUTE_RATINGS', entity: 'AnnualAppraisal', entityId: appraisalId });
    res.json({ success: true, ratings });
  } catch (err) { next(err); }
}

async function reportingOfficerAction(req, res, next) {
  try {
    const { userId, cycleId } = req.params;
    const appraisal = await appraisalService.advanceAppraisalStatus(req.user.id, userId, cycleId, req.body.remarks, 'SUBMITTED');
    await logAudit({ userId: req.user.id, action: 'REPORTING_DONE', entity: 'AnnualAppraisal', entityId: appraisal.id });
    res.json({ success: true, appraisal });
  } catch (err) { next(err); }
}

async function reviewingOfficerAction(req, res, next) {
  try {
    const { userId, cycleId } = req.params;
    const appraisal = await appraisalService.advanceAppraisalStatus(req.user.id, userId, cycleId, req.body.remarks, 'REPORTING_DONE');
    await logAudit({ userId: req.user.id, action: 'REVIEWING_DONE', entity: 'AnnualAppraisal', entityId: appraisal.id });
    res.json({ success: true, appraisal });
  } catch (err) { next(err); }
}

async function acceptingOfficerAction(req, res, next) {
  try {
    const { userId, cycleId } = req.params;
    const appraisal = await appraisalService.advanceAppraisalStatus(req.user.id, userId, cycleId, req.body.remarks, 'REVIEWING_DONE');
    await logAudit({ userId: req.user.id, action: 'ACCEPTING_DONE', entity: 'AnnualAppraisal', entityId: appraisal.id });
    res.json({ success: true, appraisal });
  } catch (err) { next(err); }
}

async function getTeamAppraisals(req, res, next) {
  try {
    const appraisals = await appraisalService.getAppraisalsForOfficer(req.user.id, req.params.cycleId, req.user.role);
    res.json({ success: true, appraisals });
  } catch (err) { next(err); }
}

async function hrFinalizeAll(req, res, next) {
  try {
    const results = await appraisalService.hrFinalizeAll(req.params.cycleId);
    await logAudit({ userId: req.user.id, action: 'HR_FINALIZE_ALL', entity: 'AppraisalCycle', entityId: req.params.cycleId });
    res.json({ success: true, finalized: results.length });
  } catch (err) { next(err); }
}

module.exports = {
  getMyAppraisal, updateSelfAssessment, submitAppraisal, getEmployeeAppraisal,
  saveKpaRatings, saveAttributeRatings,
  reportingOfficerAction, reviewingOfficerAction, acceptingOfficerAction,
  getTeamAppraisals, hrFinalizeAll,
};
