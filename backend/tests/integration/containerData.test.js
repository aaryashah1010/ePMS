const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { clearModule, loadModule } = require('../helpers/module');

const prismaPath = path.join(__dirname, '../../src/utils/prisma.js');
const authServicePath = path.join(__dirname, '../../src/services/authService.js');

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://epms_user:epms_pass@localhost:5433/epms_db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'epms-super-secret-jwt-key-change-in-production-2024';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

test('container-backed database exposes seeded users and the seeded cycle', async () => {
  clearModule(prismaPath);
  const prisma = require(prismaPath);

  try {
    const hrUser = await prisma.user.findUnique({ where: { email: 'hr@epms.com' } });
    const cycle = await prisma.appraisalCycle.findUnique({ where: { id: 'seed-cycle-2024' } });

    assert.equal(hrUser.email, 'hr@epms.com');
    assert.equal(hrUser.role, 'HR');
    assert.equal(cycle.name, 'Annual Appraisal 2024');
    assert.equal(cycle.status, 'ACTIVE');
  } finally {
    await prisma.$disconnect();
    clearModule(prismaPath);
  }
});

test('authService can log in with seeded container credentials', async () => {
  clearModule(prismaPath);
  clearModule(authServicePath);

  const service = loadModule(authServicePath);
  const prisma = require(prismaPath);

  try {
    const result = await service.login('hr@epms.com', 'hr@123');

    assert.ok(result.token);
    assert.equal(result.user.email, 'hr@epms.com');
    assert.equal(result.user.password, undefined);
  } finally {
    await prisma.$disconnect();
    clearModule(prismaPath);
    clearModule(authServicePath);
  }
});
