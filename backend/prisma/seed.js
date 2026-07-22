require('../config/loadDatabaseEnv')();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    const hashedPassword = await bcrypt.hash('123456', 10);

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
        where: { email: 'admin@nec.edu.in' },
        update: {
            firstName: 'System',
            lastName: 'Administrator',
            role: 'SUPER_ADMIN',
            organizationId: org.id,
            department: 'Administration',
            status: 'ACTIVE',
        },
        create: {
            email: 'admin@nec.edu.in',
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
        where: { email: 'orgadmin@nec.edu.in' },
        update: {
            firstName: 'Olivia',
            lastName: 'Manager',
            role: 'ADMIN',
            organizationId: org.id,
            department: 'Administration',
            status: 'ACTIVE',
        },
        create: {
            email: 'orgadmin@nec.edu.in',
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
        where: { email: 'deptadmin@nec.edu.in' },
        update: {
            firstName: 'Maya',
            lastName: 'Coordinator',
            role: 'DEPT_ADMIN',
            organizationId: org.id,
            department: 'Computer Science',
            status: 'ACTIVE',
        },
        create: {
            email: 'deptadmin@nec.edu.in',
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
        where: { email: 'teacher@nec.edu.in' },
        update: {
            firstName: 'Sarah',
            lastName: 'Instructor',
            role: 'TEACHER',
            organizationId: org.id,
            department: 'Computer Science',
            status: 'ACTIVE',
        },
        create: {
            email: 'teacher@nec.edu.in',
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
        where: { email: 'student@nec.edu.in' },
        update: {
            firstName: 'Alex',
            lastName: 'Learner',
            role: 'STUDENT',
            organizationId: org.id,
            department: 'Computer Science',
            status: 'ACTIVE',
        },
        create: {
            email: 'student@nec.edu.in',
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
        where: { email: 'student2@nec.edu.in' },
        update: {
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'STUDENT',
            organizationId: org.id,
            department: 'Computer Science',
            status: 'ACTIVE',
        },
        create: {
            email: 'student2@nec.edu.in',
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
    console.log('Super Admin:    admin@nec.edu.in / 123456');
    console.log('Org Admin:      orgadmin@nec.edu.in / 123456');
    console.log('Dept Admin:     deptadmin@nec.edu.in / 123456');
    console.log('Teacher:        teacher@nec.edu.in / 123456');
    console.log('Student 1:      student@nec.edu.in / 123456');
    console.log('Student 2:      student2@nec.edu.in / 123456');
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
