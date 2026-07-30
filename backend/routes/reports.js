const express = require('express');
const router = express.Router();
const db = require('../src/models');
const { authMiddleware } = require('../middleware/auth');

router.get('/progress', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        let studentIds = [];

        if (user.role === 'STUDENT') {
            studentIds = [user.id];
        } else if (user.role === 'TEACHER') {
            const groups = await db.Group.findAll({
                include: [{
                    model: db.User,
                    as: 'admins',
                    where: { id: user.id },
                    attributes: []
                }]
            });
            const groupIds = groups.map(g => g.id);

            if (groupIds.length > 0) {
                const students = await db.User.findAll({
                    where: { role: 'STUDENT', status: 'ACTIVE' },
                    include: [{
                        model: db.Group,
                        as: 'groupMemberships',
                        where: { id: groupIds },
                        attributes: []
                    }]
                });
                studentIds = students.map(s => s.id);
            }
        } else if (user.role === 'ADMIN') {
            const students = await db.User.findAll({
                where: { role: 'STUDENT' }
            });
            studentIds = students.map(s => s.id);
        }

        if (studentIds.length === 0) {
            res.header('Content-Type', 'text/csv');
            res.attachment('progress_report.csv');
            return res.send('Name,Group,Attended,Domain,Task Title,Result\n');
        }

        const studentsData = await db.User.findAll({
            where: { id: studentIds },
            include: [{
                model: db.Group,
                as: 'groupMemberships',
                attributes: ['name']
            }]
        });

        const responses = await db.Response.findAll({
            where: { userId: studentIds },
            include: [{
                model: db.Task,
                as: 'task',
                attributes: ['title', 'type', 'lsrwComponent']
            }]
        });

        const responseMap = {};
        responses.forEach(r => {
            if (!responseMap[r.userId]) responseMap[r.userId] = [];
            responseMap[r.userId].push(r);
        });

        let csvString = 'Name,Group,Attended,Domain,Task Title,Result\n';

        const escapeCsv = (str) => {
            if (str === null || str === undefined) return '""';
            const s = String(str);
            return '"' + s.replace(/"/g, '""') + '"';
        };

        studentsData.forEach(student => {
            const studentName = `${student.firstName} ${student.lastName}`.trim();
            const groupNames = student.groupMemberships && student.groupMemberships.length > 0 
                ? student.groupMemberships.map(g => g.name).join('; ') 
                : 'No Group';
            
            const studentResponses = responseMap[student.id] || [];

            if (studentResponses.length === 0) {
                csvString += `${escapeCsv(studentName)},${escapeCsv(groupNames)},"No","N/A","N/A","N/A"\n`;
            } else {
                studentResponses.forEach(r => {
                    const task = r.task;
                    const attended = 'Yes';
                    const domain = task ? (task.lsrwComponent || task.type || 'UNKNOWN').toUpperCase() : 'UNKNOWN';
                    const taskTitle = task ? task.title : 'Deleted Task';
                    const result = r.score != null ? Math.round(r.score) + '%' : 'N/A';

                    csvString += `${escapeCsv(studentName)},${escapeCsv(groupNames)},"${attended}",${escapeCsv(domain)},${escapeCsv(taskTitle)},"${result}"\n`;
                });
            }
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('progress_report.csv');
        return res.send(csvString);

    } catch (error) {
        console.error("Report generation error:", error);
        res.status(500).json({ error: "Failed to generate report" });
    }
});

module.exports = router;
