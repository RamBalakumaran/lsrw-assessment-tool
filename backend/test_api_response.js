const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const dotenv = require('dotenv');
dotenv.config();

async function main() {
    const alex = await prisma.user.findFirst({ where: { firstName: 'Alex' } });
    
    // Create token
    const token = jwt.sign(
        { id: alex.id, role: alex.role, organizationId: alex.organizationId }, 
        process.env.JWT_SECRET || 'fallback_secret', 
        { expiresIn: '1h' }
    );
    
    try {
        const res = await fetch('http://localhost:5000/api/dashboard/student', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Response Keys:", Object.keys(data));
        console.log(`Global tasks in API response: ${data.globalTasks?.length ?? 'UNDEFINED'}`);
        console.log(`Group cards in API response: ${data.groupCards?.length ?? 'UNDEFINED'}`);
        console.log(`Assigned tasks in API response: ${data.assignedTasks?.length ?? 'UNDEFINED'}`);
    } catch (e) {
        console.error("Request failed:", e.message);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
