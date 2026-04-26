const router = require('express').Router();
const ctrl = require('../controllers/midYearController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/cycle/:cycleId/my', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.getMyMidYear);
router.post('/cycle/:cycleId', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.saveMyMidYear);
router.post('/cycle/:cycleId/submit', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.submitMyMidYear);

// Officer routes (EMPLOYEE role can also be an officer via FK relationships)
router.get('/cycle/:cycleId/team', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER', 'HR'), ctrl.getTeamMidYear);
router.post('/cycle/:cycleId/employee/:userId/remarks', authorize('EMPLOYEE', 'REPORTING_OFFICER'), ctrl.addRemarks);
router.get('/cycle/:cycleId/employee/:userId', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER', 'HR'), ctrl.getEmployeeMidYear);

module.exports = router;
