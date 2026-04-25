const prisma = require('../utils/prisma');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');
const { sendEmail } = require('../utils/emailService');

async function createKpa(userId, cycleId, data) {
  const cycle = await prisma.appraisalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new NotFoundError('Cycle');
  if (cycle.status !== 'ACTIVE') throw new ValidationError('Cycle is not active');
  if (cycle.phase !== 'GOAL_SETTING') throw new ValidationError('Cycle is not in Goal Setting phase');

  // Check weight won't exceed 100
  const existing = await prisma.kpaGoal.findMany({
    where: { userId, cycleId, status: { not: 'SUBMITTED' } },
  });
  const totalWeight = existing.reduce((s, k) => s + k.weightage, 0);
  if (totalWeight + data.weightage > 100) {
    throw new ValidationError(`Adding this KPA would exceed 100% total weightage (current: ${totalWeight}%)`);
  }

  return prisma.kpaGoal.create({ data: { userId, cycleId, ...data } });
}

async function getKpas(userId, cycleId) {
  return prisma.kpaGoal.findMany({
    where: { userId, cycleId },
    orderBy: { createdAt: 'asc' },
  });
}

async function getKpaById(id) {
  const kpa = await prisma.kpaGoal.findUnique({ where: { id } });
  if (!kpa) throw new NotFoundError('KPA');
  return kpa;
}

async function updateKpa(id, userId, data) {
  const kpa = await prisma.kpaGoal.findUnique({ where: { id } });
  if (!kpa) throw new NotFoundError('KPA');
  if (kpa.userId !== userId) throw new ForbiddenError('Cannot edit another user\'s KPA');
  if (kpa.status !== 'DRAFT') throw new ValidationError('KPA is locked after submission');

  if (data.weightage !== undefined) {
    const others = await prisma.kpaGoal.findMany({
      where: { userId, cycleId: kpa.cycleId, id: { not: id }, status: { not: 'SUBMITTED' } },
    });
    const total = others.reduce((s, k) => s + k.weightage, 0) + data.weightage;
    if (total > 100) throw new ValidationError(`Total weightage cannot exceed 100% (others: ${others.reduce((s, k) => s + k.weightage, 0)}%)`);
  }

  return prisma.kpaGoal.update({ where: { id }, data });
}

async function deleteKpa(id, userId) {
  const kpa = await prisma.kpaGoal.findUnique({ where: { id } });
  if (!kpa) throw new NotFoundError('KPA');
  if (kpa.userId !== userId) throw new ForbiddenError('Cannot delete another user\'s KPA');
  if (kpa.status !== 'DRAFT') throw new ValidationError('Cannot delete a submitted KPA');
  return prisma.kpaGoal.delete({ where: { id } });
}

async function submitKpas(userId, cycleId) {
  const kpas = await prisma.kpaGoal.findMany({
    where: { userId, cycleId, status: 'DRAFT' },
  });
  if (kpas.length === 0) throw new ValidationError('No KPAs to submit');

  const totalWeight = kpas.reduce((s, k) => s + k.weightage, 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    throw new ValidationError(`Total KPA weightage must equal 100%. Current total: ${totalWeight}%`);
  }

  await prisma.kpaGoal.updateMany({
    where: { userId, cycleId, status: 'DRAFT' },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
  });

  // Fetch reporting officer to send email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { reportingOfficer: true }
  });

  if (user && user.reportingOfficer) {
    await sendEmail(
      user.reportingOfficer.email,
      `Action Required: Goals Submitted by ${user.name}`,
      `Hello ${user.reportingOfficer.name},\n\nYour reportee ${user.name} has submitted their KPA goals for review.\nPlease log in to the e-PMS to review them.`
    );
  }

  return { message: 'KPAs submitted successfully', count: kpas.length };
}

async function getKpasForOfficer(officerId, cycleId) {
  return prisma.kpaGoal.findMany({
    where: {
      cycleId,
      user: { reportingOfficerId: officerId },
    },
    include: {
      user: { select: { id: true, name: true, email: true, department: true, employeeCode: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

async function reviewKpas(officerId, cycleId, employeeId, action, remarks) {
  // Check if officer actually is the reporting officer
  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!employee) throw new NotFoundError('Employee');
  if (employee.reportingOfficerId !== officerId) throw new ForbiddenError('You are not the reporting officer for this employee');

  const kpas = await prisma.kpaGoal.findMany({
    where: { userId: employeeId, cycleId, status: 'SUBMITTED' }
  });

  if (kpas.length === 0) throw new ValidationError('No submitted KPAs found for this employee');

  if (action === 'ACCEPT') {
    await prisma.kpaGoal.updateMany({
      where: { userId: employeeId, cycleId, status: 'SUBMITTED' },
      data: { status: 'REPORTING_DONE', reportingRemarks: null }
    });
    
    await sendEmail(
      employee.email,
      `Goals Accepted`,
      `Hello ${employee.name},\n\nYour KPA goals have been accepted by your Reporting Officer.`
    );

    return { message: 'Goals accepted successfully' };
  } else if (action === 'REJECT') {
    if (!remarks) throw new ValidationError('Remarks are required for rejection');
    await prisma.kpaGoal.updateMany({
      where: { userId: employeeId, cycleId, status: 'SUBMITTED' },
      data: { status: 'DRAFT', reportingRemarks: remarks }
    });

    await sendEmail(
      employee.email,
      `Action Required: Goals Rejected`,
      `Hello ${employee.name},\n\nYour KPA goals have been rejected by your Reporting Officer.\nRemarks: ${remarks}\n\nPlease log in to the e-PMS, update your goals, and resubmit them.`
    );

    return { message: 'Goals rejected and sent back to draft' };
  } else {
    throw new ValidationError('Invalid action');
  }
}

module.exports = { createKpa, getKpas, getKpaById, updateKpa, deleteKpa, submitKpas, getKpasForOfficer, reviewKpas };
