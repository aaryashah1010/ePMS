const prisma = require('../utils/prisma');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');

async function createOrUpdateMidYear(userId, cycleId, data) {
  const cycle = await prisma.appraisalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new NotFoundError('Cycle');
  if (cycle.status !== 'ACTIVE') throw new ValidationError('Cycle is not active');
  if (cycle.phase !== 'MID_YEAR_REVIEW') throw new ValidationError('Cycle is not in Mid-Year Review phase');

  const existing = await prisma.midYearReview.findUnique({ where: { userId_cycleId: { userId, cycleId } } });

  if (existing) {
    if (existing.status === 'SUBMITTED') throw new ValidationError('Mid-year review already submitted');
    return prisma.midYearReview.update({
      where: { userId_cycleId: { userId, cycleId } },
      data,
    });
  }

  return prisma.midYearReview.create({ data: { userId, cycleId, ...data } });
}

async function submitMidYear(userId, cycleId) {
  const review = await prisma.midYearReview.findUnique({
    where: { userId_cycleId: { userId, cycleId } },
  });
  if (!review) throw new NotFoundError('Mid-Year Review');
  if (review.status === 'SUBMITTED') throw new ValidationError('Already submitted');

  return prisma.midYearReview.update({
    where: { userId_cycleId: { userId, cycleId } },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
  });
}

async function getMidYearById(userId, cycleId) {
  return prisma.midYearReview.findUnique({
    where: { userId_cycleId: { userId, cycleId } },
    include: { user: { select: { id: true, name: true, email: true, department: true } } },
  });
}

async function addReportingRemarks(officerId, userId, cycleId, remarks) {
  const review = await prisma.midYearReview.findUnique({
    where: { userId_cycleId: { userId, cycleId } },
    include: { user: true },
  });
  if (!review) throw new NotFoundError('Mid-Year Review');
  if (review.user.reportingOfficerId !== officerId) throw new ForbiddenError('Not the reporting officer for this employee');
  if (review.status !== 'SUBMITTED') throw new ValidationError('Employee has not submitted their mid-year review');

  return prisma.midYearReview.update({
    where: { userId_cycleId: { userId, cycleId } },
    data: { reportingRemarks: remarks, status: 'REPORTING_DONE' },
  });
}

async function getMidYearForOfficer(officerId, cycleId) {
  return prisma.midYearReview.findMany({
    where: {
      cycleId,
      user: { reportingOfficerId: officerId },
    },
    include: {
      user: { select: { id: true, name: true, email: true, department: true, employeeCode: true } },
    },
  });
}

module.exports = { createOrUpdateMidYear, submitMidYear, getMidYearById, addReportingRemarks, getMidYearForOfficer };
