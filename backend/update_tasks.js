const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.task.updateMany({
    where: { status: 'DRAFT' },
    data: { status: 'PUBLISHED' },
  });
  console.log(`Updated ${result.count} tasks from DRAFT to PUBLISHED.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
