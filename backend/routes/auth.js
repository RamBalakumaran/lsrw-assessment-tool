const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { authMiddleware } = require('../middleware/auth');
const {
    buildUserProfile,
    parseGroupMembershipsInput,
    resolveAssignedTeacher,
    userProfileInclude,
} = require('../utils/userProfile');

// Helper to log audits locally
async function logAudit(userId, action, entityType, entityId, changes, req) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                changes: changes || {},
                ipAddress: req?.ip || null,
                userAgent: req?.get ? req.get('user-agent') : null
            }
        });
    } catch (err) {
        console.error('Audit log error in auth:', err);
    }
}

// Register User
router.post('/register', async (req, res) => {
    const {
        email,
        password,
        firstName,
        lastName,
        role,
        organizationId,
        department,
        teacherId,
        teacherEmail,
        groupMemberships,
        registrationNumber,
        academicYear,
        section,
        studentEmail
    } = req.body;

    try {
        // Enforce organization check
        const orgId = organizationId || req.organization?.id;
        if (!orgId) {
            return res.status(400).json({ error: 'Organization ID is required.' });
        }

        const normalizedRole = role || 'STUDENT';
        let normalizedEmail = email?.trim().toLowerCase();

        let regNo = null;
        let acYear = null;
        let sec = null;
        let optEmail = null;

        if (normalizedRole === 'STUDENT') {
            regNo = registrationNumber?.trim();
            if (!regNo) {
                return res.status(400).json({ error: 'Registration number is required for students.' });
            }
            acYear = academicYear?.trim();
            if (!acYear) {
                return res.status(400).json({ error: 'Academic year is required for students.' });
            }
            sec = section?.trim() || null;
            optEmail = studentEmail?.trim() || null;

            // Check duplicate registration number
            const existingReg = await prisma.user.findFirst({
                where: {
                    organizationId: orgId,
                    registrationNumber: regNo
                }
            });
            if (existingReg) {
                return res.status(400).json({ error: 'Registration number already exists.' });
            }

            if (!normalizedEmail) {
                normalizedEmail = `${regNo.toLowerCase()}@nec.edu.in`;
            }
        }

        if (!normalizedEmail) {
            return res.status(400).json({ error: 'Email or registration number is required.' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password || '123456', 10);
        const normalizedGroups = parseGroupMembershipsInput(groupMemberships);

        let assignedTeacher = null;
        if (normalizedRole === 'STUDENT' && (teacherId || teacherEmail)) {
            assignedTeacher = await resolveAssignedTeacher(prisma, {
                organizationId: orgId,
                teacherId,
                teacherEmail,
            });

            if (!assignedTeacher) {
                return res.status(400).json({ error: 'Assigned teacher was not found in this organization.' });
            }
        }

        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                password: hashedPassword,
                firstName,
                lastName,
                role: normalizedRole,
                organizationId: orgId,
                department: department?.trim() || null,
                teacherId: assignedTeacher?.id,
                registrationNumber: regNo,
                academicYear: acYear,
                section: sec,
                studentEmail: optEmail,
                forcePasswordReset: normalizedRole === 'STUDENT' ? true : false
            },
            include: userProfileInclude,
        });

        // Log audit
        await logAudit(user.id, 'USER_CREATED', 'User', user.id, { role: normalizedRole }, req);

        res.status(201).json({
            message: 'User registered successfully',
            userId: user.id,
            user: buildUserProfile(user),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login User
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
            include: userProfileInclude,
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, organizationId: user.organizationId },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );

        // Log audit
        await logAudit(user.id, 'USER_LOGIN', 'User', user.id, null, req);

        res.json({
            token,
            user: buildUserProfile(user),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: userProfileInclude,
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({ user: buildUserProfile(user) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Reset Password
router.post('/reset-password', authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters.' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        // Hash and update new password, clearing forcePasswordReset flag
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { 
                password: hashedPassword,
                forcePasswordReset: false
            },
            include: userProfileInclude,
        });

        // Log audit
        await logAudit(user.id, 'PASSWORD_RESET', 'User', user.id, null, req);

        res.json({
            message: 'Password reset successfully',
            user: buildUserProfile(updatedUser),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Password reset failed' });
    }
});

module.exports = router;
