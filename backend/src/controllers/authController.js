const authService = require('../services/authService');
const { logAudit } = require('../utils/auditLogger');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    await logAudit({ userId: result.user.id, action: 'LOGIN', entity: 'User', entityId: result.user.id });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function me(req, res) {
  res.json({ success: true, user: req.user });
}

async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
    await logAudit({ userId: req.user.id, action: 'CHANGE_PASSWORD', entity: 'User', entityId: req.user.id });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

module.exports = { login, me, changePassword };
