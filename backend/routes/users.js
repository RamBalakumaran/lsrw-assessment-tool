const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const prisma = new PrismaClient();
const { requireRole, getUserRoles, isDepartmentAdmin, logAudit } = require('../middleware/rbac');

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * Assign role to a user
 * POST /api/users/:userId/roles
 */
router.post('/:userId/roles', requireRole(['SUPER_ADMIN', 'ORG_ADMIN']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, departmentIds } = req.body;

    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'DEPT_ADMIN', 'TEACHER', 'STUDENT'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check permission to assign role
    const requestingUserRoles = await getUserRoles(req.userId);
    if (role === 'SUPER_ADMIN' && !requestingUserRoles.includes('SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Only Super Admin can assign Super Admin role' });
    }

    // Create or update user role
    const userRole = await prisma.userRole.upsert({
      where: {
        userId_role: {
          userId,
          role,
        },
      },
      update: {
        assignedAt: new Date(),
      },
      create: {
        userId,
        role,
        assignedBy: req.userId,
        assignedAt: new Date(),
      },
    });

    // Create department memberships if provided (for DEPT_ADMIN)
    if (role === 'DEPT_ADMIN' && departmentIds && Array.isArray(departmentIds)) {
      for (const deptId of departmentIds) {
        await prisma.departmentMember.upsert({
          where: {
            userId_departmentId: {
              userId,
              departmentId: deptId,
            },
          },
          update: {},
          create: {
            userId,
            departmentId: deptId,
            userRoleId: userRole.id,
          },
        });
      }
    }

    // Log audit
    await logAudit(req.userId, 'ROLE_ASSIGNED', 'User', userId, { role, departmentIds }, req.ip);

    res.json({
      message: 'Role assigned successfully',
      userRole,
    });
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Revoke role from user
 * DELETE /api/users/:userId/roles/:role
 */
router.delete('/:userId/roles/:role', requireRole(['SUPER_ADMIN', 'ORG_ADMIN']), async (req, res) => {
  try {
    const { userId, role } = req.params;

    // Cannot revoke STUDENT role (everyone is at least a student)
    if (role === 'STUDENT') {
      return res.status(400).json({ error: 'Cannot revoke STUDENT role' });
    }

    const deletedRole = await prisma.userRole.delete({
      where: {
        userId_role: {
          userId,
          role,
        },
      },
    });

    // Log audit
    await logAudit(req.userId, 'ROLE_REVOKED', 'User', userId, { role }, req.ip);

    res.json({
      message: 'Role revoked successfully',
      deletedRole,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Bulk import students
 * POST /api/users/bulk-import
 */
router.post('/bulk-import', requireRole(['DEPT_ADMIN', 'ORG_ADMIN']), upload.single('file'), async (req, res) => {
  const { departmentId } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!departmentId) {
    return res.status(400).json({ error: 'Department ID is required' });
  }

  try {
    // Check permission
    const isAdmin = await isDepartmentAdmin(req.userId, departmentId);
    const roles = await getUserRoles(req.userId);
    if (!isAdmin && !roles.includes('ORG_ADMIN') && !roles.includes('SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Cannot import to this department' });
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Parse file
    const filePath = req.file.path;
    let students = [];

    if (req.file.mimetype === 'text/csv') {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const student = {};
        headers.forEach((header, idx) => {
          student[header] = values[idx];
        });
        students.push(student);
      }
    } else {
      // Excel file
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      students = xlsx.utils.sheet_to_json(sheet);
    }

    // Validate and create accounts
    const results = {
      successful: [],
      failed: [],
    };

    const hashedPassword = await bcrypt.hash('123456', 10);
    const org = await prisma.organization.findUnique({ where: { id: department.organizationId } });

    for (const student of students) {
      try {
        const { registrationNumber, name, email, academicYear, section } = student;

        if (!registrationNumber || !email) {
          results.failed.push({
            registrationNumber,
            email,
            error: 'Missing registration number or email',
          });
          continue;
        }

        // Check for duplicate registration number
        const existing = await prisma.user.findFirst({
          where: {
            registrationNumber,
            organizationId: org.id,
          },
        });

        if (existing) {
          results.failed.push({
            registrationNumber,
            email,
            error: 'Registration number already exists',
          });
          continue;
        }

        // Create user
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName: name || 'Student',
            lastName: registrationNumber,
            registrationNumber,
            organizationId: org.id,
            status: 'ACTIVE',
            forcePasswordReset: true,
          },
        });

        // Assign STUDENT role
        await prisma.userRole.create({
          data: {
            userId: user.id,
            role: 'STUDENT',
            assignedBy: req.userId,
          },
        });

        // Add to department
        await prisma.departmentMember.create({
          data: {
            userId: user.id,
            departmentId,
          },
        });

        results.successful.push({
          registrationNumber,
          email,
          userId: user.id,
          username: `${registrationNumber}@nec.edu.in`,
          defaultPassword: '123456',
        });
      } catch (error) {
        results.failed.push({
          registrationNumber: student.registrationNumber,
          email: student.email,
          error: error.message,
        });
      }
    }

    // Clean up file
    fs.unlinkSync(filePath);

    // Log audit
    await logAudit(req.userId, 'STUDENT_BULK_IMPORT', 'Department', departmentId, {
      successful: results.successful.length,
      failed: results.failed.length,
    }, req.ip);

    res.json({
      message: 'Bulk import completed',
      results,
    });
  } catch (error) {
    console.error('Error in bulk import:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user's roles
 * GET /api/users/:userId/roles
 */
router.get('/:userId/roles', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check permission
    if (req.userId !== userId) {
      const roles = await getUserRoles(req.userId);
      if (!roles.includes('ORG_ADMIN') && !roles.includes('SUPER_ADMIN')) {
        return res.status(403).json({ error: 'Cannot view other user roles' });
      }
    }

    const userRoles = await prisma.userRole.findMany({
      where: { userId },
    });

    res.json(userRoles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
