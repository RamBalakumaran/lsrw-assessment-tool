const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const responses = await prisma.attempt.findMany({
        where: { user: { firstName: 'Alex' } }
    });
    console.log(`Alex has ${responses.length} responses.`);
    
    const globalTasks = await prisma.task.findMany({
        where: { visibilityScope: 'GLOBAL', status: 'PUBLISHED' }
    });
    
    const completedTaskIds = responses.filter(r => r.status !== 'ASSIGNED').map(r => r.taskId);
    console.log(`Alex completed ${completedTaskIds.length} tasks.`);
    
    const pendingGlobalTasks = globalTasks.filter(task => !completedTaskIds.includes(task.id));
    console.log(`Alex has ${pendingGlobalTasks.length} pending global tasks.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
