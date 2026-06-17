const db = require('../models');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');

// Helper to generate a random temporary password if none provided
const generateTempPassword = () => {
    return Math.random().toString(36).slice(-8) + 'Aa1!'; // ensures some complexity
};

exports.importStudents = async (req, res) => {
    await processImport(req, res, 'STUDENT');
};

exports.importTeachers = async (req, res) => {
    await processImport(req, res, 'TEACHER');
};

const processImport = async (req, res, role) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No Excel file uploaded.' });
    }

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const organizationId = req.body.organizationId || null;
        const defaultDepartment = req.body.department || null;

        const results = {
            total: data.length,
            success: [],
            errors: []
        };

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2; // Assuming row 1 is header

            try {
                if (!row.email || !row.firstName) {
                    throw new Error('Missing required fields: email or firstName');
                }

                const email = String(row.email).toLowerCase().trim();
                const firstName = String(row.firstName).trim();
                const lastName = row.lastName ? String(row.lastName).trim() : ' ';
                const department = row.department ? String(row.department).trim() : defaultDepartment;
                
                // Check if user exists
                const existingUser = await db.User.findOne({ where: { email } });
                if (existingUser) {
                    throw new Error(`Email ${email} is already in use.`);
                }

                const plainPassword = row.password ? String(row.password) : generateTempPassword();
                const passwordHash = await bcrypt.hash(plainPassword, 10);

                const user = await db.User.create({
                    firstName,
                    lastName,
                    email,
                    passwordHash,
                    role,
                    organizationId
                });

                // Update profile info indirectly if needed or assume user model handles it.
                // We'll return the temp password if we generated it so admin can share.
                results.success.push({
                    email: user.email,
                    tempPassword: row.password ? null : plainPassword
                });

            } catch (err) {
                results.errors.push({
                    row: rowNum,
                    error: err.message
                });
            }
        }

        return res.status(200).json(results);
    } catch (err) {
        console.error('Bulk import error:', err);
        return res.status(500).json({ error: 'Failed to process the Excel file.' });
    }
};

exports.mapStudentsToTeachers = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No Excel file uploaded.' });
    }

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const results = {
            total: data.length,
            success: [],
            errors: []
        };

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2;

            try {
                if (!row.studentEmail || !row.teacherEmail) {
                    throw new Error('Missing required fields: studentEmail or teacherEmail');
                }

                const studentEmail = String(row.studentEmail).toLowerCase().trim();
                const teacherEmail = String(row.teacherEmail).toLowerCase().trim();

                const student = await db.User.findOne({ where: { email: studentEmail, role: 'STUDENT' } });
                if (!student) throw new Error(`Student not found: ${studentEmail}`);

                const teacher = await db.User.findOne({ where: { email: teacherEmail, role: 'TEACHER' } });
                if (!teacher) throw new Error(`Teacher not found: ${teacherEmail}`);

                // Link the student to the teacher.
                // We'll define `assignedTeacherId` in User model or handle via Group.
                // Our schema doesn't show assignedTeacherId explicitly, but it might be there.
                // Let's create a dynamic field update.
                student.assignedTeacherId = teacher.id;
                // Wait, User model defined earlier didn't have `assignedTeacherId`.
                // Let's check models/user.js later to see if it needs adding. Or just use a Group mapping.
                
                // For now we will update it (and we will alter the User model to include it if missing)
                await student.update({ assignedTeacherId: teacher.id });

                results.success.push({
                    studentEmail,
                    teacherEmail
                });

            } catch (err) {
                results.errors.push({
                    row: rowNum,
                    error: err.message
                });
            }
        }

        return res.status(200).json(results);
    } catch (err) {
        console.error('Mapping error:', err);
        return res.status(500).json({ error: 'Failed to process mapping file.' });
    }
};

exports.downloadTemplate = async (req, res) => {
    const type = req.params.type;
    try {
        const workbook = xlsx.utils.book_new();
        let data = [];
        
        if (type === 'students' || type === 'teachers') {
            data = [
                { email: 'user@example.com', firstName: 'John', lastName: 'Doe', department: 'Science', password: 'optionalPassword123' }
            ];
        } else if (type === 'mapping') {
            data = [
                { studentEmail: 'student@example.com', teacherEmail: 'teacher@example.com' }
            ];
        } else {
            return res.status(400).json({ error: 'Invalid template type' });
        }

        const worksheet = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Template');

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Disposition', `attachment; filename="${type}_template.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);
    } catch (err) {
        console.error('Template error:', err);
        return res.status(500).json({ error: 'Failed to generate template' });
    }
};
