const prisma = require('../utils/prisma');
const { NotFoundError } = require('../utils/errors');

async function individualReport(userId, cycleId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, department: true, employeeCode: true, role: true },
  });
  if (!user) throw new NotFoundError('User');

  const appraisal = await prisma.annualAppraisal.findUnique({
    where: { userId_cycleId: { userId, cycleId } },
    include: {
      cycle: true,
      kpaRatings: { include: { kpaGoal: true } },
      attributeRatings: { include: { attribute: true } },
    },
  });

  const kpas = await prisma.kpaGoal.findMany({ where: { userId, cycleId } });
  const midYear = await prisma.midYearReview.findUnique({ where: { userId_cycleId: { userId, cycleId } } });

  return { user, appraisal, kpas, midYear };
}

async function departmentSummary(cycleId, department) {
  const where = { cycleId, user: {} };
  if (department) where.user.department = department;

  const appraisals = await prisma.annualAppraisal.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, department: true, employeeCode: true } },
    },
    orderBy: { finalScore: 'desc' },
  });

  // Group by department
  const byDept = {};
  for (const a of appraisals) {
    const dept = a.user.department || 'Unknown';
    if (!byDept[dept]) byDept[dept] = { department: dept, employees: [], avgFinalScore: 0 };
    byDept[dept].employees.push({
      id: a.user.id,
      name: a.user.name,
      employeeCode: a.user.employeeCode,
      status: a.status,
      finalScore: a.finalScore,
      ratingBand: a.ratingBand,
    });
  }

  // Compute averages
  for (const dept of Object.values(byDept)) {
    const withScores = dept.employees.filter((e) => e.finalScore !== null);
    dept.avgFinalScore = withScores.length
      ? parseFloat((withScores.reduce((s, e) => s + e.finalScore, 0) / withScores.length).toFixed(2))
      : null;
    dept.totalEmployees = dept.employees.length;
    dept.finalized = dept.employees.filter((e) => e.status === 'FINALIZED').length;
  }

  return Object.values(byDept);
}

async function ratingDistribution(cycleId) {
  const bands = ['Poor', 'Below Average', 'Average', 'Good', 'Outstanding'];
  const appraisals = await prisma.annualAppraisal.findMany({
    where: { cycleId, status: 'FINALIZED' },
    select: { ratingBand: true },
  });

  const distribution = {};
  for (const band of bands) distribution[band] = 0;
  for (const a of appraisals) {
    if (a.ratingBand && distribution[a.ratingBand] !== undefined) {
      distribution[a.ratingBand]++;
    }
  }

  return {
    total: appraisals.length,
    distribution,
    percentages: Object.fromEntries(
      Object.entries(distribution).map(([k, v]) => [k, appraisals.length ? parseFloat(((v / appraisals.length) * 100).toFixed(1)) : 0])
    ),
  };
}

async function cycleProgress(cycleId) {
  const statuses = ['DRAFT', 'SUBMITTED', 'REPORTING_DONE', 'REVIEWING_DONE', 'ACCEPTING_DONE', 'FINALIZED'];
  const appraisals = await prisma.annualAppraisal.groupBy({
    by: ['status'],
    where: { cycleId },
    _count: { status: true },
  });

  const progress = {};
  for (const s of statuses) progress[s] = 0;
  for (const a of appraisals) progress[a.status] = a._count.status;

  const total = Object.values(progress).reduce((s, v) => s + v, 0);
  return { total, progress };
}

module.exports = { individualReport, departmentSummary, ratingDistribution, cycleProgress };
