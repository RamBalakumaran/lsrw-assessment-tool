const jwt = require('jsonwebtoken');
const db = require('../src/models');

const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = await db.User.findByPk(decoded.id);

        if (!req.user) {
            return res.status(401).json({ error: 'User not found.' });
        }

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
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
