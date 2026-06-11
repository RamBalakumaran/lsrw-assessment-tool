const teacherSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    department: true,
    status: true,
};

const userProfileInclude = {
    organization: true,
    teacher: {
        select: teacherSelect,
    },
    departmentAdminDepartments: {
        select: {
            id: true,
            name: true,
            status: true,
        },
    },
};

const formatProfileName = (user = {}) => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email?.split('@')[0] || 'User';
};

const normalizeGroupMemberships = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.reduce((groups, entry) => {
        if (typeof entry === 'string') {
            const name = entry.trim();
            if (name) {
                groups.push({ name, role: null, description: null, status: 'ACTIVE' });
            }
            return groups;
        }

        if (!entry || typeof entry !== 'object') {
            return groups;
        }

        const rawName = typeof entry.name === 'string'
            ? entry.name
            : typeof entry.title === 'string'
                ? entry.title
                : '';
        const name = rawName.trim();

        if (!name) {
            return groups;
        }

        const role = typeof entry.role === 'string' && entry.role.trim()
            ? entry.role.trim()
            : null;
        const description = typeof entry.description === 'string' && entry.description.trim()
            ? entry.description.trim()
            : null;
        const status = typeof entry.status === 'string' && entry.status.trim().toUpperCase() === 'INACTIVE'
            ? 'INACTIVE'
            : 'ACTIVE';

        groups.push({ name, role, description, status });
        return groups;
    }, []);
};

const parseGroupMembershipsInput = (value) => {
    if (Array.isArray(value)) {
        return normalizeGroupMemberships(value);
    }

    if (typeof value !== 'string') {
        return [];
    }

    const groups = value
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({ name, role: null, description: null, status: 'ACTIVE' }));

    return normalizeGroupMemberships(groups);
};

const buildUserProfile = (user = {}) => {
    const organization = user.organization
        ? {
            id: user.organization.id,
            name: user.organization.name,
            subdomain: user.organization.subdomain,
            status: user.organization.status,
            logoUrl: user.organization.logoUrl,
        }
        : null;

    return {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        firstName: user.firstName,
        lastName: user.lastName,
        profileName: formatProfileName(user),
        organizationId: user.organizationId,
        department: user.department || null,
        organization,
        university: organization,
        assignedTeacher: user.teacher
            ? {
                id: user.teacher.id,
                email: user.teacher.email,
                role: user.teacher.role,
                department: user.teacher.department || null,
                status: user.teacher.status || null,
                profileName: formatProfileName(user.teacher),
            }
            : null,
        groupMemberships: normalizeGroupMemberships(user.groupMemberships),
        managedDepartments: Array.isArray(user.departmentAdminDepartments)
            ? user.departmentAdminDepartments.map((department) => ({
                id: department.id,
                name: department.name,
                status: department.status,
            }))
            : [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
};

const resolveAssignedTeacher = async (prisma, { organizationId, teacherId, teacherEmail }) => {
    if (!teacherId && !teacherEmail) {
        return null;
    }

    const where = {
        organizationId,
        role: 'TEACHER',
    };

    if (teacherId) {
        where.id = teacherId;
    } else if (teacherEmail) {
        where.email = teacherEmail.trim().toLowerCase();
    }

    return prisma.user.findFirst({
        where,
        select: teacherSelect,
    });
};

module.exports = {
    buildUserProfile,
    formatProfileName,
    parseGroupMembershipsInput,
    resolveAssignedTeacher,
    userProfileInclude,
};
