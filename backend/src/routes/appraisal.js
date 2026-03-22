const router = require('express').Router();
const ctrl = require('../controllers/appraisalController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

// Employee
router.get('/cycle/:cycleId/my', authorize('EMPLOYEE'), ctrl.getMyAppraisal);
router.put('/cycle/:cycleId/self-assessment', authorize('EMPLOYEE'), ctrl.updateSelfAssessment);
router.post('/cycle/:cycleId/submit', authorize('EMPLOYEE'), ctrl.submitAppraisal);

// Officers view employee appraisal
router.get('/cycle/:cycleId/employee/:userId', authorize('REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER', 'HR'), ctrl.getEmployeeAppraisal);

// KPA & Attribute ratings
router.post('/:appraisalId/kpa-ratings', authorize('REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.saveKpaRatings);
router.post('/:appraisalId/attribute-ratings', authorize('REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.saveAttributeRatings);

// Workflow actions
router.post('/cycle/:cycleId/employee/:userId/reporting-done', authorize('REPORTING_OFFICER'), ctrl.reportingOfficerAction);
router.post('/cycle/:cycleId/employee/:userId/reviewing-done', authorize('REVIEWING_OFFICER'), ctrl.reviewingOfficerAction);
router.post('/cycle/:cycleId/employee/:userId/accepting-done', authorize('ACCEPTING_OFFICER'), ctrl.acceptingOfficerAction);

// Officer team view
router.get('/cycle/:cycleId/team', authorize('REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.getTeamAppraisals);

// HR finalize
router.post('/cycle/:cycleId/finalize-all', authorize('HR'), ctrl.hrFinalizeAll);

module.exports = router;
