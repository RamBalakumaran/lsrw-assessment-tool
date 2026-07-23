const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const tasks = await prisma.task.findMany({
        include: { groupAssignments: true },
        take: 5
    });
    console.log(JSON.stringify(tasks, null, 2));
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
