const router = require('express').Router();
const { login, me, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const prisma = require('../utils/prisma');

router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePassword);

// Public endpoint for quick-fill demo accounts on login page
router.get('/demo-accounts', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { email: true, role: true, name: true, employeeCode: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
    res.json({ accounts: users });
  } catch (err) {
    res.json({ accounts: [] });
  }
});

module.exports = router;
