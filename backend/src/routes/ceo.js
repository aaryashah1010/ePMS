const router = require('express').Router();
const ctrl = require('../controllers/ceoDashboardController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);
router.use(authorize('MANAGING_DIRECTOR'));

router.get('/dashboard', ctrl.getDashboard);
router.get('/dashboard/:cycleId', ctrl.getDashboard);

module.exports = router;
