const prisma = require('../config/prisma');

/**
 * Middleware to identify the organization based on the subdomain.
 * For local dev, we might use a header 'x-organization-id' if no subdomain is present.
 */
const tenantMiddleware = async (req, res, next) => {
    const host = req.headers.host;
    let subdomain = null;

    if (host && host.includes('.')) {
        subdomain = host.split('.')[0];
    }

    // Fallback for local development or explicit header
    const orgId = req.headers['x-organization-id'];

    try {
        let organization;
        if (orgId) {
            organization = await prisma.organization.findUnique({
                where: { id: orgId }
            });
        } else if (subdomain && subdomain !== 'localhost' && subdomain !== 'www') {
            organization = await prisma.organization.findUnique({
                where: { subdomain: subdomain }
            });
        }

        if (!organization) {
            // Depending on the app, we might want to default to a 'public' org or return error
            // For now, let's just attach null if not found
            req.organization = null;
        } else {
            req.organization = organization;
        }

        next();
    } catch (error) {
        console.error('Tenant Middleware Error:', error);
        res.status(500).json({ error: 'Internal Server Error during tenant identification' });
    }
};

module.exports = tenantMiddleware;
