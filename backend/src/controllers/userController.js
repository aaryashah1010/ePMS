const userService = require('../services/userService');
const { logAudit } = require('../utils/auditLogger');

async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(req.body);
    await logAudit({ userId: req.user.id, action: 'CREATE_USER', entity: 'User', entityId: user.id, newValue: { email: user.email, role: user.role } });
    res.status(201).json({ success: true, user });
  } catch (err) { next(err); }
}

async function getAllUsers(req, res, next) {
  try {
    const users = await userService.getAllUsers(req.query);
    res.json({ success: true, users });
  } catch (err) { next(err); }
}

async function getUserById(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, user });
  } catch (err) { next(err); }
}

async function updateUser(req, res, next) {
  try {
    const before = await userService.getUserById(req.params.id);
    const user = await userService.updateUser(req.params.id, req.body);
    await logAudit({ userId: req.user.id, action: 'UPDATE_USER', entity: 'User', entityId: user.id, oldValue: before, newValue: req.body });
    res.json({ success: true, user });
  } catch (err) { next(err); }
}

async function getMyReportees(req, res, next) {
  try {
    const reportees = await userService.getReportees(req.user.id);
    res.json({ success: true, reportees });
  } catch (err) { next(err); }
}

async function getMyReviewees(req, res, next) {
  try {
    const reviewees = await userService.getReviewees(req.user.id);
    res.json({ success: true, reviewees });
  } catch (err) { next(err); }
}

async function getMyAppraisees(req, res, next) {
  try {
    const appraisees = await userService.getAppraisees(req.user.id);
    res.json({ success: true, appraisees });
  } catch (err) { next(err); }
}

async function getProfile(req, res, next) {
  try {
    const user = await userService.getUserById(req.user.id);
    res.json({ success: true, user });
  } catch (err) { next(err); }
}

module.exports = { createUser, getAllUsers, getUserById, updateUser, getMyReportees, getMyReviewees, getMyAppraisees, getProfile };
