const prisma = require('../utils/prisma');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');
const { computeKpaScore, computeAttributeScore, computeFinalScore, getRatingBand } = require('./calculationEngine');

const STATUS_FLOW = ['DRAFT', 'SUBMITTED', 'REPORTING_DONE', 'REVIEWING_DONE', 'ACCEPTING_DONE', 'FINALIZED'];

function nextStatus(current) {
  const idx = STATUS_FLOW.indexOf(current);
  return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
}

async function getOrCreateAppraisal(userId, cycleId) {
  let appraisal = await prisma.annualAppraisal.findUnique({
    where: { userId_cycleId: { userId, cycleId } },
  });
  if (!appraisal) {
    const cycle = await prisma.appraisalCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw new NotFoundError('Cycle');
    appraisal = await prisma.annualAppraisal.create({ data: { userId, cycleId } });
  }
  return appraisal;
}

async function getAppraisalFull(userId, cycleId) {
  const a = await prisma.annualAppraisal.findUnique({
    where: { userId_cycleId: { userId, cycleId } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          employeeCode: true,
          reportingOfficerId: true,
          reviewingOfficerId: true,
          acceptingOfficerId: true,
        }
      },
      cycle: true,
      kpaRatings: { include: { kpaGoal: true } },
      attributeRatings: { include: { attribute: true } },
    },
  });
  if (!a) throw new NotFoundError('Annual Appraisal');
  return a;
}

async function updateSelfAssessment(userId, cycleId, achievements) {
  const cycle = await prisma.appraisalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle || cycle.phase !== 'ANNUAL_APPRAISAL') throw new ValidationError('Not in Annual Appraisal phase');

  const a = await getOrCreateAppraisal(userId, cycleId);
  if (a.status !== 'DRAFT') throw new ValidationError('Cannot edit after submission');

  return prisma.annualAppraisal.update({
    where: { userId_cycleId: { userId, cycleId } },
    data: { achievements },
  });
}

async function submitAppraisal(userId, cycleId) {
  const a = await prisma.annualAppraisal.findUnique({ where: { userId_cycleId: { userId, cycleId } } });
  if (!a) throw new NotFoundError('Appraisal');
  if (a.status !== 'DRAFT') throw new ValidationError('Already submitted');

  const kpas = await prisma.kpaGoal.findMany({ where: { userId, cycleId } });
  if (kpas.length === 0) throw new ValidationError('No KPAs found. Complete goal setting first.');

  return prisma.annualAppraisal.update({
    where: { userId_cycleId: { userId, cycleId } },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
  });
}

async function saveKpaRatings(ratedBy, appraisalId, ratings) {
  const appraisal = await prisma.annualAppraisal.findUnique({
    where: { id: appraisalId },
    include: { kpaRatings: true },
  });
  if (!appraisal) throw new NotFoundError('Appraisal');

  // Upsert each KPA rating
  const ops = ratings.map(({ kpaGoalId, rating, remarks }) =>
    prisma.kpaRating.upsert({
      where: { annualAppraisalId_kpaGoalId_ratedBy: { annualAppraisalId: appraisalId, kpaGoalId, ratedBy } },
      update: { rating, remarks },
      create: { annualAppraisalId: appraisalId, kpaGoalId, rating, remarks: remarks || null, ratedBy },
    })
  );
  return Promise.all(ops);
}

async function saveAttributeRatings(ratedBy, appraisalId, ratings) {
  const ops = ratings.map(({ attributeId, rating, remarks }) =>
    prisma.attributeRating.upsert({
      where: { annualAppraisalId_attributeId_ratedBy: { annualAppraisalId: appraisalId, attributeId, ratedBy } },
      update: { rating, remarks },
      create: { annualAppraisalId: appraisalId, attributeId, rating, remarks: remarks || null, ratedBy },
    })
  );
  return Promise.all(ops);
}

async function advanceAppraisalStatus(officerId, userId, cycleId, remarks, expectedStatus) {
  const appraisal = await prisma.annualAppraisal.findUnique({
    where: { userId_cycleId: { userId, cycleId } },
    include: {
      user: true,
      kpaRatings: { include: { kpaGoal: true } },
      attributeRatings: { include: { attribute: true } },
    },
  });
  if (!appraisal) throw new NotFoundError('Appraisal');
  if (appraisal.status !== expectedStatus) {
    throw new ValidationError(`Expected status: ${expectedStatus}, current: ${appraisal.status}`);
  }

  // Validate officer hierarchy
  const employee = appraisal.user;
  if (expectedStatus === 'SUBMITTED' && employee.reportingOfficerId !== officerId) {
    throw new ForbiddenError('Not the reporting officer');
  }
  if (expectedStatus === 'REPORTING_DONE' && employee.reviewingOfficerId !== officerId) {
    throw new ForbiddenError('Not the reviewing officer');
  }
  if (expectedStatus === 'REVIEWING_DONE' && employee.acceptingOfficerId !== officerId) {
    throw new ForbiddenError('Not the accepting officer');
  }

  const next = nextStatus(appraisal.status);
  if (!next) throw new ValidationError('Already in final status');

  let updateData = { status: next };

  // Add remarks based on stage
  if (expectedStatus === 'SUBMITTED') {
    updateData.reportingRemarks = remarks;
    updateData.reportingDoneAt = new Date();
  } else if (expectedStatus === 'REPORTING_DONE') {
    updateData.reviewingRemarks = remarks;
    updateData.reviewingDoneAt = new Date();
  } else if (expectedStatus === 'REVIEWING_DONE') {
    updateData.acceptingRemarks = remarks;
    updateData.acceptingDoneAt = new Date();
  }

  // Compute scores at final stage (ACCEPTING_DONE → FINALIZED)
  if (next === 'FINALIZED') {
    const kpaGoals = await prisma.kpaGoal.findMany({ where: { userId, cycleId } });
    const cycle = await prisma.appraisalCycle.findUnique({ where: { id: cycleId } });
    
    const kpaScore = computeKpaScore(kpaGoals, appraisal.kpaRatings);
    const valuesScore = computeAttributeScore(appraisal.attributeRatings, 'VALUES');
    const competenciesScore = computeAttributeScore(appraisal.attributeRatings, 'COMPETENCIES');
    
    const weights = { kpa: cycle.kpaWeight, values: cycle.valuesWeight, competencies: cycle.competenciesWeight };
    const finalScore = computeFinalScore(kpaScore, valuesScore, competenciesScore, weights);
    const ratingBand = getRatingBand(finalScore);

    updateData = {
      ...updateData,
      kpaScore,
      valuesScore,
      competenciesScore,
      finalScore,
      ratingBand,
      finalizedAt: new Date(),
    };
  }

  return prisma.annualAppraisal.update({
    where: { userId_cycleId: { userId, cycleId } },
    data: updateData,
  });
}

async function getAppraisalsForOfficer(officerId, cycleId, officerRole) {
  let whereCondition = {
    cycleId,
    user: {
      OR: [
        { reportingOfficerId: officerId },
        { reviewingOfficerId: officerId },
        { acceptingOfficerId: officerId },
      ]
    }
  };
  return prisma.annualAppraisal.findMany({
    where: whereCondition,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          employeeCode: true,
          reportingOfficerId: true,
          reviewingOfficerId: true,
          acceptingOfficerId: true,
        }
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

async function hrFinalizeAll(cycleId) {
  const pending = await prisma.annualAppraisal.findMany({
    where: { cycleId, status: 'ACCEPTING_DONE' },
    include: {
      kpaRatings: { include: { kpaGoal: true } },
      attributeRatings: { include: { attribute: true } },
    },
  });

  const cycle = await prisma.appraisalCycle.findUnique({ where: { id: cycleId } });
  const weights = { kpa: cycle.kpaWeight, values: cycle.valuesWeight, competencies: cycle.competenciesWeight };

  const ops = pending.map(async (appraisal) => {
    const kpaGoals = await prisma.kpaGoal.findMany({ where: { userId: appraisal.userId, cycleId } });
    const kpaScore = computeKpaScore(kpaGoals, appraisal.kpaRatings);
    const valuesScore = computeAttributeScore(appraisal.attributeRatings, 'VALUES');
    const competenciesScore = computeAttributeScore(appraisal.attributeRatings, 'COMPETENCIES');
    const finalScore = computeFinalScore(kpaScore, valuesScore, competenciesScore, weights);
    return prisma.annualAppraisal.update({
      where: { id: appraisal.id },
      data: { status: 'FINALIZED', kpaScore, valuesScore, competenciesScore, finalScore, ratingBand: getRatingBand(finalScore), finalizedAt: new Date() },
    });
  });

  return Promise.all(ops);
}

module.exports = {
  getOrCreateAppraisal, getAppraisalFull, updateSelfAssessment, submitAppraisal,
  saveKpaRatings, saveAttributeRatings, advanceAppraisalStatus, getAppraisalsForOfficer, hrFinalizeAll,
};
