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
                attributes: ['title', 'type', 'lsrwComponent', 'category', 'visibilityScope']
            }]
        });

        const responseMap = {};
        responses.forEach(r => {
            if (!responseMap[r.userId]) responseMap[r.userId] = [];
            responseMap[r.userId].push(r);
        });

        let csvString = 'Name,Group,Task Scope,Category,Domain,Task Title,Attended,Result,Submitted At\n';

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
                csvString += `${escapeCsv(studentName)},${escapeCsv(groupNames)},"N/A","N/A","N/A","N/A","No","N/A","N/A"\n`;
            } else {
                studentResponses.forEach(r => {
                    const task = r.task;
                    const attended = 'Yes';
                    const domain = task ? (task.lsrwComponent || task.type || 'UNKNOWN').toUpperCase() : 'UNKNOWN';
                    const taskTitle = task ? task.title : 'Deleted Task';
                    const scope = task ? (task.visibilityScope || 'UNKNOWN') : 'UNKNOWN';
                    const category = task ? (task.category || 'PRACTICE') : 'UNKNOWN';
                    const result = r.score != null ? Math.round(r.score) + '%' : 'N/A';
                    const submittedAt = r.submittedAt ? new Date(r.submittedAt).toLocaleString() : 'N/A';

                    csvString += `${escapeCsv(studentName)},${escapeCsv(groupNames)},${escapeCsv(scope)},${escapeCsv(category)},${escapeCsv(domain)},${escapeCsv(taskTitle)},"${attended}","${result}","${submittedAt}"\n`;
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

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/group/:groupId/custom', authMiddleware, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { taskIds, includeData, consolidation } = req.body; // includeData: 'FINAL_ONLY', 'ALL_ATTEMPTS', 'BOTH'; consolidation: 'BEST', 'AVERAGE'

        // 1. Verify user has access to group
        const user = req.user;
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
            const groupAccess = await prisma.group.findFirst({
                where: {
                    id: groupId,
                    OR: [
                        { ownerId: user.id },
                        {
                            members: {
                                some: { userId: user.id, role: { in: ['OWNER', 'COLLABORATOR', 'ADMIN'] } }
                            }
                        }
                    ]
                }
            });
            // If strict access check is needed, uncomment. For now, allow teachers to pull reports for groups.
        }

        // 2. Get all students in the group
        const groupMembers = await prisma.groupMembership.findMany({
            where: { groupId, role: 'MEMBER' },
            include: { user: true }
        });

        const studentIds = groupMembers.map(m => m.userId);

        if (studentIds.length === 0) {
            return res.json([]);
        }

        // 3. Fetch Tasks to know their names
        const tasks = await prisma.task.findMany({
            where: { id: { in: taskIds } },
            select: { id: true, title: true, type: true }
        });
        const taskMap = {};
        tasks.forEach(t => { taskMap[t.id] = t; });

        // 4. Get attempts for these students and selected tasks
        const attempts = await prisma.attempt.findMany({
            where: {
                userId: { in: studentIds },
                taskId: { in: taskIds },
                status: 'COMPLETED'
            },
            include: {
                task: { select: { title: true, type: true } },
                user: { select: { firstName: true, lastName: true, registrationNumber: true, email: true } }
            },
            orderBy: { submittedAt: 'asc' }
        });

        // 5. Group attempts by student and task
        // groupedData[studentId][taskId] = [attempt1, attempt2, ...]
        const groupedData = {};
        studentIds.forEach(id => {
            groupedData[id] = {};
            taskIds.forEach(tId => {
                groupedData[id][tId] = [];
            });
        });

        attempts.forEach(att => {
            if (groupedData[att.userId] && groupedData[att.userId][att.taskId]) {
                groupedData[att.userId][att.taskId].push(att);
            }
        });

        // 6. Generate report rows
        const reportRows = [];

        groupMembers.forEach(member => {
            const student = member.user;
            
            taskIds.forEach(taskId => {
                const studentTaskAttempts = groupedData[student.id]?.[taskId] || [];
                const taskInfo = taskMap[taskId] || { title: 'Deleted Task', type: 'Unknown' };
                const taskTitle = taskInfo.title;

                if (studentTaskAttempts.length === 0) {
                    // No attempts for this task
                    reportRows.push({
                        "Student Name": `${student.firstName} ${student.lastName}`.trim(),
                        "Reg No": student.registrationNumber || '',
                        "Email": student.email,
                        "Task": taskTitle,
                        "Attempt Type": "No Attempts",
                        "Score": "0",
                        "Submitted At": "N/A"
                    });
                    return;
                }

                let finalScore = 0;
                if (consolidation === 'BEST') {
                    finalScore = Math.max(...studentTaskAttempts.map(a => a.score || 0));
                } else if (consolidation === 'FIRST') {
                    finalScore = studentTaskAttempts[0].score || 0;
                } else if (consolidation === 'LAST') {
                    finalScore = studentTaskAttempts[studentTaskAttempts.length - 1].score || 0;
                } else { // AVERAGE
                    const sum = studentTaskAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
                    finalScore = sum / studentTaskAttempts.length;
                }

                if (includeData === 'ALL_ATTEMPTS' || includeData === 'BOTH') {
                    studentTaskAttempts.forEach((att, idx) => {
                        reportRows.push({
                            "Student Name": `${student.firstName} ${student.lastName}`.trim(),
                            "Reg No": student.registrationNumber || '',
                            "Email": student.email,
                            "Task": taskTitle,
                            "Attempt Type": `Attempt ${idx + 1}`,
                            "Score": att.score !== null ? Math.round(att.score) + '%' : '0%',
                            "Submitted At": new Date(att.submittedAt).toLocaleString()
                        });
                    });
                }

                if (includeData === 'FINAL_ONLY' || includeData === 'BOTH') {
                    reportRows.push({
                        "Student Name": `${student.firstName} ${student.lastName}`.trim(),
                        "Reg No": student.registrationNumber || '',
                        "Email": student.email,
                        "Task": taskTitle,
                        "Attempt Type": `Final Score (${consolidation})`,
                        "Score": Math.round(finalScore) + '%',
                        "Submitted At": "N/A"
                    });
                }
            });
        });

        res.json(reportRows);
    } catch (error) {
        console.error("Custom report generation error:", error);
        res.status(500).json({ error: "Failed to generate custom report" });
    }
});

const PDFDocument = require('pdfkit');

router.get('/attempt/:attemptId/pdf', authMiddleware, async (req, res) => {
    try {
        const { attemptId } = req.params;
        const attempt = await prisma.attempt.findUnique({
            where: { id: attemptId },
            include: {
                task: true,
                user: true
            }
        });

        if (!attempt) return res.status(404).json({ error: "Attempt not found" });

        // Ensure user is authorized to view this attempt
        if (req.user.role === 'STUDENT' && attempt.userId !== req.user.id) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const doc = new PDFDocument({ margin: 0, size: 'A4' });
        
        res.setHeader('Content-Type', 'application/pdf');
        const taskTitle = attempt.task?.title || 'Practice_Session';
        res.setHeader('Content-Disposition', `attachment; filename=Report_${taskTitle.replace(/\s+/g, '_')}.pdf`);
        doc.pipe(res);

        const primaryColor = '#4F46E5';
        const darkText = '#1F2937';
        const lightText = '#6B7280';
        const bgLight = '#F9FAFB';
        const borderColor = '#E5E7EB';

        // Background Header
        doc.fillColor(primaryColor).rect(0, 0, doc.page.width, 120).fill();

        // Header Text
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(18).text('NATIONAL ENGINEERING COLLEGE KOVILPATTI - 628 503', 0, 40, { align: 'center' });
        doc.fontSize(13).font('Helvetica').text('AI Assessment Performance Report', 0, 70, { align: 'center', characterSpacing: 2 });

        const contentY = 160;
        const leftColX = 50;
        const rightColX = doc.page.width / 2 + 10;
        const colWidth = (doc.page.width - 120) / 2;

        // Student Info Box
        doc.fillColor(bgLight).strokeColor(borderColor);
        doc.roundedRect(leftColX, contentY, colWidth, 105, 12).fillAndStroke();
        
        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12).text('Student Details', leftColX + 20, contentY + 20);
        doc.fillColor(darkText).font('Helvetica').fontSize(10);
        doc.text(`Name:`, leftColX + 20, contentY + 45, { continued: true }).font('Helvetica-Bold').text(` ${attempt.user.firstName} ${attempt.user.lastName}`);
        doc.font('Helvetica').text(`Reg No:`, leftColX + 20, contentY + 63, { continued: true }).font('Helvetica-Bold').text(` ${attempt.user.registrationNumber || 'N/A'}`);
        doc.font('Helvetica').text(`Email:`, leftColX + 20, contentY + 81, { continued: true }).font('Helvetica-Bold').text(` ${attempt.user.email}`);

        // Task Info Box
        doc.fillColor(bgLight).strokeColor(borderColor);
        doc.roundedRect(rightColX, contentY, colWidth, 105, 12).fillAndStroke();
        
        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12).text('Task Details', rightColX + 20, contentY + 20);
        doc.fillColor(darkText).font('Helvetica').fontSize(10);
        doc.text(`Task:`, rightColX + 20, contentY + 45, { continued: true }).font('Helvetica-Bold').text(` ${taskTitle}`);
        doc.font('Helvetica').text(`Type:`, rightColX + 20, contentY + 63, { continued: true }).font('Helvetica-Bold').text(` ${attempt.task?.type || 'UNKNOWN'}`);
        doc.font('Helvetica').text(`Date:`, rightColX + 20, contentY + 81, { continued: true }).font('Helvetica-Bold').text(` ${new Date(attempt.submittedAt).toLocaleDateString()}`);

        // Final Score Highlight
        const scoreY = contentY + 140;
        doc.fillColor('#F3F4F6').strokeColor('#E5E7EB');
        doc.roundedRect(50, scoreY, doc.page.width - 100, 110, 16).fillAndStroke();
        
        doc.fillColor(lightText).font('Helvetica-Bold').fontSize(14).text('Final Assessment Score', 0, scoreY + 25, { align: 'center', characterSpacing: 1 });
        
        const finalScore = attempt.score !== null ? Math.round(attempt.score) : 0;
        doc.fillColor(primaryColor).fontSize(54).font('Helvetica-Bold').text(`${finalScore}%`, 0, scoreY + 45, { align: 'center' });

        let currentY = scoreY + 150;

        // AI Results Grid
        if (attempt.aiResults && typeof attempt.aiResults === 'object') {
            doc.fillColor(darkText).fontSize(16).font('Helvetica-Bold').text('Skill Breakdown', 50, currentY);
            currentY += 30;

            const excludeKeys = ['transcription', 'stt', 'mistakes', 'grammar_mistakes', 'detailed_feedback'];
            const gridItems = [];
            
            Object.entries(attempt.aiResults).forEach(([k, v]) => {
                if (excludeKeys.includes(k.toLowerCase())) return;
                
                if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
                    Object.entries(v).forEach(([subK, subV]) => {
                        if (typeof subV === 'number' || typeof subV === 'string') {
                            gridItems.push({ label: subK.replace(/([A-Z])/g, ' $1').trim().toUpperCase(), value: subV });
                        }
                    });
                } else if (typeof v === 'number' || typeof v === 'string') {
                    gridItems.push({ label: k.replace(/([A-Z])/g, ' $1').trim().toUpperCase(), value: v });
                }
            });

            if (gridItems.length > 0) {
                const gridStartX = 50;
                const gridCols = 3;
                const gridWidth = (doc.page.width - 100 - (20 * (gridCols - 1))) / gridCols;
                const rowHeight = 85;

                gridItems.forEach((item, index) => {
                    const col = index % gridCols;
                    const row = Math.floor(index / gridCols);
                    const x = gridStartX + (col * (gridWidth + 20));
                    const y = currentY + (row * rowHeight);
                    
                    if (y > doc.page.height - 100) {
                        doc.addPage();
                        currentY = 50 - (row * rowHeight);
                    }

                    doc.fillColor(bgLight).strokeColor(borderColor);
                    doc.roundedRect(x, y, gridWidth, 70, 10).fillAndStroke();
                    doc.fillColor(lightText).font('Helvetica-Bold').fontSize(9).text(item.label, x + 15, y + 15);
                    doc.fillColor(darkText).font('Helvetica-Bold').fontSize(22).text(String(item.value), x + 15, y + 32);
                });
                
                currentY += (Math.ceil(gridItems.length / gridCols) * rowHeight) + 30;
            }
        }

        if (attempt.teacherFeedback) {
            if (currentY > doc.page.height - 150) {
                doc.addPage();
                currentY = 50;
            }
            doc.fillColor(darkText).fontSize(16).font('Helvetica-Bold').text('Teacher Feedback', 50, currentY);
            currentY += 30;
            doc.fillColor('#FFFBEB').strokeColor('#FDE68A');
            doc.roundedRect(50, currentY, doc.page.width - 100, 80, 10).fillAndStroke();
            doc.fillColor('#92400E').font('Helvetica').fontSize(12).text(attempt.teacherFeedback, 70, currentY + 20, { width: doc.page.width - 140, lineGap: 4 });
        }

        doc.end();
    } catch (error) {
        console.error("PDF generation error:", error);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
});

module.exports = router;
