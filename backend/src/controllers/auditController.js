const prisma = require('../utils/prisma');

async function getAuditLogs(req, res, next) {
  try {
    const { userId, entity, page = 1, limit = 50 } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (entity) where.entity = entity;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ success: true, logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

async function getMyAuditLogs(req, res, next) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, logs });
  } catch (err) { next(err); }
}

module.exports = { getAuditLogs, getMyAuditLogs };
