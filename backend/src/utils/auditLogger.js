const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function logAudit({ userId, action, entity, entityId, oldValue, newValue, ipAddress }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId || null,
        oldValue: oldValue || null,
        newValue: newValue || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

module.exports = { logAudit };
