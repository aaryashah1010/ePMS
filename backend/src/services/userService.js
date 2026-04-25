const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { NotFoundError, ConflictError } = require('../utils/errors');

async function createUser(data) {
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new ConflictError('Email already registered');

  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  const password = await bcrypt.hash(data.password, rounds);

  const user = await prisma.user.create({
    data: { ...data, password },
    select: { id: true, name: true, email: true, role: true, department: true,
              employeeCode: true, reportingOfficerId: true, reviewingOfficerId: true, acceptingOfficerId: true, isActive: true, createdAt: true },
  });

  if (user.reportingOfficerId || user.reviewingOfficerId || user.acceptingOfficerId) {
    await prisma.reportingHistory.create({
      data: {
        userId: user.id,
        reportingOfficerId: user.reportingOfficerId,
        reviewingOfficerId: user.reviewingOfficerId,
        acceptingOfficerId: user.acceptingOfficerId,
      }
    });
  }

  return user;
}

async function getAllUsers(filters = {}) {
  const where = {};
  if (filters.role) where.role = filters.role;
  if (filters.department) where.department = filters.department;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;

  return prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, department: true,
              employeeCode: true, reportingOfficerId: true, reviewingOfficerId: true,
              acceptingOfficerId: true, isActive: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
}

async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, department: true,
              employeeCode: true, reportingOfficerId: true, reviewingOfficerId: true,
              acceptingOfficerId: true, isActive: true, createdAt: true,
              reportingOfficer: { select: { id: true, name: true, role: true } } },
  });
  if (!user) throw new NotFoundError('User');
  return user;
}

async function updateUser(id, data) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User');

  if (data.password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    data.password = await bcrypt.hash(data.password, rounds);
  }

  const officerChanged = 
    (data.reportingOfficerId !== undefined && data.reportingOfficerId !== user.reportingOfficerId) ||
    (data.reviewingOfficerId !== undefined && data.reviewingOfficerId !== user.reviewingOfficerId) ||
    (data.acceptingOfficerId !== undefined && data.acceptingOfficerId !== user.acceptingOfficerId);

  const updatedUser = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, department: true,
              employeeCode: true, reportingOfficerId: true, reviewingOfficerId: true, acceptingOfficerId: true, isActive: true, updatedAt: true },
  });

  if (officerChanged) {
    await prisma.reportingHistory.updateMany({
      where: { userId: id, endDate: null },
      data: { endDate: new Date() }
    });
    
    await prisma.reportingHistory.create({
      data: {
        userId: id,
        reportingOfficerId: updatedUser.reportingOfficerId,
        reviewingOfficerId: updatedUser.reviewingOfficerId,
        acceptingOfficerId: updatedUser.acceptingOfficerId,
      }
    });
  }

  return updatedUser;
}

async function getReportees(officerId) {
  return prisma.user.findMany({
    where: { reportingOfficerId: officerId, isActive: true },
    select: { id: true, name: true, email: true, role: true, department: true, employeeCode: true },
  });
}

module.exports = { createUser, getAllUsers, getUserById, updateUser, getReportees };
