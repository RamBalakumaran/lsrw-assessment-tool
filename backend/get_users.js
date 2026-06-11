require('./config/loadDatabaseEnv')();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    fs.writeFileSync('users_clean.txt', JSON.stringify(users.map(u => ({ id: u.id, email: u.email, role: u.role })), null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
