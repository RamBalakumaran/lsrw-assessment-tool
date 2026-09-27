const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const groupId = 'test'; // we will just get the first group
        const group = await prisma.group.findFirst({ include: { members: true, tasks: true } });
        if (!group) {
            console.log("No group found");
            return;
        }
        
        console.log("Testing with Group:", group.name);
        const groupMembers = await prisma.groupMembership.findMany({
            where: { groupId: group.id, role: 'MEMBER' },
            include: { user: true }
        });
        
        console.log(`Found ${groupMembers.length} members`);
        const studentIds = groupMembers.map(m => m.userId);
        
        const taskIds = group.tasks.map(t => t.taskId); // wait, group.tasks is GroupTask?
        console.log(`Found ${taskIds.length} tasks in group`);

        if (studentIds.length === 0 || taskIds.length === 0) {
            console.log("No students or tasks");
            return;
        }

        const attempts = await prisma.attempt.findMany({
            where: {
                userId: { in: studentIds },
                taskId: { in: taskIds },
                status: 'COMPLETED'
            },
            include: {
                task: { select: { title: true, type: true } },
                user: { select: { firstName: true, lastName: true, registrationNumber: true, email: true } }
            },
            orderBy: { submittedAt: 'asc' }
        });
        
        console.log(`Found ${attempts.length} attempts`);
        
    } catch (error) {
        console.error("Crash:", error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
