const db = require('../src/models');
const { sendEmail } = require('./email');

/**
 * Creates an in-app notification and optionally sends an email
 * @param {Object} options
 * @param {String} options.userId - Recipient user ID
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message
 * @param {String} [options.type='INFO'] - Type (INFO, SUCCESS, WARNING, ERROR)
 * @param {String} [options.link] - Optional link
 * @param {Boolean} [options.sendEmail=true] - Whether to send an email too
 */
const notifyUser = async ({ userId, title, message, type = 'INFO', link, sendEmail: shouldSendEmail = true }) => {
    try {
        const user = await db.User.findByPk(userId);
        if (!user) return;

        // Create in-app notification
        await db.Notification.create({
            userId,
            title,
            message,
            type,
            link
        });

        // Send Email
        if (shouldSendEmail && user.email) {
            let emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4f46e5;">${title}</h2>
                    <p style="color: #374151; font-size: 16px; line-height: 1.5;">${message}</p>
                    ${link ? `<a href="${link}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">View Details</a>` : ''}
                    <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
                    <p style="color: #9ca3af; font-size: 12px; text-align: center;">This is an automated message from the LSRW Platform.</p>
                </div>
            `;
            await sendEmail({
                to: user.email,
                subject: title,
                html: emailHtml
            });
        }
    } catch (err) {
        console.error('Error notifying user:', err);
    }
};

/**
 * Notifies all students in a specific group
 */
const notifyGroupStudents = async (groupId, { title, message, link, sendEmail = true }) => {
    try {
        const group = await db.Group.findByPk(groupId, {
            include: [{
                model: db.User,
                as: 'members',
                where: { role: 'STUDENT' },
                required: false
            }]
        });

        if (!group || !group.members) return;

        for (const member of group.members) {
            await notifyUser({
                userId: member.id,
                title,
                message,
                link,
                sendEmail
            });
        }
    } catch (err) {
        console.error('Error notifying group students:', err);
    }
};

module.exports = {
    notifyUser,
    notifyGroupStudents
};
