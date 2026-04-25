const router = require('express').Router();
const ctrl = require('../controllers/kpaController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

// Employee routes (all except HR can set goals)
router.post('/cycle/:cycleId', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.createKpa);
router.get('/cycle/:cycleId/my', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.getMyKpas);
router.post('/cycle/:cycleId/submit', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.submitKpas);
router.put('/:id', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.updateKpa);
router.delete('/:id', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.deleteKpa);

// Officer routes
router.post('/cycle/:cycleId/employee/:userId/review', authorize('REPORTING_OFFICER', 'HR'), ctrl.reviewKpas);
router.get('/cycle/:cycleId/team', authorize('REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER', 'HR'), ctrl.getKpasForOfficer);
router.get('/cycle/:cycleId/employee/:userId', authorize('REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER', 'HR'), ctrl.getEmployeeKpas);

module.exports = router;
