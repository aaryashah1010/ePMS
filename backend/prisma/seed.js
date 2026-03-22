const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const rounds = 10;

  // Create HR Admin
  const hr = await prisma.user.upsert({
    where: { email: 'hr@epms.com' },
    update: {},
    create: {
      name: 'HR Admin',
      email: 'hr@epms.com',
      password: await bcrypt.hash('hr@123', rounds),
      role: 'HR',
      department: 'Human Resources',
      employeeCode: 'HR001',
    },
  });

  // Create Accepting Officer
  const accepting = await prisma.user.upsert({
    where: { email: 'director@epms.com' },
    update: {},
    create: {
      name: 'Director Smith',
      email: 'director@epms.com',
      password: await bcrypt.hash('director@123', rounds),
      role: 'ACCEPTING_OFFICER',
      department: 'Engineering',
      employeeCode: 'DIR001',
    },
  });

  // Create Reviewing Officer
  const reviewing = await prisma.user.upsert({
    where: { email: 'manager@epms.com' },
    update: {},
    create: {
      name: 'Manager Johnson',
      email: 'manager@epms.com',
      password: await bcrypt.hash('manager@123', rounds),
      role: 'REVIEWING_OFFICER',
      department: 'Engineering',
      employeeCode: 'MGR001',
      acceptingOfficerId: accepting.id,
    },
  });

  // Create Reporting Officer
  const reporting = await prisma.user.upsert({
    where: { email: 'teamlead@epms.com' },
    update: {},
    create: {
      name: 'Team Lead Wilson',
      email: 'teamlead@epms.com',
      password: await bcrypt.hash('teamlead@123', rounds),
      role: 'REPORTING_OFFICER',
      department: 'Engineering',
      employeeCode: 'TL001',
      reviewingOfficerId: reviewing.id,
      acceptingOfficerId: accepting.id,
    },
  });

  // Create Employees
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
      reportingOfficerId: reporting.id,
      reviewingOfficerId: reviewing.id,
      acceptingOfficerId: accepting.id,
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
      reportingOfficerId: reporting.id,
      reviewingOfficerId: reviewing.id,
      acceptingOfficerId: accepting.id,
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
      reportingOfficerId: reporting.id,
      reviewingOfficerId: reviewing.id,
      acceptingOfficerId: accepting.id,
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

  // Create sample KPA goals for alice
  const kpa1 = await prisma.kpaGoal.upsert({
    where: { id: 'seed-kpa-alice-1' },
    update: {},
    create: {
      id: 'seed-kpa-alice-1',
      userId: emp1.id,
      cycleId: cycle.id,
      title: 'Deliver Project Alpha',
      description: 'Successfully deliver Project Alpha by Q3 2024 with zero critical bugs',
      weightage: 40,
    },
  });

  const kpa2 = await prisma.kpaGoal.upsert({
    where: { id: 'seed-kpa-alice-2' },
    update: {},
    create: {
      id: 'seed-kpa-alice-2',
      userId: emp1.id,
      cycleId: cycle.id,
      title: 'Code Quality Improvement',
      description: 'Improve test coverage from 60% to 85% across all modules',
      weightage: 30,
    },
  });

  const kpa3 = await prisma.kpaGoal.upsert({
    where: { id: 'seed-kpa-alice-3' },
    update: {},
    create: {
      id: 'seed-kpa-alice-3',
      userId: emp1.id,
      cycleId: cycle.id,
      title: 'Team Knowledge Sharing',
      description: 'Conduct at least 6 technical knowledge sharing sessions',
      weightage: 30,
    },
  });

  console.log('Seed completed successfully!');
  console.log('\n--- Login Credentials ---');
  console.log('HR Admin:          hr@epms.com         / hr@123');
  console.log('Accepting Officer: director@epms.com   / director@123');
  console.log('Reviewing Officer: manager@epms.com    / manager@123');
  console.log('Reporting Officer: teamlead@epms.com   / teamlead@123');
  console.log('Employee 1:        alice@epms.com      / alice@123');
  console.log('Employee 2:        bob@epms.com        / bob@123');
  console.log('Employee 3:        carol@epms.com      / carol@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
