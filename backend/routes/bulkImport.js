const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { authMiddleware } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'));
        }
    }
});

// Helper: Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Helper: Generate fixed password based on organization subdomain
const generateFixedPassword = async (organizationId) => {
    try {
        const org = await prisma.organization.findUnique({
            where: { id: organizationId }
        });
        if (org && org.subdomain) {
            return `${org.subdomain}@12345`;
        }
    } catch (error) {
        console.error('Error fetching organization:', error);
    }
    return 'DefaultPass@12345';
};

// Helper: Check user authorization for bulk import
const checkBulkImportAuth = async (user, organizationId, departmentId = null) => {
    if (user.role === 'SUPER_ADMIN') {
        // Super admin can import for any org
        return true;
    }
    
    if (user.role === 'DEPT_ADMIN') {
        // Dept admin can only import for their own org and dept
        if (user.organizationId !== organizationId) {
            return false;
        }
        if (departmentId && user.department !== departmentId) {
            return false;
        }
        return true;
    }
    
    // Teachers and students cannot do bulk import
    return false;
};

// Helper: Get organization subdomain for password generation
const getOrgSubdomain = async (orgId) => {
    const org = await prisma.organization.findUnique({
        where: { id: orgId }
    });
    return org?.subdomain || 'org';
};

// ==================== BULK IMPORT STUDENTS ====================
router.post('/students', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const { organizationId, department } = req.body;
        const user = req.user;
        const orgId = organizationId || req.organization?.id || user.organizationId;

        if (!orgId) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        // Check authorization
        const isAuthorized = await checkBulkImportAuth(user, orgId, department || user.department);
        if (!isAuthorized) {
            return res.status(403).json({ error: 'You do not have permission to import students for this organization/department' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Excel file is required' });
        }

        // Read Excel file
        const workbook = XLSX.readFile(req.file.path);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Excel file is empty' });
        }

        const results = {
            success: [],
            errors: [],
            skipped: [], // Already exist
            total: data.length
        };

        // Get fixed password based on organization subdomain
        const subdomain = await getOrgSubdomain(orgId);
        const fixedPassword = `${subdomain}@12345`;
        const hashedPassword = await bcrypt.hash(fixedPassword, 10);

        // Track seen emails and registration numbers in this batch
        const seenEmails = new Set();
        const seenRegNos = new Set();

        // Process each row
        for (let i = 0; i < data.length; i++) {
            try {
                const row = data[i];
                
                // Validate required fields
                if (!row.email || !row.firstName) {
                    results.errors.push({
                        row: i + 2,
                        error: 'Email and First Name are required'
                    });
                    continue;
                }

                const email = row.email.trim().toLowerCase();
                const regNo = row.registrationNumber ? row.registrationNumber.toString().trim() : null;
                
                if (!isValidEmail(email)) {
                    results.errors.push({
                        row: i + 2,
                        error: `Invalid email format: ${email}`
                    });
                    continue;
                }

                // Check for duplicates within this batch
                if (seenEmails.has(email)) {
                    results.skipped.push({
                        row: i + 2,
                        email,
                        reason: 'Duplicate email in this batch'
                    });
                    continue;
                }

                if (regNo && seenRegNos.has(regNo)) {
                    results.skipped.push({
                        row: i + 2,
                        email,
                        reason: `Duplicate registration number: ${regNo}`
                    });
                    continue;
                }

                // Check if user already exists in database
                const existingUser = await prisma.user.findUnique({ where: { email } });
                if (existingUser) {
                    results.skipped.push({
                        row: i + 2,
                        email,
                        reason: 'User already exists'
                    });
                    continue;
                }

                // Create student
                const student = await prisma.user.create({
                    data: {
                        email,
                        password: hashedPassword,
                        firstName: row.firstName.trim(),
                        lastName: row.lastName ? row.lastName.trim() : '',
                        role: 'STUDENT',
                        organizationId: orgId,
                        department: department || row.department || user.department || null,
                        status: 'ACTIVE'
                    }
                });

                seenEmails.add(email);
                if (regNo) seenRegNos.add(regNo);

                results.success.push({
                    email,
                    id: student.id,
                    registrationNumber: regNo || 'N/A'
                });

            } catch (error) {
                results.errors.push({
                    row: i + 2,
                    error: error.message
                });
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            message: 'Bulk student import completed',
            password: fixedPassword,
            ...results
        });

    } catch (error) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Bulk import error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== BULK IMPORT TEACHERS ====================
router.post('/teachers', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const { organizationId, department } = req.body;
        const user = req.user;
        const orgId = organizationId || req.organization?.id || user.organizationId;

        if (!orgId) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        // Check authorization
        const isAuthorized = await checkBulkImportAuth(user, orgId, department || user.department);
        if (!isAuthorized) {
            return res.status(403).json({ error: 'You do not have permission to import teachers for this organization/department' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Excel file is required' });
        }

        // Read Excel file
        const workbook = XLSX.readFile(req.file.path);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Excel file is empty' });
        }

        const results = {
            success: [],
            errors: [],
            skipped: [],
            total: data.length
        };

        // Get fixed password based on organization subdomain
        const subdomain = await getOrgSubdomain(orgId);
        const fixedPassword = `${subdomain}@12345`;
        const hashedPassword = await bcrypt.hash(fixedPassword, 10);

        // Track seen emails in this batch
        const seenEmails = new Set();

        // Process each row
        for (let i = 0; i < data.length; i++) {
            try {
                const row = data[i];
                
                // Validate required fields
                if (!row.email || !row.firstName) {
                    results.errors.push({
                        row: i + 2,
                        error: 'Email and First Name are required'
                    });
                    continue;
                }

                const email = row.email.trim().toLowerCase();
                
                if (!isValidEmail(email)) {
                    results.errors.push({
                        row: i + 2,
                        error: `Invalid email format: ${email}`
                    });
                    continue;
                }

                // Check for duplicates within this batch
                if (seenEmails.has(email)) {
                    results.skipped.push({
                        row: i + 2,
                        email,
                        reason: 'Duplicate email in this batch'
                    });
                    continue;
                }

                // Check if user already exists in database
                const existingUser = await prisma.user.findUnique({ where: { email } });
                if (existingUser) {
                    results.skipped.push({
                        row: i + 2,
                        email,
                        reason: 'User already exists'
                    });
                    continue;
                }

                // Create teacher
                const teacher = await prisma.user.create({
                    data: {
                        email,
                        password: hashedPassword,
                        firstName: row.firstName.trim(),
                        lastName: row.lastName ? row.lastName.trim() : '',
                        role: 'TEACHER',
                        organizationId: orgId,
                        department: department || row.department || user.department || null,
                        status: 'ACTIVE'
                    }
                });

                seenEmails.add(email);

                results.success.push({
                    email,
                    id: teacher.id,
                    teacherId: row.teacherId || 'N/A'
                });

            } catch (error) {
                results.errors.push({
                    row: i + 2,
                    error: error.message
                });
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            message: 'Bulk teacher import completed',
            password: fixedPassword,
            ...results
        });

    } catch (error) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Bulk import error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== BULK MAP STUDENTS TO TEACHERS ====================
router.post('/map-students-to-teachers', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const { organizationId, department } = req.body;
        const user = req.user;
        const orgId = organizationId || req.organization?.id || user.organizationId;

        if (!orgId) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        // Check authorization - ONLY ADMIN and DEPT_ADMIN can do bulk mapping
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'DEPT_ADMIN') {
            return res.status(403).json({ 
                error: 'Only Super Admin and Department Admin can create bulk mappings. Teachers can view their students in My Class section.' 
            });
        }

        // Check department authorization for DEPT_ADMIN
        if (user.role === 'DEPT_ADMIN') {
            if (user.organizationId !== orgId) {
                return res.status(403).json({ error: 'You can only map students in your organization' });
            }
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Excel file is required' });
        }

        // Read Excel file
        const workbook = XLSX.readFile(req.file.path);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Excel file is empty' });
        }

        const results = {
            success: [],
            errors: [],
            skipped: [],
            total: data.length
        };

        // Track seen mappings in this batch
        const seenMappings = new Set();

        // Process each row
        for (let i = 0; i < data.length; i++) {
            try {
                const row = data[i];
                
                // Validate required fields
                if (!row.studentEmail || !row.teacherEmail) {
                    results.errors.push({
                        row: i + 2,
                        error: 'Student Email and Teacher Email are required'
                    });
                    continue;
                }

                const studentEmail = row.studentEmail.trim().toLowerCase();
                const teacherEmail = row.teacherEmail.trim().toLowerCase();
                const mappingKey = `${studentEmail}|${teacherEmail}`;

                // Check for duplicate mappings within this batch
                if (seenMappings.has(mappingKey)) {
                    results.skipped.push({
                        row: i + 2,
                        error: 'Duplicate mapping in this batch'
                    });
                    continue;
                }

                // Find student
                const student = await prisma.user.findUnique({
                    where: { email: studentEmail }
                });

                if (!student) {
                    results.errors.push({
                        row: i + 2,
                        error: `Student not found: ${studentEmail}`
                    });
                    continue;
                }

                if (student.role !== 'STUDENT') {
                    results.errors.push({
                        row: i + 2,
                        error: `User is not a student: ${studentEmail}`
                    });
                    continue;
                }

                // For DEPT_ADMIN: Check student is in their department
                if (user.role === 'DEPT_ADMIN') {
                    if (student.department !== user.department) {
                        results.errors.push({
                            row: i + 2,
                            error: `Student is not in your department: ${studentEmail}`
                        });
                        continue;
                    }
                }

                // Find teacher
                const teacher = await prisma.user.findUnique({
                    where: { email: teacherEmail }
                });

                if (!teacher) {
                    results.errors.push({
                        row: i + 2,
                        error: `Teacher not found: ${teacherEmail}`
                    });
                    continue;
                }

                if (teacher.role !== 'TEACHER') {
                    results.errors.push({
                        row: i + 2,
                        error: `User is not a teacher: ${teacherEmail}`
                    });
                    continue;
                }

                // For DEPT_ADMIN: Check teacher is in their department
                if (user.role === 'DEPT_ADMIN') {
                    if (teacher.department !== user.department) {
                        results.errors.push({
                            row: i + 2,
                            error: `Teacher is not in your department: ${teacherEmail}`
                        });
                        continue;
                    }
                }

                // Map student to teacher (or update if already mapped)
                await prisma.user.update({
                    where: { id: student.id },
                    data: { teacherId: teacher.id }
                });

                seenMappings.add(mappingKey);

                results.success.push({
                    studentEmail,
                    teacherEmail,
                    studentId: student.id,
                    teacherId: teacher.id
                });

            } catch (error) {
                results.errors.push({
                    row: i + 2,
                    error: error.message
                });
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            message: 'Bulk mapping completed',
            ...results
        });

    } catch (error) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Bulk import error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== DOWNLOAD SAMPLE TEMPLATES ====================

// Sample students template
router.get('/template/students', (req, res) => {
    try {
        const data = [
            {
                email: 'student1@example.com',
                firstName: 'John',
                lastName: 'Doe',
                department: 'Engineering',
                password: '' // Leave empty to generate temporary password
            },
            {
                email: 'student2@example.com',
                firstName: 'Jane',
                lastName: 'Smith',
                department: 'Engineering',
                password: ''
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Students_Template.xlsx');
        
        XLSX.write(workbook, { type: 'stream', bookType: 'xlsx', stream: res });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sample teachers template
router.get('/template/teachers', (req, res) => {
    try {
        const data = [
            {
                email: 'teacher1@example.com',
                firstName: 'Dr. Michael',
                lastName: 'Johnson',
                department: 'Engineering',
                password: ''
            },
            {
                email: 'teacher2@example.com',
                firstName: 'Prof. Sarah',
                lastName: 'Williams',
                department: 'Engineering',
                password: ''
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Teachers_Template.xlsx');
        
        XLSX.write(workbook, { type: 'stream', bookType: 'xlsx', stream: res });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sample mapping template
router.get('/template/mapping', (req, res) => {
    try {
        const data = [
            {
                studentEmail: 'student1@example.com',
                teacherEmail: 'teacher1@example.com'
            },
            {
                studentEmail: 'student2@example.com',
                teacherEmail: 'teacher1@example.com'
            },
            {
                studentEmail: 'student3@example.com',
                teacherEmail: 'teacher2@example.com'
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Mapping');

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=StudentTeacher_Mapping_Template.xlsx');
        
        XLSX.write(workbook, { type: 'stream', bookType: 'xlsx', stream: res });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
