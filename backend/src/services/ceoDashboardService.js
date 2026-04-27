const prisma = require('../utils/prisma');

/**
 * CEO Dashboard Service — aggregates organisation-wide performance data
 */

async function getFullDashboard(cycleId) {
  // Resolve cycle
  let cycle;
  if (cycleId) {
    cycle = await prisma.appraisalCycle.findUnique({ where: { id: cycleId } });
  } else {
    cycle = await prisma.appraisalCycle.findFirst({ where: { status: 'ACTIVE' }, orderBy: { year: 'desc' } });
  }
  if (!cycle) return { cycle: null, cycleStatus: null, performanceSummary: null, departmentPerformance: null, alerts: [], topPerformers: [], bottomPerformers: [], yearOnYear: [] };

  const allCycles = await prisma.appraisalCycle.findMany({ orderBy: { year: 'desc' } });

  // Total employees (non-HR, non-MD)
  const totalEmployees = await prisma.user.count({ where: { isActive: true, role: { notIn: ['HR', 'MANAGING_DIRECTOR'] } } });

  // ── SECTION 1: Cycle Status ──
  const cycleStatus = await buildCycleStatus(cycle.id, totalEmployees);

  // ── SECTION 2: Performance Summary ──
  const performanceSummary = await buildPerformanceSummary(cycle.id);

  // ── SECTION 3: Department Performance ──
  const departmentPerformance = await buildDepartmentPerformance(cycle.id);

  // ── SECTION 4: Key Alerts ──
  const alerts = await buildAlerts(cycle.id, totalEmployees, departmentPerformance);

  // ── SECTION 6: Top & Bottom Performers ──
  const { topPerformers, bottomPerformers } = await buildPerformers(cycle.id);

  // ── SECTION 7: Year on Year ──
  const yearOnYear = await buildYearOnYear(allCycles);

  return {
    cycle: { id: cycle.id, name: cycle.name, year: cycle.year, phase: cycle.phase, status: cycle.status },
    allCycles: allCycles.map(c => ({ id: c.id, name: c.name, year: c.year, phase: c.phase, status: c.status })),
    totalEmployees,
    cycleStatus,
    performanceSummary,
    departmentPerformance,
    alerts,
    topPerformers,
    bottomPerformers,
    yearOnYear,
  };
}

async function buildCycleStatus(cycleId, totalEmployees) {
  // Goal Setting: count distinct employees with approved (REPORTING_DONE+) KPAs
  const kpaEmployees = await prisma.kpaGoal.findMany({
    where: { cycleId },
    select: { userId: true, status: true },
    distinct: ['userId', 'status'],
  });
  const kpaByUser = {};
  for (const k of kpaEmployees) {
    if (!kpaByUser[k.userId]) kpaByUser[k.userId] = new Set();
    kpaByUser[k.userId].add(k.status);
  }
  const goalTotal = Object.keys(kpaByUser).length;
  const goalCompleted = Object.values(kpaByUser).filter(s => !s.has('DRAFT') && !s.has('SUBMITTED')).length;

  // Mid Year
  const midYears = await prisma.midYearReview.findMany({ where: { cycleId }, select: { userId: true, status: true } });
  const myrTotal = midYears.length;
  const myrCompleted = midYears.filter(m => m.status === 'REPORTING_DONE').length;

  // Annual Appraisal stages
  const appraisals = await prisma.annualAppraisal.findMany({
    where: { cycleId },
    select: { userId: true, status: true },
  });
  const apTotal = appraisals.length;

  const selfDone = appraisals.filter(a => a.status !== 'DRAFT').length;
  const roDone = appraisals.filter(a => ['REPORTING_DONE', 'REVIEWING_DONE', 'ACCEPTING_DONE', 'FINALIZED'].includes(a.status)).length;
  const revoDone = appraisals.filter(a => ['REVIEWING_DONE', 'ACCEPTING_DONE', 'FINALIZED'].includes(a.status)).length;
  const aoDone = appraisals.filter(a => ['ACCEPTING_DONE', 'FINALIZED'].includes(a.status)).length;
  const finalized = appraisals.filter(a => a.status === 'FINALIZED').length;

  const stages = [
    { stage: 'Goal Setting', total: totalEmployees, completed: goalCompleted, pending: totalEmployees - goalCompleted },
    { stage: 'Mid Year Review', total: totalEmployees, completed: myrCompleted, pending: totalEmployees - myrCompleted },
    { stage: 'Annual Self Appraisal', total: totalEmployees, completed: selfDone, pending: totalEmployees - selfDone },
    { stage: 'RO Rating', total: totalEmployees, completed: roDone, pending: totalEmployees - roDone },
    { stage: 'RevO Review', total: totalEmployees, completed: revoDone, pending: totalEmployees - revoDone },
    { stage: 'AO Acceptance', total: totalEmployees, completed: aoDone, pending: totalEmployees - aoDone },
    { stage: 'HR Finalized', total: totalEmployees, completed: finalized, pending: totalEmployees - finalized },
  ];

  const overallCompletion = totalEmployees > 0 ? parseFloat(((finalized / totalEmployees) * 100).toFixed(1)) : 0;

  return { stages, overallCompletion };
}

async function buildPerformanceSummary(cycleId) {
  const bands = [
    { band: 'Outstanding', grade: 'Grade A+', color: '#16a34a' },
    { band: 'Good', grade: 'Grade A', color: '#2563eb' },
    { band: 'Average', grade: 'Grade B', color: '#f59e0b' },
    { band: 'Below Average', grade: 'Grade C', color: '#f97316' },
    { band: 'Poor', grade: 'Grade D', color: '#dc2626' },
  ];

  const appraisals = await prisma.annualAppraisal.findMany({
    where: { cycleId, status: 'FINALIZED' },
    select: { ratingBand: true },
  });

  const total = appraisals.length;
  const distribution = {};
  for (const b of bands) distribution[b.band] = 0;
  for (const a of appraisals) {
    if (a.ratingBand && distribution[a.ratingBand] !== undefined) distribution[a.ratingBand]++;
  }

  const result = bands.map(b => ({
    ...b,
    count: distribution[b.band],
    percentage: total > 0 ? parseFloat(((distribution[b.band] / total) * 100).toFixed(1)) : 0,
  }));

  // Bell curve check: "Good" should be the largest group for a normal distribution
  const goodCount = distribution['Average'] + distribution['Good'];
  const tailCount = distribution['Outstanding'] + distribution['Poor'] + distribution['Below Average'];
  const bellCurveOk = total > 0 ? goodCount >= tailCount : false;

  return { total, distribution: result, bellCurveOk };
}

async function buildDepartmentPerformance(cycleId) {
  const appraisals = await prisma.annualAppraisal.findMany({
    where: { cycleId },
    include: { user: { select: { name: true, department: true } } },
  });

  const byDept = {};
  for (const a of appraisals) {
    const dept = a.user.department || 'Unknown';
    if (!byDept[dept]) byDept[dept] = { department: dept, scores: [], employees: [], pending: 0 };
    if (a.status === 'FINALIZED' && a.finalScore != null) {
      byDept[dept].scores.push({ name: a.user.name, score: a.finalScore });
    } else {
      byDept[dept].pending++;
    }
    byDept[dept].employees.push(a.user.name);
  }

  return Object.values(byDept).map(dept => {
    const sorted = dept.scores.sort((a, b) => b.score - a.score);
    const avgScore = sorted.length > 0 ? parseFloat((sorted.reduce((s, e) => s + e.score, 0) / sorted.length).toFixed(2)) : null;
    return {
      department: dept.department,
      avgScore,
      topScorer: sorted.length > 0 ? sorted[0].name : '—',
      bottomScorer: sorted.length > 0 ? sorted[sorted.length - 1].name : '—',
      pending: dept.pending,
      totalEmployees: dept.employees.length,
    };
  }).sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0));
}

async function buildAlerts(cycleId, totalEmployees, deptPerformance) {
  const alerts = [];

  // Pending RO ratings
  const roPending = await prisma.annualAppraisal.count({ where: { cycleId, status: 'SUBMITTED' } });
  if (roPending > 0) alerts.push({ level: 'red', icon: '🔴', text: `${roPending} employee${roPending > 1 ? 's' : ''} RO rating pending — Action needed` });

  // Pending mid-year reviews
  const myrPending = await prisma.midYearReview.count({ where: { cycleId, status: { in: ['DRAFT', 'SUBMITTED'] } } });
  if (myrPending > 0) alerts.push({ level: 'yellow', icon: '🟡', text: `${myrPending} Mid Year Reviews incomplete` });

  // Org average
  const finalized = await prisma.annualAppraisal.findMany({
    where: { cycleId, status: 'FINALIZED', finalScore: { not: null } },
    select: { finalScore: true },
  });
  const orgAvg = finalized.length > 0 ? finalized.reduce((s, e) => s + e.finalScore, 0) / finalized.length : 0;

  // Departments below org average
  const belowAvg = deptPerformance.filter(d => d.avgScore != null && d.avgScore < orgAvg);
  if (belowAvg.length > 0) alerts.push({ level: 'yellow', icon: '🟡', text: `${belowAvg.length} department${belowAvg.length > 1 ? 's' : ''} below org average score (${orgAvg.toFixed(2)})` });

  // Departments with 100% completion
  const fullyComplete = deptPerformance.filter(d => d.pending === 0 && d.totalEmployees > 0);
  for (const d of fullyComplete) {
    alerts.push({ level: 'green', icon: '🟢', text: `${d.department} department 100% cycle completion` });
  }

  // Pending accepting officer
  const aoPending = await prisma.annualAppraisal.count({ where: { cycleId, status: 'REVIEWING_DONE' } });
  if (aoPending > 0) alerts.push({ level: 'red', icon: '🔴', text: `${aoPending} employee${aoPending > 1 ? 's' : ''} AO acceptance pending` });

  return alerts;
}

async function buildPerformers(cycleId) {
  const top = await prisma.annualAppraisal.findMany({
    where: { cycleId, status: 'FINALIZED', finalScore: { not: null } },
    include: { user: { select: { name: true, department: true } } },
    orderBy: { finalScore: 'desc' },
    take: 5,
  });

  const bottom = await prisma.annualAppraisal.findMany({
    where: { cycleId, status: 'FINALIZED', finalScore: { not: null } },
    include: { user: { select: { name: true, department: true } } },
    orderBy: { finalScore: 'asc' },
    take: 5,
  });

  return {
    topPerformers: top.map(a => ({ name: a.user.name, department: a.user.department, score: a.finalScore, band: a.ratingBand })),
    bottomPerformers: bottom.map(a => ({ name: a.user.name, department: a.user.department, score: a.finalScore, band: a.ratingBand })),
  };
}

async function buildYearOnYear(allCycles) {
  const results = [];
  for (const cycle of allCycles.slice(0, 5)) { // Last 5 cycles
    const appraisals = await prisma.annualAppraisal.findMany({
      where: { cycleId: cycle.id, status: 'FINALIZED', finalScore: { not: null } },
      select: { finalScore: true, ratingBand: true },
    });

    const total = await prisma.annualAppraisal.count({ where: { cycleId: cycle.id } });
    const finalized = appraisals.length;
    const avgScore = appraisals.length > 0 ? parseFloat((appraisals.reduce((s, a) => s + a.finalScore, 0) / appraisals.length).toFixed(2)) : null;
    const outstanding = appraisals.filter(a => a.ratingBand === 'Outstanding').length;
    const outstandingPct = appraisals.length > 0 ? parseFloat(((outstanding / appraisals.length) * 100).toFixed(1)) : 0;
    const completionPct = total > 0 ? parseFloat(((finalized / total) * 100).toFixed(1)) : 0;

    results.push({
      cycleId: cycle.id,
      cycleName: cycle.name,
      year: cycle.year,
      avgScore,
      outstandingPct,
      completionPct,
    });
  }
  return results;
}

module.exports = { getFullDashboard };
