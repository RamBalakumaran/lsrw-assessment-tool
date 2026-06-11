const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: {
                organization: true,
                departmentAdminDepartments: {
                    select: {
                        id: true,
                        name: true,
                        organizationId: true,
                        status: true,
                    },
                },
            },
        });

        if (!req.user) {
            return res.status(401).json({ error: 'User not found.' });
        }

        // Check if user belongs to the identified organization
        if (req.organization && req.user.role !== 'SUPER_ADMIN' && req.user.organizationId !== req.organization.id) {
            return res.status(403).json({ error: 'Unauthorized access to this organization.' });
        }

        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
        }
        next();
    };
};

module.exports = { authMiddleware, authorize };
