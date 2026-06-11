require('./config/loadDatabaseEnv')();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const tasks = await prisma.task.findMany({
        orderBy: { createdAt: 'desc' }
    });
    fs.writeFileSync('tasks_dump.json', JSON.stringify(tasks, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
