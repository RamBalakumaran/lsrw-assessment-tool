require('./config/loadDatabaseEnv')();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const teacher = await prisma.user.findFirst({
        where: { role: 'TEACHER' }
    });

    if (teacher) {
        const result = await prisma.task.updateMany({
            where: { createdById: null },
            data: {
                createdById: teacher.id,
                createdByRole: 'TEACHER'
            }
        });
        console.log(`Successfully assigned ${result.count} older tasks to Teacher (${teacher.email})`);
    } else {
        console.log("No teacher found in the database. Could not assign tasks.");
    }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
