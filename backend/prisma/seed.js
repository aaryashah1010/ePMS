const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const rounds = 10;

  // Create Managing Director (CEO) — the only seeded account
  await prisma.user.upsert({
    where: { email: 'ceo@epms.com' },
    update: {},
    create: {
      name: 'Managing Director',
      email: 'ceo@epms.com',
      password: await bcrypt.hash('123456', rounds),
      role: 'MANAGING_DIRECTOR',
      department: 'Management',
      employeeCode: 'MD001',
    },
  });

  // Seed Attribute Master Data (Values & Competencies)
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
  console.log('CEO (MD):  ceo@epms.com  /  ceo@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
