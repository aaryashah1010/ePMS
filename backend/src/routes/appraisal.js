const router = require('express').Router();
const ctrl = require('../controllers/appraisalController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

// Employee
router.get('/cycle/:cycleId/my', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.getMyAppraisal);
router.put('/cycle/:cycleId/self-assessment', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.updateSelfAssessment);
router.post('/cycle/:cycleId/submit', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.submitAppraisal);

// Officers view employee appraisal
router.get('/cycle/:cycleId/employee/:userId', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER', 'HR'), ctrl.getEmployeeAppraisal);

// KPA & Attribute ratings
router.post('/:appraisalId/kpa-ratings', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.saveKpaRatings);
router.post('/:appraisalId/attribute-ratings', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.saveAttributeRatings);

// Workflow actions (service layer enforces the actual officer relationship)
router.post('/cycle/:cycleId/employee/:userId/reporting-done', authorize('EMPLOYEE', 'REPORTING_OFFICER'), ctrl.reportingOfficerAction);
router.post('/cycle/:cycleId/employee/:userId/reviewing-done', authorize('EMPLOYEE', 'REVIEWING_OFFICER'), ctrl.reviewingOfficerAction);
router.post('/cycle/:cycleId/employee/:userId/accepting-done', authorize('EMPLOYEE', 'ACCEPTING_OFFICER'), ctrl.acceptingOfficerAction);

// Officer team view
router.get('/cycle/:cycleId/team', authorize('EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.getTeamAppraisals);

// HR finalize
router.post('/cycle/:cycleId/finalize-all', authorize('HR'), ctrl.hrFinalizeAll);

module.exports = router;
