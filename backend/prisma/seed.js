const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const rounds = 10;

  // Create Managing Director (CEO) first
  const ceo = await prisma.user.upsert({
    where: { email: 'ceo@epms.com' },
    update: {},
    create: {
      name: 'Managing Director',
      email: 'ceo@epms.com',
      password: await bcrypt.hash('ceo@123', rounds),
      role: 'MANAGING_DIRECTOR',
      department: 'Management',
      employeeCode: 'MD001',
    },
  });

  // Create HR Admin — reporting to MD
  const hr = await prisma.user.upsert({
    where: { email: 'hr@epms.com' },
    update: {
      reportingOfficerId: ceo.id,
      reviewingOfficerId: ceo.id,
      acceptingOfficerId: ceo.id,
    },
    create: {
      name: 'HR Admin',
      email: 'hr@epms.com',
      password: await bcrypt.hash('hr@123', rounds),
      role: 'HR',
      department: 'Human Resources',
      employeeCode: 'HR001',
      reportingOfficerId: ceo.id,
      reviewingOfficerId: ceo.id,
      acceptingOfficerId: ceo.id,
    },
  });

  // Create Employee
  const emp1 = await prisma.user.upsert({
    where: { email: 'alice@epms.com' },
    update: {},
    create: {
      name: 'Alice Developer',
      email: 'alice@epms.com',
      password: await bcrypt.hash('alice@123', rounds),
      role: 'EMPLOYEE',
      department: 'Engineering',
      employeeCode: 'EMP001',
    },
  });

  const emp2 = await prisma.user.upsert({
    where: { email: 'bob@epms.com' },
    update: {},
    create: {
      name: 'Bob Engineer',
      email: 'bob@epms.com',
      password: await bcrypt.hash('bob@123', rounds),
      role: 'EMPLOYEE',
      department: 'Engineering',
      employeeCode: 'EMP002',
    },
  });

  const emp3 = await prisma.user.upsert({
    where: { email: 'carol@epms.com' },
    update: {},
    create: {
      name: 'Carol Designer',
      email: 'carol@epms.com',
      password: await bcrypt.hash('carol@123', rounds),
      role: 'EMPLOYEE',
      department: 'Design',
      employeeCode: 'EMP003',
    },
  });

  const emp4 = await prisma.user.upsert({
    where: { email: 'dave@epms.com' },
    update: {},
    create: {
      name: 'Dave Analyst',
      email: 'dave@epms.com',
      password: await bcrypt.hash('dave@123', rounds),
      role: 'EMPLOYEE',
      department: 'Data',
      employeeCode: 'EMP004',
    },
  });

  // Create Appraisal Cycle
  const cycle = await prisma.appraisalCycle.upsert({
    where: { id: 'seed-cycle-2024' },
    update: {},
    create: {
      id: 'seed-cycle-2024',
      name: 'Annual Appraisal 2024',
      year: 2024,
      phase: 'GOAL_SETTING',
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      description: 'Annual performance appraisal cycle for FY 2024',
      createdBy: hr.id,
    },
  });

  // Create Attributes Master
  const values = [
    { name: 'Integrity', type: 'VALUES', description: 'Demonstrates honesty and ethical behavior' },
    { name: 'Teamwork', type: 'VALUES', description: 'Works collaboratively with team members' },
    { name: 'Customer Focus', type: 'VALUES', description: 'Prioritizes customer satisfaction' },
    { name: 'Innovation', type: 'VALUES', description: 'Brings creative solutions to problems' },
  ];

  const competencies = [
    { name: 'Communication', type: 'COMPETENCIES', description: 'Communicates clearly and effectively' },
    { name: 'Problem Solving', type: 'COMPETENCIES', description: 'Identifies and resolves issues efficiently' },
    { name: 'Leadership', type: 'COMPETENCIES', description: 'Guides and motivates others' },
    { name: 'Technical Skills', type: 'COMPETENCIES', description: 'Proficiency in required technical areas' },
    { name: 'Time Management', type: 'COMPETENCIES', description: 'Manages time and priorities effectively' },
  ];

  for (const attr of [...values, ...competencies]) {
    await prisma.attributeMaster.upsert({
      where: { id: `seed-attr-${attr.name.toLowerCase().replace(/ /g, '-')}` },
      update: {},
      create: {
        id: `seed-attr-${attr.name.toLowerCase().replace(/ /g, '-')}`,
        ...attr,
      },
    });
  }

  console.log('Seed completed successfully!');
  console.log('\n--- Login Credentials ---');
  console.log('CEO (MD):          ceo@epms.com        / ceo@123');
  console.log('HR Admin:          hr@epms.com         / hr@123');
  console.log('Employee:          alice@epms.com      / alice@123');
  console.log('Employee 2:        bob@epms.com        / bob@123');
  console.log('Employee 3:        carol@epms.com      / carol@123');
  console.log('Employee 4:        dave@epms.com       / dave@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
