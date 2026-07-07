const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Users:', await prisma.user.count());
  console.log('Tasks:', await prisma.task.count());
  console.log('Attempts:', await prisma.attempt.count());
  const admin = await prisma.user.findFirst({where: {role: 'SUPER_ADMIN'}});
  console.log('Admin:', admin);
}

main().catch(console.error).finally(() => prisma.$disconnect());
