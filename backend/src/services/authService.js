const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { AuthError, NotFoundError } = require('../utils/errors');

async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      reportingOfficer: { select: { id: true, name: true } },
      reviewingOfficer: { select: { id: true, name: true } },
      acceptingOfficer: { select: { id: true, name: true } },
    },
  });
  if (!user || !user.isActive) throw new AuthError('Invalid credentials');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AuthError('Invalid credentials');

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
}

async function changePassword(userId, oldPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) throw new AuthError('Current password is incorrect');

  const hashed = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  return { message: 'Password changed successfully' };
}

module.exports = { login, changePassword };
