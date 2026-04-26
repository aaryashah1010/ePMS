const prisma = require('../utils/prisma');
const { NotFoundError, ValidationError } = require('../utils/errors');

const PHASE_ORDER = ['GOAL_SETTING', 'MID_YEAR_REVIEW', 'ANNUAL_APPRAISAL'];

async function createCycle(data) {
  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (data.startDate < today) {
    throw new ValidationError('Start date cannot be in the past');
  }
  if (data.endDate < data.startDate) {
    throw new ValidationError('End date must be after start date');
  }

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
  
  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);

  const startDateToCompare = data.startDate || cycle.startDate;
  const endDateToCompare = data.endDate || cycle.endDate;

  if (data.startDate && data.startDate.getTime() !== cycle.startDate.getTime()) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (data.startDate < today) {
      throw new ValidationError('Start date cannot be in the past');
    }
  }

  if (endDateToCompare < startDateToCompare) {
    throw new ValidationError('End date must be after start date');
  }

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

async function deleteCycle(id) {
  const cycle = await prisma.appraisalCycle.findUnique({ where: { id } });
  if (!cycle) throw new NotFoundError('Cycle');

  return prisma.$transaction([
    prisma.kpaRating.deleteMany({
      where: {
        kpaGoal: { cycleId: id }
      }
    }),
    prisma.attributeRating.deleteMany({
      where: {
        annualAppraisal: { cycleId: id }
      }
    }),
    prisma.kpaGoal.deleteMany({ where: { cycleId: id } }),
    prisma.midYearReview.deleteMany({ where: { cycleId: id } }),
    prisma.annualAppraisal.deleteMany({ where: { cycleId: id } }),
    prisma.appraisalCycle.delete({ where: { id } })
  ]);
}

module.exports = { createCycle, getAllCycles, getCycleById, updateCycle, advancePhase, closeCycle, getActiveCycle, deleteCycle };
