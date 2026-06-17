const prisma = require('../config/prisma');

/**
 * Role Hierarchy for permission inheritance
 * - SUPER_ADMIN: Complete platform access
 * - ORG_ADMIN: Organization-level access
 * - DEPT_ADMIN: Department-level access
 * - TEACHER: Group and task management
 * - STUDENT: Task submission and viewing
 */
const roleHierarchy = {
  SUPER_ADMIN: ['SUPER_ADMIN', 'ORG_ADMIN', 'DEPT_ADMIN', 'TEACHER', 'STUDENT'],
  ORG_ADMIN: ['ORG_ADMIN', 'DEPT_ADMIN', 'TEACHER', 'STUDENT'],
  DEPT_ADMIN: ['DEPT_ADMIN', 'TEACHER', 'STUDENT'],
  TEACHER: ['TEACHER', 'STUDENT'],
  STUDENT: ['STUDENT'],
};

/**
 * Get all effective roles for a user (including inherited roles)
 */
async function getUserRoles(userId) {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
  });

  const roles = userRoles.map(ur => ur.role);
  const effectiveRoles = new Set(roles);

  // Add inherited roles
  roles.forEach(role => {
    if (roleHierarchy[role]) {
      roleHierarchy[role].forEach(inheritedRole => {
        effectiveRoles.add(inheritedRole);
      });
    }
  });

  return Array.from(effectiveRoles);
}

/**
 * Check if user has a specific role
 */
async function hasRole(userId, requiredRole) {
  const effectiveRoles = await getUserRoles(userId);
  return effectiveRoles.includes(requiredRole);
}

/**
 * Check if user has any of the required roles
 */
async function hasAnyRole(userId, requiredRoles) {
  const effectiveRoles = await getUserRoles(userId);
  return requiredRoles.some(role => effectiveRoles.includes(role));
}

/**
 * Get departments where user has admin or management access
 */
async function getUserDepartments(userId) {
  const deptMembers = await prisma.departmentMember.findMany({
    where: { userId },
    include: { department: true },
  });
  return deptMembers.map(dm => dm.department);
}

/**
 * Check if user is admin of a department
 */
async function isDepartmentAdmin(userId, departmentId) {
  const deptMember = await prisma.departmentMember.findUnique({
    where: {
      userId_departmentId: {
        userId,
        departmentId,
      },
    },
    include: { userRole: true },
  });

  if (!deptMember) return false;

  const userRole = await prisma.userRole.findUnique({
    where: {
      userId_role: {
        userId,
        role: 'DEPT_ADMIN',
      },
    },
  });

  return !!userRole;
}

/**
 * Get groups where user is owner or collaborator
 */
async function getUserGroups(userId) {
  const groupMemberships = await prisma.groupMembership.findMany({
    where: { userId },
    include: { group: true },
  });
  return groupMemberships.map(gm => ({
    group: gm.group,
    role: gm.role,
  }));
}

/**
 * Check if user can access a group
 */
async function canAccessGroup(userId, groupId) {
  const membership = await prisma.groupMembership.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });
  return !!membership;
}

/**
 * Check if user can manage a group (owner or collaborator)
 */
async function canManageGroup(userId, groupId) {
  const membership = await prisma.groupMembership.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  return membership && ['OWNER', 'COLLABORATOR'].includes(membership.role);
}

/**
 * Check if user can view task based on visibility scope
 */
async function canViewTask(userId, task) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true, departmentMemberships: true },
  });

  // Creator always has access
  if (task.createdById === userId) return true;

  // Check if Super Admin
  if (user.roles.some(r => r.role === 'SUPER_ADMIN')) return true;

  switch (task.visibilityScope) {
    case 'GLOBAL':
      return user.roles.some(r => r.role === 'SUPER_ADMIN');

    case 'ORGANIZATION':
      return user.organizationId === task.organizationId;

    case 'DEPARTMENT': {
      const deptAssignments = await prisma.taskDepartmentAssignment.findMany({
        where: { taskId: task.id },
      });
      const deptIds = deptAssignments.map(da => da.departmentId);
      const userDepts = user.departmentMemberships.map(dm => dm.departmentId);
      return userDepts.some(deptId => deptIds.includes(deptId));
    }

    case 'GROUP': {
      const groupAssignments = await prisma.taskGroupAssignment.findMany({
        where: { taskId: task.id },
      });
      const groupIds = groupAssignments.map(ga => ga.groupId);
      // Check if user is member or collaborator in any of these groups
      for (const groupId of groupIds) {
        if (await canAccessGroup(userId, groupId)) {
          return true;
        }
      }
      return false;
    }

    default:
      return false;
  }
}

/**
 * Check if user can create task for a visibility scope
 */
async function canCreateTaskWithScope(userId, visibilityScope) {
  const roles = await getUserRoles(userId);

  switch (visibilityScope) {
    case 'GLOBAL':
      return roles.includes('SUPER_ADMIN');

    case 'ORGANIZATION':
      return roles.includes('SUPER_ADMIN') || roles.includes('ORG_ADMIN');

    case 'DEPARTMENT':
      return (
        roles.includes('SUPER_ADMIN') ||
        roles.includes('ORG_ADMIN') ||
        roles.includes('DEPT_ADMIN') ||
        roles.includes('TEACHER')
      );

    case 'GROUP':
      return roles.includes('TEACHER') || roles.includes('ORG_ADMIN') || roles.includes('SUPER_ADMIN');

    default:
      return false;
  }
}

/**
 * Middleware: Check if user has required role(s)
 */
const requireRole = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      const hasRequiredRole = await hasAnyRole(userId, rolesArray);

      if (!hasRequiredRole) {
        return res.status(403).json({
          error: 'Forbidden: Insufficient permissions',
          required: rolesArray,
        });
      }

      // Attach user roles to request for further use
      req.userRoles = await getUserRoles(userId);
      req.userDepartments = await getUserDepartments(userId);

      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

/**
 * Middleware: Check if user can manage a specific department
 */
const canManageDepartment = (req, res, next) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId;
      const departmentId = req.params.departmentId || req.body.departmentId;

      const roles = await getUserRoles(userId);
      if (roles.includes('SUPER_ADMIN') || roles.includes('ORG_ADMIN')) {
        return next();
      }

      const canManage = await isDepartmentAdmin(userId, departmentId);
      if (!canManage) {
        return res.status(403).json({ error: 'Cannot manage this department' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

/**
 * Middleware: Check if user can access a group
 */
const canAccessGroupMiddleware = (req, res, next) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId;
      const groupId = req.params.groupId || req.body.groupId;

      const roles = await getUserRoles(userId);
      if (roles.includes('SUPER_ADMIN') || roles.includes('ORG_ADMIN')) {
        return next();
      }

      const canAccess = await canAccessGroup(userId, groupId);
      if (!canAccess) {
        return res.status(403).json({ error: 'Cannot access this group' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

/**
 * Log audit entry
 */
async function logAudit(userId, action, entityType, entityId, changes = null, ipAddress = null) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        changes,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}

module.exports = {
  getUserRoles,
  hasRole,
  hasAnyRole,
  getUserDepartments,
  isDepartmentAdmin,
  getUserGroups,
  canAccessGroup,
  canManageGroup,
  canViewTask,
  canCreateTaskWithScope,
  requireRole,
  canManageDepartment,
  canAccessGroupMiddleware,
  logAudit,
  roleHierarchy,
};
