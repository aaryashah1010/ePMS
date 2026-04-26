const prisma = require('../utils/prisma');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { sendEmail } = require('../utils/emailService');

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

  const cycle = await prisma.appraisalCycle.create({ data });

  prisma.user.findMany({ where: { role: 'EMPLOYEE', isActive: true }, select: { email: true } })
    .then(employees => {
      employees.forEach(emp => {
        sendEmail(
          emp.email,
          `New Appraisal Cycle: ${cycle.name}`,
          `Hello,\n\nA new appraisal cycle "${cycle.name}" for the year ${cycle.year} has been created.\n\nThe current phase is ${cycle.phase.replace(/_/g, ' ')}.\n\nPlease log in to the e-PMS portal to view your dashboard.`
        ).catch(err => console.error(`Failed to send cycle email to ${emp.email}:`, err));
      });
    })
    .catch(err => console.error('Failed to fetch employees for cycle email:', err));

  return cycle;
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
  
  // Prevent updating core fields after creation
  delete data.name;
  delete data.startDate;
  delete data.year;

  if (data.endDate) data.endDate = new Date(data.endDate);

  const startDateToCompare = cycle.startDate;
  const endDateToCompare = data.endDate || cycle.endDate;

  if (endDateToCompare < startDateToCompare) {
    throw new ValidationError('End date must be after start date');
  }

  const updatedCycle = await prisma.appraisalCycle.update({ where: { id }, data });

  if (data.status && data.status !== cycle.status) {
    prisma.user.findMany({ where: { role: 'EMPLOYEE', isActive: true }, select: { email: true } })
      .then(employees => {
        employees.forEach(emp => {
          sendEmail(
            emp.email,
            `Appraisal Cycle Update: ${updatedCycle.name}`,
            `Hello,\n\nThe status of the appraisal cycle "${updatedCycle.name}" has been changed to ${data.status}.\n\nPlease log in to the e-PMS portal for details.`
          ).catch(err => console.error(`Failed to send update email to ${emp.email}:`, err));
        });
      })
      .catch(err => console.error('Failed to fetch employees for cycle update email:', err));
  }

  return updatedCycle;
}

async function advancePhase(id) {
  const cycle = await prisma.appraisalCycle.findUnique({ where: { id } });
  if (!cycle) throw new NotFoundError('Cycle');
  if (cycle.status === 'CLOSED') throw new ValidationError('Cycle is already closed');

  const currentIndex = PHASE_ORDER.indexOf(cycle.phase);
  let updatedCycle;
  if (currentIndex === PHASE_ORDER.length - 1) {
    updatedCycle = await prisma.appraisalCycle.update({ where: { id }, data: { status: 'CLOSED' } });
  } else {
    updatedCycle = await prisma.appraisalCycle.update({
      where: { id },
      data: { phase: PHASE_ORDER[currentIndex + 1] },
    });
  }

  const newStatus = updatedCycle.status === 'CLOSED' ? 'officially closed' : `advanced to the ${updatedCycle.phase.replace(/_/g, ' ')} phase`;
  
  prisma.user.findMany({ where: { role: 'EMPLOYEE', isActive: true }, select: { email: true } })
    .then(employees => {
      employees.forEach(emp => {
        sendEmail(
          emp.email,
          `Appraisal Cycle Update: ${updatedCycle.name}`,
          `Hello,\n\nThe appraisal cycle "${updatedCycle.name}" has been ${newStatus}.\n\nPlease log in to the e-PMS portal to review any required actions.`
        ).catch(err => console.error(`Failed to send phase email to ${emp.email}:`, err));
      });
    })
    .catch(err => console.error('Failed to fetch employees:', err));

  return updatedCycle;
}

async function closeCycle(id) {
  const cycle = await prisma.appraisalCycle.findUnique({ where: { id } });
  if (!cycle) throw new NotFoundError('Cycle');
  const updatedCycle = await prisma.appraisalCycle.update({ where: { id }, data: { status: 'CLOSED' } });

  prisma.user.findMany({ where: { role: 'EMPLOYEE', isActive: true }, select: { email: true } })
    .then(employees => {
      employees.forEach(emp => {
        sendEmail(
          emp.email,
          `Appraisal Cycle Closed: ${updatedCycle.name}`,
          `Hello,\n\nThe appraisal cycle "${updatedCycle.name}" has been officially closed by HR.\n\nThank you for your participation.`
        ).catch(err => console.error(`Failed to send close email to ${emp.email}:`, err));
      });
    })
    .catch(err => console.error('Failed to fetch employees:', err));

  return updatedCycle;
}

async function getActiveCycle() {
  return prisma.appraisalCycle.findMany({
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

async function getPendingWork(cycleId) {
  const cycle = await prisma.appraisalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new NotFoundError('Cycle');

  const employees = await prisma.user.findMany({ 
    where: { role: 'EMPLOYEE', isActive: true },
    select: { id: true, name: true, employeeCode: true }
  });

  const pendingEmployees = [];

  for (const emp of employees) {
    if (cycle.phase === 'GOAL_SETTING') {
      const kpas = await prisma.kpaGoal.findMany({ where: { userId: emp.id, cycleId } });
      const totalWeight = kpas.reduce((sum, k) => sum + k.weightage, 0);
      const allAccepted = kpas.length > 0 && kpas.every(k => k.status === 'REPORTING_DONE');
      if (totalWeight !== 100 || !allAccepted) {
        pendingEmployees.push(emp.name);
      }
    } else if (cycle.phase === 'MID_YEAR_REVIEW') {
      const myr = await prisma.midYearReview.findUnique({ where: { userId_cycleId: { userId: emp.id, cycleId } } });
      if (!myr || myr.status !== 'REPORTING_DONE') {
        pendingEmployees.push(emp.name);
      }
    } else if (cycle.phase === 'APPRAISAL') {
      const app = await prisma.annualAppraisal.findUnique({ where: { userId_cycleId: { userId: emp.id, cycleId } } });
      if (!app || (app.status !== 'FINALIZED' && app.status !== 'ACCEPTING_DONE')) {
        pendingEmployees.push(emp.name);
      }
    }
  }

  return { pendingCount: pendingEmployees.length, pendingEmployees };
}

module.exports = { createCycle, getAllCycles, getCycleById, getActiveCycle, updateCycle, advancePhase, closeCycle, deleteCycle, getPendingWork };
