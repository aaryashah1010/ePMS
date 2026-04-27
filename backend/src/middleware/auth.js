const jwt = require('jsonwebtoken');
const { AuthError } = require('../utils/errors');
const prisma = require('../utils/prisma');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AuthError('No token provided');
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, department: true,
                reportingOfficerId: true, reviewingOfficerId: true, acceptingOfficerId: true, isActive: true,
                reportingOfficer: { select: { id: true, name: true } },
                reviewingOfficer: { select: { id: true, name: true } },
                acceptingOfficer: { select: { id: true, name: true } } },
    });

    if (!user || !user.isActive) throw new AuthError('User not found or inactive');

    req.user = user;
    req.ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AuthError('Invalid or expired token'));
    }
    next(err);
  }
}

module.exports = { authenticate };
