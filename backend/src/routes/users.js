const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/profile', ctrl.getProfile);
router.get('/reportees', ctrl.getMyReportees);
router.get('/reviewees', ctrl.getMyReviewees);
router.get('/appraisees', ctrl.getMyAppraisees);
router.get('/', authorize('HR'), ctrl.getAllUsers);
router.post('/', authorize('HR'), ctrl.createUser);
router.get('/:id', authorize('HR', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'), ctrl.getUserById);
router.put('/:id', authorize('HR'), ctrl.updateUser);

module.exports = router;
