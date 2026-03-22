const prisma = require('../utils/prisma');
const { NotFoundError, ValidationError } = require('../utils/errors');

const PHASE_ORDER = ['GOAL_SETTING', 'MID_YEAR_REVIEW', 'ANNUAL_APPRAISAL'];

async function createCycle(data) {
  return prisma.appraisalCycle.create({ data });
}

async function getAllCycles(filters = {}) {
  const where = {};
  if (filters.year) where.year = parseInt(filters.year);
  if (filters.status) where.status = filters.status;
  if (filters.phase) where.phase = filters.phase;

  return prisma.appraisalCycle.findMany({
    where,
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
  });
}

async function getCycleById(id) {
  const cycle = await prisma.appraisalCycle.findUnique({ where: { id } });
  if (!cycle) throw new NotFoundError('Cycle');
  return cycle;
}

async function updateCycle(id, data) {
  const cycle = await prisma.appraisalCycle.findUnique({ where: { id } });
  if (!cycle) throw new NotFoundError('Cycle');
  return prisma.appraisalCycle.update({ where: { id }, data });
}

async function advancePhase(id) {
  const cycle = await prisma.appraisalCycle.findUnique({ where: { id } });
  if (!cycle) throw new NotFoundError('Cycle');
  if (cycle.status === 'CLOSED') throw new ValidationError('Cycle is already closed');

  const currentIndex = PHASE_ORDER.indexOf(cycle.phase);
  if (currentIndex === PHASE_ORDER.length - 1) {
    return prisma.appraisalCycle.update({ where: { id }, data: { status: 'CLOSED' } });
  }
  return prisma.appraisalCycle.update({
    where: { id },
    data: { phase: PHASE_ORDER[currentIndex + 1] },
  });
}

async function closeCycle(id) {
  const cycle = await prisma.appraisalCycle.findUnique({ where: { id } });
  if (!cycle) throw new NotFoundError('Cycle');
  return prisma.appraisalCycle.update({ where: { id }, data: { status: 'CLOSED' } });
}

async function getActiveCycle() {
  return prisma.appraisalCycle.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = { createCycle, getAllCycles, getCycleById, updateCycle, advancePhase, closeCycle, getActiveCycle };
