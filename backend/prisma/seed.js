require('../config/loadDatabaseEnv')();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create Organization
    const org = await prisma.organization.upsert({
        where: { subdomain: 'fluent' },
        update: {
            name: 'FluentPro University',
            status: 'ACTIVE',
        },
        create: {
            name: 'FluentPro University',
            subdomain: 'fluent',
            status: 'ACTIVE',
        },
    });

    console.log('✅ Organization created:', org.name);

    // 2. Create Super Admin
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@fluentpro.com' },
        update: {
            firstName: 'System',
            lastName: 'Administrator',
            role: 'SUPER_ADMIN',
            organizationId: org.id,
            department: 'Administration',
            status: 'ACTIVE',
        },
        create: {
            email: 'admin@fluentpro.com',
            password: hashedPassword,
            firstName: 'System',
            lastName: 'Administrator',
            role: 'SUPER_ADMIN',
            organizationId: org.id,
            department: 'Administration',
            status: 'ACTIVE',
        },
    });

    console.log('✅ Super Admin created:', superAdmin.email);

    // 3. Create Organization Admin
    const orgAdmin = await prisma.user.upsert({
        where: { email: 'orgadmin@fluentpro.com' },
        update: {
            firstName: 'Olivia',
            lastName: 'Manager',
            role: 'ADMIN',
            organizationId: org.id,
            department: 'Administration',
            status: 'ACTIVE',
        },
        create: {
            email: 'orgadmin@fluentpro.com',
            password: hashedPassword,
            firstName: 'Olivia',
            lastName: 'Manager',
            role: 'ADMIN',
            organizationId: org.id,
            department: 'Administration',
            status: 'ACTIVE',
        },
    });

    console.log('✅ Organization Admin created:', orgAdmin.email);

    // 4. Create Department Admin
    const departmentAdmin = await prisma.user.upsert({
        where: { email: 'deptadmin@fluentpro.com' },
        update: {
            firstName: 'Maya',
            lastName: 'Coordinator',
            role: 'DEPT_ADMIN',
            organizationId: org.id,
            department: 'Computer Science',
            status: 'ACTIVE',
        },
        create: {
            email: 'deptadmin@fluentpro.com',
            password: hashedPassword,
            firstName: 'Maya',
            lastName: 'Coordinator',
            role: 'DEPT_ADMIN',
            organizationId: org.id,
            department: 'Computer Science',
            status: 'ACTIVE',
        },
    });

    console.log('✅ Department Admin created:', departmentAdmin.email);

    // 5. Create Teacher
    const teacher = await prisma.user.upsert({
        where: { email: 'teacher@fluentpro.com' },
        update: {
            firstName: 'Sarah',
            lastName: 'Instructor',
            role: 'TEACHER',
            organizationId: org.id,
            department: 'Computer Science',
            status: 'ACTIVE',
        },
        create: {
            email: 'teacher@fluentpro.com',
            password: hashedPassword,
            firstName: 'Sarah',
            lastName: 'Instructor',
            role: 'TEACHER',
            organizationId: org.id,
            department: 'Computer Science',
            status: 'ACTIVE',
        },
    });

    console.log('✅ Teacher created:', teacher.email);

    // 6. Create Students
    const student1 = await prisma.user.upsert({
        where: { email: 'student@fluentpro.com' },
        update: {
            firstName: 'Alex',
            lastName: 'Learner',
            role: 'STUDENT',
            organizationId: org.id,
            department: 'Computer Science',
            status: 'ACTIVE',
        },
        create: {
            email: 'student@fluentpro.com',
            password: hashedPassword,
            firstName: 'Alex',
            lastName: 'Learner',
            role: 'STUDENT',
            organizationId: org.id,
            department: 'Computer Science',
            status: 'ACTIVE',
        },
    });

    console.log('✅ Student 1 created:', student1.email);

    const student2 = await prisma.user.upsert({
        where: { email: 'student2@fluentpro.com' },
        update: {
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'STUDENT',
            organizationId: org.id,
            department: 'Computer Science',
            status: 'ACTIVE',
        },
        create: {
            email: 'student2@fluentpro.com',
            password: hashedPassword,
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'STUDENT',
            organizationId: org.id,
            department: 'Computer Science',
            status: 'ACTIVE',
        },
    });

    console.log('✅ Student 2 created:', student2.email);

    // 7. Create Department
    const dept = await prisma.department.upsert({
        where: {
            organizationId_name: {
                organizationId: org.id,
                name: 'Computer Science',
            },
        },
        update: {
            status: 'ACTIVE',
            adminId: departmentAdmin.id,
        },
        create: {
            name: 'Computer Science',
            status: 'ACTIVE',
            organizationId: org.id,
            adminId: departmentAdmin.id,
        },
    });

    console.log('✅ Department created:', dept.name);

    console.log('\n' + '='.repeat(50));
    console.log('✅ SEED DATA CREATED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📝 Test Credentials:\n');
    console.log('Super Admin:    admin@fluentpro.com / password123');
    console.log('Org Admin:      orgadmin@fluentpro.com / password123');
    console.log('Dept Admin:     deptadmin@fluentpro.com / password123');
    console.log('Teacher:        teacher@fluentpro.com / password123');
    console.log('Student 1:      student@fluentpro.com / password123');
    console.log('Student 2:      student2@fluentpro.com / password123');
    console.log('\n' + '='.repeat(50) + '\n');
}

main()
    .catch((e) => {
        console.error('❌ Error in seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
