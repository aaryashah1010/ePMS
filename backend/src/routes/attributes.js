const router = require('express').Router();
const ctrl = require('../controllers/attributeController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

router.get('/', ctrl.getAllAttributes);
router.post('/', authorize('HR'), ctrl.createAttribute);
router.put('/:id', authorize('HR'), ctrl.updateAttribute);
router.delete('/:id', authorize('HR'), ctrl.deleteAttribute);

module.exports = router;
