const mysql = require('mysql2/promise');
const { execSync } = require('child_process');
const path = require('path');
const bcrypt = require('bcryptjs');

// Must call this before importing prisma so DATABASE_URL is set correctly if using env vars
require('../config/loadDatabaseEnv')();
const prisma = require('../config/prisma');

async function initDbAndSeed() {
    console.log('[InitDB] Starting database initialization process...');
    try {
        // 1. Create DB if it doesn't exist
        console.log(`[InitDB] Ensuring database '${process.env.DB_NAME}' exists...`);
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            port: process.env.DB_PORT || 3306
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        await connection.end();
        console.log('[InitDB] Database check complete.');

        // 2. Run Prisma push
        console.log('[InitDB] Running Prisma schema push...');
        // Execute relative to the backend directory
        const backendDir = path.resolve(__dirname, '..');
        
        // Execute Prisma using cmd on Windows explicitly to prevent 'npx is not recognized' issues sometimes
        const command = process.platform === 'win32' ? 'npx.cmd prisma db push' : 'npx prisma db push';
        execSync(command, { cwd: backendDir, stdio: 'inherit' });
        console.log('[InitDB] Prisma schema pushed successfully.');

        // 3. Seed Organization
        let org = await prisma.organization.findFirst({
            where: { subdomain: 'nec' }
        });
        
        if (!org) {
            console.log('[InitDB] Creating default organization (NEC)...');
            org = await prisma.organization.create({
                data: {
                    name: 'National Engineering College',
                    subdomain: 'nec',
                    status: 'ACTIVE'
                }
            });
        }

        // 4. Seed Users
        const usersToSeed = [
            { email: 'necadmin@nec.edu.in', role: 'SUPER_ADMIN', firstName: 'Admin' },
            { email: 'testteacher@nec.edu.in', role: 'TEACHER', firstName: 'Teacher' },
            { email: 'teststudent@nec.edu.in', role: 'STUDENT', firstName: 'Student', registrationNumber: 'STU001', academicYear: '1' }
        ];

        const defaultPassword = await bcrypt.hash('123456', 10);

        for (const u of usersToSeed) {
            let user = await prisma.user.findUnique({ where: { email: u.email } });
            if (!user) {
                console.log(`[InitDB] Creating default user: ${u.email}`);
                await prisma.user.create({
                    data: {
                        email: u.email,
                        password: defaultPassword,
                        firstName: u.firstName,
                        lastName: 'Default',
                        role: u.role,
                        organizationId: org.id,
                        forcePasswordReset: false,
                        registrationNumber: u.registrationNumber,
                        academicYear: u.academicYear
                    }
                });
            }
        }
        
        console.log('[InitDB] Database initialization and seeding complete.');

    } catch (error) {
        console.error('[InitDB] Error during initialization:', error);
        // Throwing the error so that the server startup can catch it
        throw error;
    }
}

module.exports = { initDbAndSeed };
