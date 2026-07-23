const { Sequelize } = require('./src/models');
const db = require('./src/models');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const alex = await prisma.user.findFirst({ where: { firstName: 'Alex' } });
    
    // Check db.Response
    const userResponses = await db.Response.findAll({
        where: { userId: alex.id }
    });
    console.log(`db.Response count for Alex: ${userResponses.length}`);
    
    const assignedIds = userResponses.filter(r => r.status === 'ASSIGNED').map(r => r.taskId);
    console.log(`db.Response ASSIGNED count: ${assignedIds.length}`);
    
    const completedIds = userResponses.filter(r => r.status !== 'ASSIGNED').map(r => r.taskId);
    console.log(`db.Response COMPLETED count: ${completedIds.length}`);

}
main().catch(console.error).finally(() => prisma.$disconnect());
