const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const globalTasks = await prisma.task.findMany({
        where: { visibilityScope: 'GLOBAL', status: 'PUBLISHED' }
    });
    console.log('Global tasks:', globalTasks.length);

    const groupTasks = await prisma.task.findMany({
        where: { status: 'PUBLISHED' },
        include: { groupAssignments: true }
    });
    console.log('Group tasks found with Prisma:', groupTasks.filter(t => t.groupAssignments.length > 0).length);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
