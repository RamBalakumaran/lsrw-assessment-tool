const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.task.updateMany({
    where: { visibilityScope: 'ORGANIZATION' },
    data: { visibilityScope: 'GLOBAL' },
  });
  console.log(`Updated ${result.count} tasks from ORGANIZATION to GLOBAL.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
