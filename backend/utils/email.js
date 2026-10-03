const nodemailer = require('nodemailer');

// Set up transporter using environment variables or fallback to a dummy Ethereal account
// In production, these would be your actual SMTP credentials (e.g. Gmail, SendGrid, etc.)
const createTransporter = async () => {
    let transporter;
    
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // Fallback for testing if no environment variables are provided
        // Use ethereal email (fake SMTP service)
        let testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.warn("⚠️ Using Ethereal Email for testing. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env for real emails.");
    }
    
    return transporter;
};

/**
 * Sends an email
 * @param {Object} options 
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.html - HTML body
 * @returns {Promise<any>}
 */
const sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = await createTransporter();
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"LSRW Platform" <noreply@lsrw.edu>',
            to,
            subject,
            html,
        });
        
        console.log(`Email sent to ${to}: ${info.messageId}`);
        if (!process.env.SMTP_HOST) {
            console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        // We don't throw here to avoid breaking the application flow if email fails
        return null;
    }
};

module.exports = { sendEmail };
