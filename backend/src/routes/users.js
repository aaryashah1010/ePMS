const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/profile', ctrl.getProfile);
router.get('/reportees', ctrl.getMyReportees);
router.get('/reviewees', ctrl.getMyReviewees);
router.get('/appraisees', ctrl.getMyAppraisees);
router.get('/', authorize('HR', 'MANAGING_DIRECTOR'), ctrl.getAllUsers);
router.post('/', authorize('HR', 'MANAGING_DIRECTOR'), ctrl.createUser);
router.get('/:id', authorize('HR', 'MANAGING_DIRECTOR', 'EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.getUserById);
router.put('/:id', authorize('HR', 'MANAGING_DIRECTOR'), ctrl.updateUser);

module.exports = router;
