const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { authMiddleware, authorize } = require('../middleware/auth');
const {
    buildUserProfile,
    parseGroupMembershipsInput,
    resolveAssignedTeacher,
    userProfileInclude,
    formatProfileName,
} = require('../utils/userProfile');

const ADMIN_ACCESS_ROLES = ['SUPER_ADMIN', 'ADMIN', 'DEPT_ADMIN'];
const ORGANIZATION_CONTROL_ROLES = ['SUPER_ADMIN', 'ADMIN'];
const VALID_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'DEPT_ADMIN', 'TEACHER', 'STUDENT']);
const VALID_USER_STATUSES = new Set(['ACTIVE', 'INACTIVE', 'INVITED']);
const VALID_DEPARTMENT_STATUSES = new Set(['ACTIVE', 'INACTIVE']);
const VALID_ORGANIZATION_STATUSES = new Set(['ACTIVE', 'INACTIVE']);
const STAFF_ASSIGNABLE_ROLES = new Set(['ADMIN', 'DEPT_ADMIN', 'TEACHER']);
const DEPARTMENT_ADMIN_ELIGIBLE_ROLES = new Set(['ADMIN', 'DEPT_ADMIN', 'TEACHER']);

const departmentAdminSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    status: true,
    department: true,
    organizationId: true,
};

const departmentInclude = {
    admin: {
        select: departmentAdminSelect,
    },
};

const isSuperAdmin = (user) => user?.role === 'SUPER_ADMIN';
const isOrganizationAdmin = (user) => user?.role === 'ADMIN';
const isDepartmentAdmin = (user) => user?.role === 'DEPT_ADMIN';

const normalizeStringList = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return [...new Set(
        value
            .map((item) => typeof item === 'string' ? item.trim() : '')
            .filter(Boolean)
    )];
};

const normalizeRole = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim().toUpperCase();
    return VALID_ROLES.has(normalized) ? normalized : null;
};

const normalizeUserStatus = (value) => {
    if (typeof value !== 'string') {
        return 'ACTIVE';
    }

    const normalized = value.trim().toUpperCase();
    return VALID_USER_STATUSES.has(normalized) ? normalized : 'ACTIVE';
};

const normalizeDepartmentStatus = (value) => {
    if (typeof value !== 'string') {
        return 'ACTIVE';
    }

    const normalized = value.trim().toUpperCase();
    return VALID_DEPARTMENT_STATUSES.has(normalized) ? normalized : 'ACTIVE';
};

const normalizeOrganizationStatus = (value) => {
    if (typeof value !== 'string') {
        return 'ACTIVE';
    }

    const normalized = value.trim().toUpperCase();
    return VALID_ORGANIZATION_STATUSES.has(normalized) ? normalized : 'ACTIVE';
};

const normalizeSubdomain = (value) => {
    if (typeof value !== 'string') {
        return '';
    }

    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

const getManagedDepartmentIds = (user) => Array.isArray(user?.departmentAdminDepartments)
    ? user.departmentAdminDepartments.map((department) => department.id)
    : [];

const getManagedDepartmentNames = (user) => Array.isArray(user?.departmentAdminDepartments)
    ? user.departmentAdminDepartments.map((department) => department.name)
    : [];

const getDepartmentStaffIds = (department) => normalizeStringList(department?.staffMemberIds);

const getAssignableRoles = (user) => {
    if (isSuperAdmin(user)) {
        return ['SUPER_ADMIN', 'ADMIN', 'DEPT_ADMIN', 'TEACHER', 'STUDENT'];
    }

    if (isOrganizationAdmin(user)) {
        return ['ADMIN', 'DEPT_ADMIN', 'TEACHER', 'STUDENT'];
    }

    return ['TEACHER', 'STUDENT'];
};

const assertAssignableRole = (user, role) => {
    const allowedRoles = getAssignableRoles(user);
    if (!allowedRoles.includes(role)) {
        throw new Error('You do not have permission to assign that role.');
    }
};

const buildUserScopeWhere = (user) => {
    if (isSuperAdmin(user)) {
        return {};
    }

    const baseWhere = {
        organizationId: user.organizationId,
    };

    if (!isDepartmentAdmin(user)) {
        return baseWhere;
    }

    const managedDepartmentNames = getManagedDepartmentNames(user);
    if (managedDepartmentNames.length === 0) {
        return {
            ...baseWhere,
            id: user.id,
        };
    }

    return {
        ...baseWhere,
        OR: [
            { id: user.id },
            { department: { in: managedDepartmentNames } },
        ],
    };
};

const buildDepartmentScopeWhere = (user) => {
    if (isSuperAdmin(user)) {
        return {};
    }

    const baseWhere = {
        organizationId: user.organizationId,
    };

    if (!isDepartmentAdmin(user)) {
        return baseWhere;
    }

    const managedDepartmentIds = getManagedDepartmentIds(user);
    return {
        ...baseWhere,
        id: {
            in: managedDepartmentIds.length ? managedDepartmentIds : ['__none__'],
        },
    };
};

const assertOrganizationAccess = async (db, user, organizationId) => {
    if (!organizationId) {
        throw new Error('Organization is required.');
    }

    const organization = await db.organization.findUnique({
        where: { id: organizationId },
        select: {
            id: true,
            name: true,
            subdomain: true,
            status: true,
        },
    });

    if (!organization) {
        throw new Error('Selected organization was not found.');
    }

    if (isSuperAdmin(user)) {
        return organization;
    }

    if (user.organizationId !== organization.id) {
        throw new Error('You do not have access to that organization.');
    }

    return organization;
};

const resolveScopedOrganization = async (db, user, requestedOrganizationId) => {
    const targetOrganizationId = isSuperAdmin(user)
        ? (requestedOrganizationId || user.organizationId)
        : user.organizationId;

    return assertOrganizationAccess(db, user, targetOrganizationId);
};

const organizationNameMap = (organizations) => new Map(
    organizations.map((organization) => [organization.id, organization])
);

const buildOrganizationPayload = (organization) => {
    const users = Array.isArray(organization.users) ? organization.users : [];
    const departments = Array.isArray(organization.departments) ? organization.departments : [];
    const organizationAdmins = users
        .filter((user) => user.role === 'ADMIN')
        .map((user) => ({
            id: user.id,
            profileName: formatProfileName(user),
            email: user.email,
            status: user.status,
        }));

    return {
        id: organization.id,
        name: organization.name,
        subdomain: organization.subdomain,
        status: organization.status,
        students: users.filter((user) => user.role === 'STUDENT').length,
        teachers: users.filter((user) => user.role === 'TEACHER').length,
        deptAdmins: users.filter((user) => user.role === 'DEPT_ADMIN').length,
        admins: users.filter((user) => user.role === 'ADMIN').length,
        superAdmins: users.filter((user) => user.role === 'SUPER_ADMIN').length,
        totalUsers: users.length,
        departmentCount: departments.length,
        organizationAdmins,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
    };
};

const buildDepartmentPayload = (department, usersById, organizationsById) => {
    const staffMembers = getDepartmentStaffIds(department)
        .map((userId) => usersById.get(userId))
        .filter(Boolean)
        .map((user) => ({
            id: user.id,
            profileName: formatProfileName(user),
            email: user.email,
            role: user.role,
            status: user.status,
            department: user.department || null,
        }));
    const studentMembers = [...usersById.values()]
        .filter((user) => (
            user.organizationId === department.organizationId
            && user.role === 'STUDENT'
            && user.department === department.name
        ))
        .map((user) => ({
            id: user.id,
            profileName: formatProfileName(user),
            email: user.email,
            role: user.role,
            status: user.status,
            department: user.department || null,
            teacherId: user.teacherId || null,
        }));

    const organization = organizationsById.get(department.organizationId);

    return {
        id: department.id,
        name: department.name,
        status: department.status,
        organizationId: department.organizationId,
        universityName: organization?.name || null,
        universityStatus: organization?.status || null,
        admin: department.admin
            ? {
                id: department.admin.id,
                profileName: formatProfileName(department.admin),
                email: department.admin.email,
                role: department.admin.role,
                status: department.admin.status,
                department: department.admin.department || null,
            }
            : null,
        staffMembers,
        staffCount: staffMembers.length,
        studentMembers,
        studentCount: studentMembers.length,
        memberCount: staffMembers.length + studentMembers.length,
        createdAt: department.createdAt,
        updatedAt: department.updatedAt,
    };
};

const enrichUsersWithDepartmentData = (users, departments) => {
    const departmentsByScopedName = new Map(
        departments.map((department) => [`${department.organizationId}:${department.name}`, department])
    );
    const staffDepartmentsByUserId = new Map();
    const managedDepartmentsByUserId = new Map();

    departments.forEach((department) => {
        getDepartmentStaffIds(department).forEach((userId) => {
            if (!staffDepartmentsByUserId.has(userId)) {
                staffDepartmentsByUserId.set(userId, []);
            }
            staffDepartmentsByUserId.get(userId).push({
                id: department.id,
                name: department.name,
                status: department.status,
                organizationId: department.organizationId,
            });
        });

        if (department.adminId) {
            if (!managedDepartmentsByUserId.has(department.adminId)) {
                managedDepartmentsByUserId.set(department.adminId, []);
            }
            managedDepartmentsByUserId.get(department.adminId).push({
                id: department.id,
                name: department.name,
                status: department.status,
                organizationId: department.organizationId,
            });
        }
    });

    return users.map((user) => {
        const profile = buildUserProfile(user);
        const managedDepartments = managedDepartmentsByUserId.get(user.id) || profile.managedDepartments || [];
        const staffDepartments = staffDepartmentsByUserId.get(user.id) || [];
        const primaryDepartmentName = profile.department || managedDepartments[0]?.name || staffDepartments[0]?.name || null;
        const primaryDepartment = primaryDepartmentName
            ? departmentsByScopedName.get(`${user.organizationId}:${primaryDepartmentName}`) || null
            : null;

        return {
            ...profile,
            name: profile.profileName,
            department: primaryDepartmentName,
            departmentInfo: primaryDepartment
                ? {
                    id: primaryDepartment.id,
                    name: primaryDepartment.name,
                    status: primaryDepartment.status,
                    organizationId: primaryDepartment.organizationId,
                }
                : primaryDepartmentName
                    ? {
                        id: null,
                        name: primaryDepartmentName,
                        status: 'ACTIVE',
                        organizationId: user.organizationId,
                    }
                    : null,
            departmentId: primaryDepartment?.id || null,
            departmentStatus: primaryDepartment?.status || null,
            staffDepartments,
            managedDepartments,
            managedDepartmentIds: managedDepartments.map((department) => department.id),
            assignedDepartmentIds: staffDepartments.map((department) => department.id),
        };
    });
};

const loadAccessControlData = async (db, actor) => {
    const [users, departments] = await Promise.all([
        db.user.findMany({
            where: buildUserScopeWhere(actor),
            include: userProfileInclude,
            orderBy: [
                { role: 'asc' },
                { firstName: 'asc' },
                { email: 'asc' },
            ],
        }),
        db.department.findMany({
            where: buildDepartmentScopeWhere(actor),
            include: departmentInclude,
            orderBy: [
                { name: 'asc' },
            ],
        }),
    ]);

    const organizationIds = [...new Set([
        ...users.map((user) => user.organizationId),
        ...departments.map((department) => department.organizationId),
    ])];

    const organizations = organizationIds.length
        ? await db.organization.findMany({
            where: { id: { in: organizationIds } },
            select: {
                id: true,
                name: true,
                status: true,
                subdomain: true,
            },
        })
        : [];

    const organizationsById = organizationNameMap(organizations);
    const usersById = new Map(users.map((user) => [user.id, user]));

    return {
        users: enrichUsersWithDepartmentData(users, departments),
        departments: departments.map((department) => buildDepartmentPayload(department, usersById, organizationsById)),
    };
};

const assertDepartmentAccess = (actor, department) => {
    if (!department) {
        throw new Error('Department not found.');
    }

    if (isSuperAdmin(actor) || isOrganizationAdmin(actor)) {
        return;
    }

    if (department.organizationId !== actor.organizationId || !getManagedDepartmentIds(actor).includes(department.id)) {
        throw new Error('You do not have access to that department.');
    }
};

const assertUserAccess = (actor, targetUser) => {
    if (!targetUser) {
        throw new Error('User not found.');
    }

    if (isSuperAdmin(actor)) {
        return;
    }

    if (targetUser.organizationId !== actor.organizationId) {
        throw new Error('You do not have access to that user.');
    }

    if (!isDepartmentAdmin(actor)) {
        return;
    }

    const managedDepartmentNames = getManagedDepartmentNames(actor);
    const inManagedDepartment = targetUser.department && managedDepartmentNames.includes(targetUser.department);

    if (targetUser.id !== actor.id && !inManagedDepartment) {
        throw new Error('Department admins can only manage users in their departments.');
    }
};

const resolveDepartmentAdmin = async (db, actor, organizationId, adminId) => {
    if (!adminId) {
        return null;
    }

    const adminUser = await db.user.findFirst({
        where: {
            id: adminId,
            organizationId,
        },
        select: departmentAdminSelect,
    });

    if (!adminUser) {
        throw new Error('Selected department admin was not found in this organization.');
    }

    if (!DEPARTMENT_ADMIN_ELIGIBLE_ROLES.has(adminUser.role)) {
        throw new Error('Department admin must be an admin, department admin, or teacher.');
    }

    assertUserAccess(actor, adminUser);
    return adminUser;
};

const resolveStaffMembers = async (db, actor, organizationId, memberIds) => {
    const normalizedIds = normalizeStringList(memberIds);
    if (normalizedIds.length === 0) {
        return [];
    }

    const users = await db.user.findMany({
        where: {
            organizationId,
            id: { in: normalizedIds },
        },
        select: departmentAdminSelect,
    });

    if (users.length !== normalizedIds.length) {
        throw new Error('One or more selected staff members were not found in this organization.');
    }

    const invalidMember = users.find((user) => !STAFF_ASSIGNABLE_ROLES.has(user.role));
    if (invalidMember) {
        throw new Error('Only admins, department admins, and teachers can be assigned as department staff.');
    }

    users.forEach((user) => assertUserAccess(actor, user));
    return users;
};

const resolveStudentMembers = async (db, actor, organizationId, memberIds) => {
    const normalizedIds = normalizeStringList(memberIds);
    if (normalizedIds.length === 0) {
        return [];
    }

    const users = await db.user.findMany({
        where: {
            organizationId,
            id: { in: normalizedIds },
        },
        select: departmentAdminSelect,
    });

    if (users.length !== normalizedIds.length) {
        throw new Error('One or more selected students were not found in this organization.');
    }

    const invalidMember = users.find((user) => user.role !== 'STUDENT');
    if (invalidMember) {
        throw new Error('Only students can be assigned as department students.');
    }

    users.forEach((user) => assertUserAccess(actor, user));
    return users;
};

const syncDepartmentStaffAssignments = async (db, organizationId, departmentId, departmentName, memberIds) => {
    const normalizedMemberIds = normalizeStringList(memberIds);
    const departments = await db.department.findMany({
        where: { organizationId },
        select: {
            id: true,
            name: true,
            staffMemberIds: true,
        },
    });

    const currentDepartment = departments.find((department) => department.id === departmentId) || null;
    const previousMemberIds = currentDepartment ? getDepartmentStaffIds(currentDepartment) : [];
    const removedMemberIds = previousMemberIds.filter((userId) => !normalizedMemberIds.includes(userId));

    for (const department of departments) {
        const currentIds = getDepartmentStaffIds(department);
        const nextIds = department.id === departmentId
            ? normalizedMemberIds
            : currentIds.filter((userId) => !normalizedMemberIds.includes(userId));

        if (currentIds.join('|') !== nextIds.join('|')) {
            await db.department.update({
                where: { id: department.id },
                data: {
                    staffMemberIds: nextIds.length ? nextIds : null,
                },
            });
        }
    }

    if (removedMemberIds.length && currentDepartment?.name) {
        await db.user.updateMany({
            where: {
                organizationId,
                id: { in: removedMemberIds },
                department: currentDepartment.name,
            },
            data: {
                department: null,
            },
        });
    }

    if (normalizedMemberIds.length) {
        await db.user.updateMany({
            where: {
                organizationId,
                id: { in: normalizedMemberIds },
            },
            data: {
                department: departmentName,
            },
        });
    }
};

const syncDepartmentStudentAssignments = async (db, organizationId, previousDepartmentName, nextDepartmentName, memberIds) => {
    const normalizedMemberIds = normalizeStringList(memberIds);
    const previousStudentIds = previousDepartmentName
        ? (await db.user.findMany({
            where: {
                organizationId,
                role: 'STUDENT',
                department: previousDepartmentName,
            },
            select: {
                id: true,
            },
        })).map((user) => user.id)
        : [];
    const removedMemberIds = previousStudentIds.filter((userId) => !normalizedMemberIds.includes(userId));

    if (removedMemberIds.length) {
        await db.user.updateMany({
            where: {
                organizationId,
                role: 'STUDENT',
                id: { in: removedMemberIds },
                department: previousDepartmentName,
            },
            data: {
                department: null,
            },
        });
    }

    if (normalizedMemberIds.length && nextDepartmentName) {
        await db.user.updateMany({
            where: {
                organizationId,
                role: 'STUDENT',
                id: { in: normalizedMemberIds },
            },
            data: {
                department: nextDepartmentName,
            },
        });
    }
};

const syncUserDepartmentLinks = async (db, organizationId, user, role, departmentId, managedDepartmentId) => {
    const departments = await db.department.findMany({
        where: { organizationId },
        select: {
            id: true,
            name: true,
            staffMemberIds: true,
            adminId: true,
        },
    });

    const nextDepartment = departmentId
        ? departments.find((department) => department.id === departmentId) || null
        : null;
    const nextManagedDepartment = managedDepartmentId
        ? departments.find((department) => department.id === managedDepartmentId) || null
        : null;

    if (departmentId && !nextDepartment) {
        throw new Error('Selected department was not found.');
    }

    if (managedDepartmentId && !nextManagedDepartment) {
        throw new Error('Selected managed department was not found.');
    }

    const isStaffAssignable = STAFF_ASSIGNABLE_ROLES.has(role);

    for (const department of departments) {
        const currentIds = getDepartmentStaffIds(department);
        const hasUser = currentIds.includes(user.id);
        const shouldIncludeUser = Boolean(isStaffAssignable && nextDepartment && department.id === nextDepartment.id);
        const nextIds = shouldIncludeUser
            ? [...new Set([...currentIds.filter((userId) => userId !== user.id), user.id])]
            : currentIds.filter((userId) => userId !== user.id);

        if (hasUser !== shouldIncludeUser || currentIds.join('|') !== nextIds.join('|')) {
            await db.department.update({
                where: { id: department.id },
                data: {
                    staffMemberIds: nextIds.length ? nextIds : null,
                },
            });
        }

        const shouldManage = Boolean(managedDepartmentId) && department.id === managedDepartmentId;
        if (shouldManage && department.adminId !== user.id) {
            await db.department.update({
                where: { id: department.id },
                data: { adminId: user.id },
            });
        } else if (!shouldManage && department.adminId === user.id) {
            await db.department.update({
                where: { id: department.id },
                data: { adminId: null },
            });
        }
    }

    const departmentName = nextDepartment?.name
        || nextManagedDepartment?.name
        || null;

    await db.user.update({
        where: { id: user.id },
        data: {
            department: departmentName,
        },
    });
};

const removeUserFromDepartmentLinks = async (db, organizationId, targetUser) => {
    const departments = await db.department.findMany({
        where: { organizationId },
        select: {
            id: true,
            adminId: true,
            staffMemberIds: true,
        },
    });

    for (const department of departments) {
        const currentIds = getDepartmentStaffIds(department);
        const nextIds = currentIds.filter((userId) => userId !== targetUser.id);
        const needsAdminClear = department.adminId === targetUser.id;

        if (currentIds.join('|') !== nextIds.join('|') || needsAdminClear) {
            await db.department.update({
                where: { id: department.id },
                data: {
                    adminId: needsAdminClear ? null : department.adminId,
                    staffMemberIds: nextIds.length ? nextIds : null,
                },
            });
        }
    }
};

router.get('/organizations', authMiddleware, authorize(ORGANIZATION_CONTROL_ROLES), async (req, res) => {
    try {
        const where = isSuperAdmin(req.user)
            ? {}
            : { id: req.user.organizationId };

        const organizations = await prisma.organization.findMany({
            where,
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        status: true,
                    },
                },
                departments: {
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: [
                { name: 'asc' },
            ],
        });

        res.json(organizations.map(buildOrganizationPayload));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch organizations' });
    }
});

router.post('/organizations', authMiddleware, authorize(['SUPER_ADMIN']), async (req, res) => {
    const { name, subdomain, status } = req.body;

    try {
        const normalizedName = typeof name === 'string' ? name.trim() : '';
        const normalizedSubdomain = normalizeSubdomain(subdomain);

        if (!normalizedName) {
            return res.status(400).json({ error: 'Organization name is required.' });
        }

        if (!normalizedSubdomain) {
            return res.status(400).json({ error: 'A valid subdomain is required.' });
        }

        const existingOrganization = await prisma.organization.findFirst({
            where: {
                OR: [
                    { name: normalizedName },
                    { subdomain: normalizedSubdomain },
                ],
            },
        });

        if (existingOrganization) {
            return res.status(400).json({ error: 'An organization with this name or subdomain already exists.' });
        }

        const organization = await prisma.organization.create({
            data: {
                name: normalizedName,
                subdomain: normalizedSubdomain,
                status: normalizeOrganizationStatus(status),
            },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        status: true,
                    },
                },
                departments: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        res.status(201).json(buildOrganizationPayload(organization));
    } catch (error) {
        console.error('Organization create error:', error);
        res.status(500).json({ error: error.message || 'Failed to create organization' });
    }
});

router.patch('/organizations/:id', authMiddleware, authorize(['SUPER_ADMIN']), async (req, res) => {
    const { name, subdomain, status } = req.body;

    try {
        const currentOrganization = await prisma.organization.findUnique({
            where: { id: req.params.id },
        });

        if (!currentOrganization) {
            return res.status(404).json({ error: 'Organization not found.' });
        }

        const normalizedName = typeof name === 'string' ? name.trim() : currentOrganization.name;
        const normalizedSubdomain = typeof subdomain === 'string'
            ? normalizeSubdomain(subdomain)
            : currentOrganization.subdomain;

        const duplicateOrganization = await prisma.organization.findFirst({
            where: {
                NOT: { id: currentOrganization.id },
                OR: [
                    { name: normalizedName },
                    { subdomain: normalizedSubdomain },
                ],
            },
        });

        if (duplicateOrganization) {
            return res.status(400).json({ error: 'An organization with this name or subdomain already exists.' });
        }

        const organization = await prisma.organization.update({
            where: { id: currentOrganization.id },
            data: {
                name: normalizedName,
                subdomain: normalizedSubdomain,
                status: normalizeOrganizationStatus(status || currentOrganization.status),
            },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        status: true,
                    },
                },
                departments: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        res.json(buildOrganizationPayload(organization));
    } catch (error) {
        console.error('Organization update error:', error);
        res.status(500).json({ error: error.message || 'Failed to update organization' });
    }
});

router.get('/users', authMiddleware, authorize(ADMIN_ACCESS_ROLES), async (req, res) => {
    try {
        const data = await loadAccessControlData(prisma, req.user);
        res.json(data.users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.get('/departments', authMiddleware, authorize(ADMIN_ACCESS_ROLES), async (req, res) => {
    try {
        const data = await loadAccessControlData(prisma, req.user);
        res.json(data.departments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

router.post('/departments', authMiddleware, authorize(ORGANIZATION_CONTROL_ROLES), async (req, res) => {
    const { name, status, adminId, staffMemberIds, studentIds, organizationId } = req.body;

    try {
        const organization = await resolveScopedOrganization(prisma, req.user, organizationId);
        const normalizedName = typeof name === 'string' ? name.trim() : '';

        if (!normalizedName) {
            return res.status(400).json({ error: 'Department name is required.' });
        }

        const existingDepartment = await prisma.department.findFirst({
            where: {
                organizationId: organization.id,
                name: normalizedName,
            },
        });

        if (existingDepartment) {
            return res.status(400).json({ error: 'A department with this name already exists.' });
        }

        const departmentAdmin = await resolveDepartmentAdmin(prisma, req.user, organization.id, adminId);
        const staffUsers = await resolveStaffMembers(prisma, req.user, organization.id, staffMemberIds);
        const studentUsers = await resolveStudentMembers(prisma, req.user, organization.id, studentIds);
        const effectiveStaffIds = normalizeStringList([
            ...staffUsers.map((user) => user.id),
            ...(departmentAdmin ? [departmentAdmin.id] : []),
        ]);

        const createdDepartment = await prisma.$transaction(async (db) => {
            const department = await db.department.create({
                data: {
                    name: normalizedName,
                    status: normalizeDepartmentStatus(status),
                    organizationId: organization.id,
                    adminId: departmentAdmin?.id || null,
                    staffMemberIds: effectiveStaffIds.length ? effectiveStaffIds : null,
                },
                include: departmentInclude,
            });

            await syncDepartmentStaffAssignments(db, organization.id, department.id, department.name, effectiveStaffIds);
            await syncDepartmentStudentAssignments(db, organization.id, null, department.name, studentUsers.map((user) => user.id));
            return department;
        });

        const data = await loadAccessControlData(prisma, req.user);
        const created = data.departments.find((department) => department.id === createdDepartment.id);
        res.status(201).json(created);
    } catch (error) {
        console.error('Department create error:', error);
        res.status(500).json({ error: error.message || 'Failed to create department' });
    }
});

router.patch('/departments/:id', authMiddleware, authorize(ADMIN_ACCESS_ROLES), async (req, res) => {
    const { name, status, adminId, staffMemberIds, studentIds } = req.body;

    try {
        const currentDepartment = await prisma.department.findUnique({
            where: { id: req.params.id },
            include: departmentInclude,
        });

        assertDepartmentAccess(req.user, currentDepartment);
        const normalizedName = typeof name === 'string' ? name.trim() : currentDepartment.name;

        if (!normalizedName) {
            return res.status(400).json({ error: 'Department name is required.' });
        }

        const duplicateDepartment = await prisma.department.findFirst({
            where: {
                organizationId: currentDepartment.organizationId,
                name: normalizedName,
                NOT: {
                    id: currentDepartment.id,
                },
            },
        });

        if (duplicateDepartment) {
            return res.status(400).json({ error: 'A department with this name already exists.' });
        }

        const departmentAdmin = await resolveDepartmentAdmin(prisma, req.user, currentDepartment.organizationId, adminId);
        const staffUsers = await resolveStaffMembers(prisma, req.user, currentDepartment.organizationId, staffMemberIds);
        const studentUsers = await resolveStudentMembers(prisma, req.user, currentDepartment.organizationId, studentIds);
        const effectiveStaffIds = normalizeStringList([
            ...staffUsers.map((user) => user.id),
            ...(departmentAdmin ? [departmentAdmin.id] : []),
        ]);

        const updatedDepartment = await prisma.$transaction(async (db) => {
            const department = await db.department.update({
                where: { id: currentDepartment.id },
                data: {
                    name: normalizedName,
                    status: normalizeDepartmentStatus(status || currentDepartment.status),
                    adminId: departmentAdmin?.id || null,
                    staffMemberIds: effectiveStaffIds.length ? effectiveStaffIds : null,
                },
                include: departmentInclude,
            });

            await syncDepartmentStaffAssignments(db, currentDepartment.organizationId, department.id, department.name, effectiveStaffIds);
            await syncDepartmentStudentAssignments(
                db,
                currentDepartment.organizationId,
                currentDepartment.name,
                department.name,
                studentUsers.map((user) => user.id)
            );
            return department;
        });

        const data = await loadAccessControlData(prisma, req.user);
        const updated = data.departments.find((department) => department.id === updatedDepartment.id);
        res.json(updated);
    } catch (error) {
        console.error('Department update error:', error);
        res.status(500).json({ error: error.message || 'Failed to update department' });
    }
});

router.post('/users/invite', authMiddleware, authorize(ADMIN_ACCESS_ROLES), async (req, res) => {
    const {
        email,
        firstName,
        lastName,
        role,
        organizationId,
        department,
        departmentId,
        teacherId,
        groupMemberships,
        managedDepartmentId,
        password,
    } = req.body;

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        if (!password || password.trim() === '') {
            return res.status(400).json({ error: 'Default password is required' });
        }

        const normalizedRole = normalizeRole(role) || 'STUDENT';
        assertAssignableRole(req.user, normalizedRole);

        const organization = await resolveScopedOrganization(prisma, req.user, organizationId);
        const targetDepartment = departmentId
            ? await prisma.department.findUnique({ where: { id: departmentId }, include: departmentInclude })
            : null;
        const targetManagedDepartment = managedDepartmentId
            ? await prisma.department.findUnique({ where: { id: managedDepartmentId }, include: departmentInclude })
            : null;

        if (targetDepartment) {
            assertDepartmentAccess(req.user, targetDepartment);
            if (targetDepartment.organizationId !== organization.id) {
                return res.status(400).json({ error: 'Selected department does not belong to the chosen organization.' });
            }
        }

        if (targetManagedDepartment) {
            assertDepartmentAccess(req.user, targetManagedDepartment);
            if (targetManagedDepartment.organizationId !== organization.id) {
                return res.status(400).json({ error: 'Selected managed department does not belong to the chosen organization.' });
            }
        }

        let assignedTeacher = null;
        if (normalizedRole === 'STUDENT' && teacherId) {
            assignedTeacher = await resolveAssignedTeacher(prisma, {
                organizationId: organization.id,
                teacherId,
            });

            if (!assignedTeacher) {
                return res.status(400).json({ error: 'Assigned teacher was not found in this organization.' });
            }
        }

        const normalizedGroups = parseGroupMembershipsInput(groupMemberships);
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.$transaction(async (db) => {
            const createdUser = await db.user.create({
                data: {
                    email: normalizedEmail,
                    firstName,
                    lastName,
                    role: normalizedRole,
                    organizationId: organization.id,
                    status: 'INVITED',
                    password: hashedPassword,
                    department: targetDepartment?.name || targetManagedDepartment?.name || department?.trim() || null,
                    teacherId: normalizedRole === 'STUDENT' ? assignedTeacher?.id || null : null,
                    groupMemberships: normalizedGroups.length ? normalizedGroups : undefined,
                },
            });

            await syncUserDepartmentLinks(
                db,
                organization.id,
                createdUser,
                normalizedRole,
                targetDepartment?.id || null,
                targetManagedDepartment?.id || null
            );

            return db.user.findUnique({
                where: { id: createdUser.id },
                include: userProfileInclude,
            });
        });

        res.status(201).json(buildUserProfile(newUser));
    } catch (error) {
        console.error('Invite error:', error);
        res.status(500).json({ error: error.message || 'Failed to invite user' });
    }
});

router.patch('/users/:id/access', authMiddleware, authorize(ADMIN_ACCESS_ROLES), async (req, res) => {
    const {
        role,
        status,
        teacherId,
        departmentId,
        managedDepartmentId,
        groupMemberships,
    } = req.body;

    try {
        const targetUser = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: userProfileInclude,
        });

        assertUserAccess(req.user, targetUser);
        const normalizedRole = role ? normalizeRole(role) : targetUser.role;

        if (!normalizedRole) {
            return res.status(400).json({ error: 'Invalid role selected.' });
        }

        assertAssignableRole(req.user, normalizedRole);

        const normalizedStatus = status ? normalizeUserStatus(status) : targetUser.status;
        const targetDepartment = departmentId
            ? await prisma.department.findUnique({ where: { id: departmentId }, include: departmentInclude })
            : null;
        const targetManagedDepartment = managedDepartmentId
            ? await prisma.department.findUnique({ where: { id: managedDepartmentId }, include: departmentInclude })
            : null;

        if (targetDepartment) {
            assertDepartmentAccess(req.user, targetDepartment);
            if (targetDepartment.organizationId !== targetUser.organizationId) {
                return res.status(400).json({ error: 'Selected department does not belong to the user organization.' });
            }
        }

        if (targetManagedDepartment) {
            assertDepartmentAccess(req.user, targetManagedDepartment);
            if (targetManagedDepartment.organizationId !== targetUser.organizationId) {
                return res.status(400).json({ error: 'Selected managed department does not belong to the user organization.' });
            }
        }

        let assignedTeacher = null;
        if (normalizedRole === 'STUDENT' && teacherId) {
            assignedTeacher = await resolveAssignedTeacher(prisma, {
                organizationId: targetUser.organizationId,
                teacherId,
            });

            if (!assignedTeacher) {
                return res.status(400).json({ error: 'Assigned teacher was not found in this organization.' });
            }
        }

        const normalizedGroups = Array.isArray(groupMemberships)
            ? parseGroupMembershipsInput(groupMemberships)
            : targetUser.groupMemberships;

        const updatedUser = await prisma.$transaction(async (db) => {
            await db.user.update({
                where: { id: targetUser.id },
                data: {
                    role: normalizedRole,
                    status: normalizedStatus,
                    teacherId: normalizedRole === 'STUDENT' ? assignedTeacher?.id || null : null,
                    groupMemberships: normalizedGroups,
                },
            });

            await syncUserDepartmentLinks(
                db,
                targetUser.organizationId,
                targetUser,
                normalizedRole,
                departmentId || null,
                managedDepartmentId || null
            );

            return db.user.findUnique({
                where: { id: targetUser.id },
                include: userProfileInclude,
            });
        });

        const data = await loadAccessControlData(prisma, req.user);
        const updated = data.users.find((user) => user.id === updatedUser.id);
        res.json(updated);
    } catch (error) {
        console.error('User access update error:', error);
        res.status(500).json({ error: error.message || 'Failed to update user access' });
    }
});

router.patch('/users/:id/role', authMiddleware, authorize(ADMIN_ACCESS_ROLES), async (req, res) => {
    try {
        const targetUser = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: userProfileInclude,
        });

        assertUserAccess(req.user, targetUser);
        const normalizedRole = normalizeRole(req.body.role);

        if (!normalizedRole) {
            return res.status(400).json({ error: 'Invalid role selected.' });
        }

        assertAssignableRole(req.user, normalizedRole);

        const updatedUser = await prisma.user.update({
            where: { id: targetUser.id },
            data: { role: normalizedRole }
        });

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to update role' });
    }
});

router.patch('/users/:id/status', authMiddleware, authorize(ADMIN_ACCESS_ROLES), async (req, res) => {
    try {
        const targetUser = await prisma.user.findUnique({
            where: { id: req.params.id },
        });

        assertUserAccess(req.user, targetUser);
        const normalizedStatus = normalizeUserStatus(req.body.status);

        const updatedUser = await prisma.user.update({
            where: { id: targetUser.id },
            data: { status: normalizedStatus }
        });

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message || 'Failed to update status' });
    }
});

router.delete('/users/:id', authMiddleware, authorize(ADMIN_ACCESS_ROLES), async (req, res) => {
    try {
        const targetUser = await prisma.user.findUnique({
            where: { id: req.params.id },
        });

        assertUserAccess(req.user, targetUser);

        if (targetUser.role === 'SUPER_ADMIN') {
            const superAdminCount = await prisma.user.count({
                where: { role: 'SUPER_ADMIN' },
            });

            if (superAdminCount <= 1) {
                return res.status(400).json({ error: 'The last super admin cannot be deleted.' });
            }
        }

        await prisma.$transaction(async (db) => {
            await removeUserFromDepartmentLinks(db, targetUser.organizationId, targetUser);

            await db.user.delete({
                where: { id: targetUser.id }
            });
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Failed to delete user' });
    }
});

module.exports = router;
