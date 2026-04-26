const router = require('express').Router();
const ctrl = require('../controllers/cycleController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/active', ctrl.getActiveCycle);
router.get('/', ctrl.getAllCycles);
router.post('/', authorize('HR'), ctrl.createCycle);
router.get('/:id', ctrl.getCycleById);
router.get('/:id/pending-work', authorize('HR'), ctrl.getPendingWork);
router.put('/:id', authorize('HR'), ctrl.updateCycle);
router.post('/:id/advance-phase', authorize('HR'), ctrl.advancePhase);
router.post('/:id/close', authorize('HR'), ctrl.closeCycle);
router.delete('/:id', authorize('HR'), ctrl.deleteCycle);

module.exports = router;
