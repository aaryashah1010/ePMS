const router = require('express').Router();
const ctrl = require('../controllers/midYearController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/cycle/:cycleId/my', authorize('EMPLOYEE'), ctrl.getMyMidYear);
router.post('/cycle/:cycleId', authorize('EMPLOYEE'), ctrl.saveMyMidYear);
router.post('/cycle/:cycleId/submit', authorize('EMPLOYEE'), ctrl.submitMyMidYear);

router.get('/cycle/:cycleId/team', authorize('REPORTING_OFFICER', 'HR'), ctrl.getTeamMidYear);
router.post('/cycle/:cycleId/employee/:userId/remarks', authorize('REPORTING_OFFICER'), ctrl.addRemarks);
router.get('/cycle/:cycleId/employee/:userId', authorize('REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER', 'HR'), ctrl.getEmployeeMidYear);

module.exports = router;
