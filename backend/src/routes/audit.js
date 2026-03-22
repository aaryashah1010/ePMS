const router = require('express').Router();
const ctrl = require('../controllers/auditController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/my', ctrl.getMyAuditLogs);
router.get('/', authorize('HR'), ctrl.getAuditLogs);

module.exports = router;
