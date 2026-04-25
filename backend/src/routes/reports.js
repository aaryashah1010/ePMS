const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);
router.use(authorize('HR', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'));

router.get('/cycle/:cycleId/individual/:userId', ctrl.individualReport);
router.get('/cycle/:cycleId/individual/:userId/export', ctrl.exportIndividualPDF);
router.get('/cycle/:cycleId/department', ctrl.departmentSummary);
router.get('/cycle/:cycleId/department/export', ctrl.exportDepartmentExcel);
router.get('/cycle/:cycleId/distribution', ctrl.ratingDistribution);
router.get('/cycle/:cycleId/progress', ctrl.cycleProgress);

module.exports = router;
