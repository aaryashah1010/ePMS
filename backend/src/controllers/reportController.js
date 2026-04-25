const reportService = require('../services/reportService');
const { generateIndividualPDF, generateDepartmentExcel } = require('../utils/exportService');

async function individualReport(req, res, next) {
  try {
    const { userId, cycleId } = req.params;
    const report = await reportService.individualReport(userId, cycleId);
    res.json({ success: true, report });
  } catch (err) { next(err); }
}

async function departmentSummary(req, res, next) {
  try {
    const { cycleId } = req.params;
    const { department } = req.query;
    const summary = await reportService.departmentSummary(cycleId, department);
    res.json({ success: true, summary });
  } catch (err) { next(err); }
}

async function ratingDistribution(req, res, next) {
  try {
    const { cycleId } = req.params;
    const distribution = await reportService.ratingDistribution(cycleId);
    res.json({ success: true, distribution });
  } catch (err) { next(err); }
}

async function cycleProgress(req, res, next) {
  try {
    const { cycleId } = req.params;
    const progress = await reportService.cycleProgress(cycleId);
    res.json({ success: true, progress });
  } catch (err) { next(err); }
}

async function exportIndividualPDF(req, res, next) {
  try {
    const { userId, cycleId } = req.params;
    const report = await reportService.individualReport(userId, cycleId);
    generateIndividualPDF(report, res);
  } catch (err) { next(err); }
}

async function exportDepartmentExcel(req, res, next) {
  try {
    const { cycleId } = req.params;
    const { department } = req.query;
    const summary = await reportService.departmentSummary(cycleId, department);
    await generateDepartmentExcel(summary, res);
  } catch (err) { next(err); }
}

module.exports = { individualReport, departmentSummary, ratingDistribution, cycleProgress, exportIndividualPDF, exportDepartmentExcel };
