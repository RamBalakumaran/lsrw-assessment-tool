const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authMiddleware, authorize } = require('../middleware/auth');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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

// ============================================
// GROUP MANAGEMENT ROUTES
// ============================================

/**
 * Create a new group
 * Authorized: TEACHER, DEPT_ADMIN, ADMIN
 */
router.post('/', authMiddleware, authorize(['TEACHER', 'DEPT_ADMIN', 'ADMIN']), async (req, res) => {
    try {
        const { name, description, academicYear, section, departmentId, status = 'ACTIVE' } = req.body;
        const userId = req.user.id;
        const orgId = req.user.organizationId;

        // Validate required fields
        if (!name || !departmentId) {
            return res.status(400).json({ error: 'Name and departmentId are required' });
        }

        // Verify user has access to the department
        const department = await prisma.department.findFirst({
            where: {
                id: departmentId,
                organizationId: orgId,
                ...(req.user.role === 'DEPT_ADMIN' && { adminId: userId })
            }
        });

        if (!department && req.user.role === 'DEPT_ADMIN') {
            return res.status(403).json({ error: 'Access denied to this department' });
        }

        // Check if group name already exists in this department
        const existingGroup = await prisma.group.findFirst({
            where: {
                organizationId: orgId,
                departmentId,
                name
            }
        });

        if (existingGroup) {
            return res.status(400).json({ error: 'Group name already exists in this department' });
        }

        // Create the group
        const group = await prisma.group.create({
            data: {
                name,
                description,
                academicYear,
                section,
                status,
                organizationId: orgId,
                departmentId,
                ownerId: userId,
                members: {
                    create: [
                        {
                            userId,
                            role: 'OWNER'
                        }
                    ]
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, email: true, firstName: true, lastName: true, role: true }
                        }
                    }
                },
                owner: { select: { id: true, email: true, firstName: true, lastName: true } }
            }
        });

        // Log audit
        await logAudit(userId, 'GROUP_CREATED', 'Group', group.id, { action: 'GROUP_CREATED', groupName: name }, req);

        res.status(201).json(group);
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

/**
 * Get all groups accessible to the user
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const orgId = req.user.organizationId;

        let whereClause = { organizationId: orgId };

        // Different filter based on role
        if (req.user.role === 'STUDENT') {
            // Students see only groups they're members of
            whereClause = {
                ...whereClause,
                members: {
                    some: { userId }
                }
            };
        } else if (req.user.role === 'TEACHER' || req.user.role === 'DEPT_ADMIN') {
            // Teachers and Coordinators see groups they own or collaborate on
            whereClause = {
                organizationId: orgId,
                OR: [
                    { ownerId: userId },
                    { members: { some: { userId, role: 'COLLABORATOR' } } }
                ]
            };
        }
        // ADMIN sees all groups in their organization

        const groups = await prisma.group.findMany({
            where: whereClause,
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, email: true, firstName: true, lastName: true, role: true }
                        }
                    }
                },
                owner: { select: { id: true, email: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(groups);
    } catch (error) {
        console.error('Fetch groups error:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

/**
 * Get a specific group
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const orgId = req.user.organizationId;

        const group = await prisma.group.findFirst({
            where: {
                id,
                organizationId: orgId
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true }
                        }
                    }
                },
                owner: { select: { id: true, email: true, firstName: true, lastName: true } },
                department: { select: { id: true, name: true } },
                tasks: {
                    include: {
                        task: {
                            select: {
                                id: true,
                                title: true,
                                type: true,
                                status: true,
                                createdAt: true
                            }
                        }
                    }
                }
            }
        });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check access: student must be a member, others must be owner/collaborator or admin
        if (req.user.role === 'STUDENT') {
            const isMember = group.members.some(m => m.userId === userId);
            if (!isMember) {
                return res.status(403).json({ error: 'Access denied' });
            }
        } else if (req.user.role === 'TEACHER') {
            const hasAccess = group.ownerId === userId || group.members.some(m => m.userId === userId);
            if (!hasAccess) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        res.json(group);
    } catch (error) {
        console.error('Fetch group error:', error);
        res.status(500).json({ error: 'Failed to fetch group' });
    }
});

/**
 * Add members to group (owner only)
 */
router.post('/:id/members', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { userIds, role = 'COLLABORATOR' } = req.body;
        const userId = req.user.id;
        const orgId = req.user.organizationId;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'userIds array is required' });
        }

        // Check if user is the group owner
        const group = await prisma.group.findFirst({
            where: {
                id,
                organizationId: orgId,
                ownerId: userId
            }
        });

        if (!group) {
            return res.status(403).json({ error: 'Only group owner can add members' });
        }

        // Add members
        const newMembers = await Promise.all(
            userIds.map(memberId =>
                prisma.groupMembership.upsert({
                    where: {
                        userId_groupId: {
                            userId: memberId,
                            groupId: id
                        }
                    },
                    update: { role },
                    create: {
                        userId: memberId,
                        groupId: id,
                        role
                    },
                    include: {
                        user: {
                            select: { id: true, email: true, firstName: true, lastName: true }
                        }
                    }
                })
            )
        );

        await logAudit(userId, 'GROUP_MEMBERS_ADDED', 'Group', id, { addedCount: userIds.length }, req);

        res.status(200).json({ message: 'Members added successfully', members: newMembers });
    } catch (error) {
        console.error('Add group members error:', error);
        res.status(500).json({ error: 'Failed to add members' });
    }
});

/**
 * Remove member from group (owner only)
 */
router.delete('/:id/members/:memberId', authMiddleware, async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const userId = req.user.id;
        const orgId = req.user.organizationId;

        // Check if user is the group owner
        const group = await prisma.group.findFirst({
            where: {
                id,
                organizationId: orgId,
                ownerId: userId
            }
        });

        if (!group) {
            return res.status(403).json({ error: 'Only group owner can remove members' });
        }

        // Prevent owner from removing themselves
        if (memberId === userId) {
            return res.status(400).json({ error: 'Owner cannot remove themselves' });
        }

        await prisma.groupMembership.delete({
            where: {
                userId_groupId: {
                    userId: memberId,
                    groupId: id
                }
            }
        });

        await logAudit(userId, 'GROUP_MEMBER_REMOVED', 'Group', id, { removedUserId: memberId }, req);

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Remove group member error:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

/**
 * Add students to group
 */
router.post('/:id/students', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { studentIds } = req.body;
        const userId = req.user.id;
        const orgId = req.user.organizationId;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ error: 'studentIds array is required' });
        }

        // Verify group exists and user has access
        const group = await prisma.group.findFirst({
            where: {
                id,
                organizationId: orgId
            }
        });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check if user is owner or collaborator
        const member = await prisma.groupMembership.findFirst({
            where: {
                groupId: id,
                userId,
                role: { in: ['OWNER', 'COLLABORATOR'] }
            }
        });

        if (!member && req.user.role !== 'ADMIN' && req.user.role !== 'DEPT_ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Add students as members
        const addedStudents = await Promise.all(
            studentIds.map(studentId =>
                prisma.groupMembership.upsert({
                    where: {
                        userId_groupId: {
                            userId: studentId,
                            groupId: id
                        }
                    },
                    update: {},
                    create: {
                        userId: studentId,
                        groupId: id,
                        role: 'MEMBER'
                    },
                    include: {
                        user: {
                            select: { id: true, email: true, firstName: true, lastName: true }
                        }
                    }
                })
            )
        );

        await logAudit(userId, 'STUDENTS_ADDED_TO_GROUP', 'Group', id, { studentCount: studentIds.length }, req);

        res.status(200).json({ message: 'Students added successfully', students: addedStudents });
    } catch (error) {
        console.error('Add students error:', error);
        res.status(500).json({ error: 'Failed to add students' });
    }
});

/**
 * Update group
 */
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, academicYear, section, status } = req.body;
        const userId = req.user.id;
        const orgId = req.user.organizationId;

        // Check if user is the group owner
        const group = await prisma.group.findFirst({
            where: {
                id,
                organizationId: orgId,
                ownerId: userId
            }
        });

        if (!group) {
            return res.status(403).json({ error: 'Only group owner can update the group' });
        }

        const updatedGroup = await prisma.group.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(academicYear && { academicYear }),
                ...(section && { section }),
                ...(status && { status })
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, email: true, firstName: true, lastName: true }
                        }
                    }
                }
            }
        });

        await logAudit(userId, 'GROUP_UPDATED', 'Group', id, { changes: { name, description, status } }, req);

        res.json(updatedGroup);
    } catch (error) {
        console.error('Update group error:', error);
        res.status(500).json({ error: 'Failed to update group' });
    }
});

/**
 * Delete group (owner only)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const orgId = req.user.organizationId;

        // Check if user is the group owner
        const group = await prisma.group.findFirst({
            where: {
                id,
                organizationId: orgId,
                ownerId: userId
            }
        });

        if (!group) {
            return res.status(403).json({ error: 'Only group owner can delete the group' });
        }

        await prisma.group.delete({
            where: { id }
        });

        await logAudit(userId, 'GROUP_DELETED', 'Group', id, { groupName: group.name }, req);

        res.json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Delete group error:', error);
        res.status(500).json({ error: 'Failed to delete group' });
    }
});

/**
 * Download Excel template for bulk student upload
 */
router.get('/bulk-template', authMiddleware, authorize(['TEACHER', 'DEPT_ADMIN', 'ADMIN']), (req, res) => {
    const headers = [
        'registrationNumber',
        'firstName',
        'lastName',
        'academicYear',
        'section',
        'studentEmail',
        'teacherEmail'
    ];
    const sampleRow = [
        '21CS001',
        'Alice',
        'Smith',
        '2024-2025',
        'A',
        'alice@example.com',
        'teacher@nec.edu.in'
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="bulk_students_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
});

/**
 * Validate bulk student Excel upload (preview with errors)
 */
router.post('/:id/bulk-validate', authMiddleware, authorize(['TEACHER', 'DEPT_ADMIN', 'ADMIN']), upload.single('file'), async (req, res) => {
    const groupId = req.params.id;
    const orgId = req.user.organizationId;
    const userId = req.user.id;

    if (!req.file) {
        return res.status(400).json({ error: 'Excel file is required' });
    }

    try {
        // Verify group access
        const group = await prisma.group.findFirst({
            where: { id: groupId, organizationId: orgId },
            include: { members: true }
        });
        if (!group) return res.status(404).json({ error: 'Group not found' });

        const membership = await prisma.groupMembership.findFirst({
            where: { groupId, userId, role: { in: ['OWNER', 'COLLABORATOR'] } }
        });
        if (!membership && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Parse Excel
        const wb = XLSX.readFile(req.file.path);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        // Cleanup temp file
        try { fs.unlinkSync(req.file.path); } catch (e) {}

        // Fetch existing registrations in org
        const existingRegs = await prisma.user.findMany({
            where: { organizationId: orgId, registrationNumber: { not: null } },
            select: { registrationNumber: true, email: true }
        });
        const regSet = new Set(existingRegs.map(u => u.registrationNumber?.toLowerCase()));
        const emailSet = new Set(existingRegs.map(u => u.email?.toLowerCase()));

        // Fetch existing group members
        const groupMemberUserIds = new Set(group.members.map(m => m.userId));

        const preview = [];
        const seenRegs = new Set();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const errors = [];

            const regNo = String(row.registrationNumber || '').trim();
            const firstName = String(row.firstName || '').trim();
            const lastName = String(row.lastName || '').trim();
            const acYear = String(row.academicYear || '').trim();
            const section = String(row.section || '').trim();
            const studentEmail = String(row.studentEmail || '').trim();
            const teacherEmail = String(row.teacherEmail || '').trim();

            if (!regNo) errors.push('registrationNumber is required');
            if (!firstName) errors.push('firstName is required');
            if (!acYear) errors.push('academicYear is required');

            if (regNo) {
                if (regSet.has(regNo.toLowerCase())) errors.push(`Registration number ${regNo} already exists`);
                if (seenRegs.has(regNo.toLowerCase())) errors.push(`Duplicate registration number in file: ${regNo}`);
                seenRegs.add(regNo.toLowerCase());
            }

            if (studentEmail && emailSet.has(studentEmail.toLowerCase())) {
                errors.push(`Email ${studentEmail} already in use`);
            }

            // Resolve teacher
            let teacherId = null;
            if (teacherEmail) {
                const teacher = await prisma.user.findFirst({
                    where: { email: teacherEmail.toLowerCase(), organizationId: orgId, role: 'TEACHER' }
                });
                if (!teacher) errors.push(`Teacher not found: ${teacherEmail}`);
                else teacherId = teacher.id;
            }

            const derivedEmail = studentEmail || `${regNo.toLowerCase()}@nec.edu.in`;

            preview.push({
                rowIndex: i + 2,
                registrationNumber: regNo,
                firstName,
                lastName,
                academicYear: acYear,
                section,
                studentEmail,
                teacherEmail,
                teacherId,
                derivedEmail,
                valid: errors.length === 0,
                errors
            });
        }

        const validCount = preview.filter(r => r.valid).length;
        res.json({ preview, validCount, totalRows: rows.length });
    } catch (error) {
        console.error('Bulk validate error:', error);
        // Cleanup temp file on error
        if (req.file?.path) try { fs.unlinkSync(req.file.path); } catch (e) {}
        res.status(500).json({ error: 'Failed to validate file' });
    }
});

/**
 * Confirm and import validated students into group
 */
router.post('/:id/bulk-confirm', authMiddleware, authorize(['TEACHER', 'DEPT_ADMIN', 'ADMIN']), async (req, res) => {
    const groupId = req.params.id;
    const orgId = req.user.organizationId;
    const userId = req.user.id;
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ error: 'Students array is required' });
    }

    try {
        // Verify group access
        const group = await prisma.group.findFirst({
            where: { id: groupId, organizationId: orgId }
        });
        if (!group) return res.status(404).json({ error: 'Group not found' });

        const membership = await prisma.groupMembership.findFirst({
            where: { groupId, userId, role: { in: ['OWNER', 'COLLABORATOR'] } }
        });
        if (!membership && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const validStudents = students.filter(s => s.valid !== false);
        const results = [];

        for (const s of validStudents) {
            try {
                const email = s.derivedEmail || `${s.registrationNumber.toLowerCase()}@nec.edu.in`;
                const hashedPwd = await bcrypt.hash('123456', 10);

                // Create user if not existing
                let user = await prisma.user.findUnique({ where: { email } });
                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            email,
                            password: hashedPwd,
                            firstName: s.firstName,
                            lastName: s.lastName,
                            role: 'STUDENT',
                            organizationId: orgId,
                            registrationNumber: s.registrationNumber,
                            academicYear: s.academicYear,
                            section: s.section || null,
                            studentEmail: s.studentEmail || null,
                            teacherId: s.teacherId || null,
                            status: 'ACTIVE',
                            forcePasswordReset: true,
                            department: group.department || null
                        }
                    });
                }

                // Add to group as MEMBER (upsert)
                await prisma.groupMembership.upsert({
                    where: { userId_groupId: { userId: user.id, groupId } },
                    update: {},
                    create: { userId: user.id, groupId, role: 'MEMBER' }
                });

                results.push({ registrationNumber: s.registrationNumber, userId: user.id, status: 'created' });
            } catch (err) {
                results.push({ registrationNumber: s.registrationNumber, status: 'error', message: err.message });
            }
        }

        await logAudit(userId, 'BULK_STUDENTS_IMPORTED', 'Group', groupId, { count: validStudents.length }, req);

        res.json({ message: `${results.filter(r => r.status === 'created').length} students imported`, results });
    } catch (error) {
        console.error('Bulk confirm error:', error);
        res.status(500).json({ error: 'Failed to import students' });
    }
});

/**
 * Helper function to log audit
 */
async function logAudit(userId, action, entityType, entityId, changes, req) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                changes,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });
    } catch (err) {
        console.error('Audit log error:', err);
    }
}

module.exports = router;

