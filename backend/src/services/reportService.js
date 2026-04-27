const prisma = require('../utils/prisma');
const { NotFoundError } = require('../utils/errors');

async function individualReport(userId, cycleId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, department: true, employeeCode: true, role: true, reportingOfficerId: true, reviewingOfficerId: true, acceptingOfficerId: true },
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

  const officerIds = new Set();
  if (appraisal) {
    if (appraisal.kpaRatings) appraisal.kpaRatings.forEach(r => officerIds.add(r.ratedBy));
    if (appraisal.attributeRatings) appraisal.attributeRatings.forEach(r => officerIds.add(r.ratedBy));
  }

  const officers = await prisma.user.findMany({
    where: { id: { in: Array.from(officerIds) } },
    select: { id: true, name: true, role: true }
  });
  
  const officerMap = {};
  officers.forEach(o => officerMap[o.id] = o);

  return { user, appraisal, kpas, midYear, officerMap };
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
  const cycle = await prisma.appraisalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) return { goalProgress: {}, midYearProgress: {}, appraisalProgress: {} };

  const statuses = ['DRAFT', 'SUBMITTED', 'REPORTING_DONE', 'REVIEWING_DONE', 'ACCEPTING_DONE', 'FINALIZED'];
  
  const goalProgress = {};
  const midYearProgress = {};
  const appraisalProgress = {};
  
  for (const s of statuses) {
    goalProgress[s] = 0;
    midYearProgress[s] = 0;
    appraisalProgress[s] = 0;
  }

  // Goal Setting Stats — count distinct employees per status (not KPA count)
  const kpaEmployees = await prisma.kpaGoal.findMany({
    where: { cycleId },
    select: { userId: true, status: true },
    distinct: ['userId', 'status'],
  });
  // An employee's effective goal status = their "lowest" status (if any DRAFT, they're still DRAFT)
  const kpaByUser = {};
  for (const k of kpaEmployees) {
    if (!kpaByUser[k.userId]) kpaByUser[k.userId] = new Set();
    kpaByUser[k.userId].add(k.status);
  }
  for (const [, statusSet] of Object.entries(kpaByUser)) {
    // Priority: DRAFT > SUBMITTED > REPORTING_DONE
    let effectiveStatus = 'REPORTING_DONE';
    if (statusSet.has('DRAFT')) effectiveStatus = 'DRAFT';
    else if (statusSet.has('SUBMITTED')) effectiveStatus = 'SUBMITTED';
    if (goalProgress[effectiveStatus] !== undefined) goalProgress[effectiveStatus]++;
  }

  // Mid-Year Stats — count distinct employees per status
  const myrs = await prisma.midYearReview.groupBy({
    by: ['userId', 'status'],
    where: { cycleId },
  });
  const myrByUser = {};
  for (const m of myrs) myrByUser[m.userId] = m.status;
  for (const status of Object.values(myrByUser)) {
    if (midYearProgress[status] !== undefined) midYearProgress[status]++;
  }

  // Annual Appraisal Stats — one row per employee so groupBy works fine
  const appraisals = await prisma.annualAppraisal.groupBy({
    by: ['status'],
    where: { cycleId },
    _count: { status: true },
  });
  for (const a of appraisals) if (appraisalProgress[a.status] !== undefined) appraisalProgress[a.status] += a._count.status;

  return { goalProgress, midYearProgress, appraisalProgress };
}

module.exports = { individualReport, departmentSummary, ratingDistribution, cycleProgress };
