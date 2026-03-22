const router = require('express').Router();
const ctrl = require('../controllers/kpaController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

// Employee routes
router.post('/cycle/:cycleId', authorize('EMPLOYEE'), ctrl.createKpa);
router.get('/cycle/:cycleId/my', authorize('EMPLOYEE'), ctrl.getMyKpas);
router.post('/cycle/:cycleId/submit', authorize('EMPLOYEE'), ctrl.submitKpas);
router.put('/:id', authorize('EMPLOYEE'), ctrl.updateKpa);
router.delete('/:id', authorize('EMPLOYEE'), ctrl.deleteKpa);

// Officer routes
router.get('/cycle/:cycleId/team', authorize('REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER', 'HR'), ctrl.getKpasForOfficer);
router.get('/cycle/:cycleId/employee/:userId', authorize('REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER', 'HR'), ctrl.getEmployeeKpas);

module.exports = router;
