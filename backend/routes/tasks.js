const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authMiddleware, authorize } = require('../middleware/auth');

// ============================================
// TASK MANAGEMENT ROUTES - COMPREHENSIVE LSRW
// ============================================

// Task field requirements based on type and subtype
const TASK_FIELD_REQUIREMENTS = {
    LISTENING: {
        MCQ_AUDIO: ['title', 'audioUrl', 'type', 'subType', 'visibilityScope'],
        FILL_BLANKS_AUDIO: ['title', 'audioUrl', 'type', 'subType', 'visibilityScope'],
        NOTE_TAKING: ['title', 'audioUrl', 'instructions', 'type', 'subType', 'visibilityScope'],
        LISTENING_GIST: ['title', 'audioUrl', 'type', 'subType', 'visibilityScope'],
        LISTENING_DETAILS: ['title', 'audioUrl', 'type', 'subType', 'visibilityScope'],
        DICTATION: ['title', 'audioUrl', 'type', 'subType', 'visibilityScope'],
        MATCHING_AUDIO: ['title', 'audioUrl', 'type', 'subType', 'visibilityScope']
    },
    SPEAKING: {
        SELF_INTRODUCTION: ['title', 'instructions', 'type', 'subType', 'visibilityScope', 'timeLimit'],
        PICTURE_DESCRIPTION: ['title', 'instructions', 'type', 'subType', 'visibilityScope', 'timeLimit'],
        READ_ALOUD: ['title', 'passage', 'type', 'subType', 'visibilityScope', 'timeLimit'],
        ANSWER_QUESTIONS: ['title', 'instructions', 'type', 'subType', 'visibilityScope', 'timeLimit'],
        REPEAT_SENTENCES: ['title', 'audioUrl', 'type', 'subType', 'visibilityScope']
    },
    READING: {
        COMPREHENSION_MCQ: ['title', 'passage', 'type', 'subType', 'visibilityScope'],
        TRUE_FALSE: ['title', 'passage', 'type', 'subType', 'visibilityScope'],
        FILL_BLANKS: ['title', 'passage', 'type', 'subType', 'visibilityScope'],
        MATCHING_HEADINGS: ['title', 'passage', 'type', 'subType', 'visibilityScope'],
        SKIMMING: ['title', 'passage', 'instructions', 'type', 'subType', 'visibilityScope'],
        SCANNING: ['title', 'passage', 'instructions', 'type', 'subType', 'visibilityScope'],
        VOCABULARY: ['title', 'passage', 'type', 'subType', 'visibilityScope']
    },
    WRITING: {
        ESSAY: ['title', 'instructions', 'type', 'subType', 'visibilityScope', 'evaluationRubric'],
        PARAGRAPH: ['title', 'instructions', 'type', 'subType', 'visibilityScope'],
        LETTER_EMAIL: ['title', 'instructions', 'type', 'subType', 'visibilityScope'],
        STORY_COMPLETION: ['title', 'passage', 'instructions', 'type', 'subType', 'visibilityScope'],
        SUMMARIZATION: ['title', 'passage', 'type', 'subType', 'visibilityScope'],
        GRAMMAR_CORRECTION: ['title', 'passage', 'type', 'subType', 'visibilityScope'],
        REPORT: ['title', 'instructions', 'type', 'subType', 'visibilityScope', 'evaluationRubric']
    }
};

/**
 * Create a new task with visibility scope and subtype
 */
router.post('/', authMiddleware, authorize(['ADMIN', 'DEPT_ADMIN', 'TEACHER']), async (req, res) => {
    try {
        const {
            title,
            description,
            type,
            subType,
            difficulty = 'INTERMEDIATE',
            timeLimit,
            audioUrl,
            audioFileName,
            passage,
            instructions,
            evaluationRubric,
            visibilityScope,
            departmentIds = [],
            groupIds = [],
            questions = [],
            passingScore = 60,
            showAnswers = false,
            showScores = true
        } = req.body;

        const userId = req.user.id;
        const orgId = req.user.organizationId;

        // Validation
        if (!title || !type || !subType || !visibilityScope) {
            return res.status(400).json({
                error: 'Title, type, subType, and visibilityScope are required'
            });
        }

        // Check required fields based on type and subtype
        const requiredFields = TASK_FIELD_REQUIREMENTS[type]?.[subType];
        if (!requiredFields) {
            return res.status(400).json({
                error: `Invalid type/subType combination: ${type}/${subType}`
            });
        }

        const missingFields = requiredFields.filter(field => {
            if (field === 'title') return !title;
            if (field === 'audioUrl') return !audioUrl;
            if (field === 'passage') return !passage;
            if (field === 'instructions') return !instructions;
            if (field === 'evaluationRubric') return !evaluationRubric;
            return false;
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Required fields for ${type}/${subType}: ${missingFields.join(', ')}`
            });
        }

        // Validate visibility scope permissions
        if (visibilityScope === 'GLOBAL' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                error: 'Only Super Admin can create Global scope tasks'
            });
        }

        if (visibilityScope === 'DEPARTMENT') {
            if (!departmentIds || departmentIds.length === 0) {
                return res.status(400).json({
                    error: 'departmentIds required for DEPARTMENT scope'
                });
            }

            // Verify user has access to all selected departments
            if (req.user.role === 'DEPT_ADMIN') {
                // Dept admin can only assign to their own department
                const userDept = await prisma.department.findFirst({
                    where: { adminId: userId }
                });
                if (!userDept || !departmentIds.includes(userDept.id)) {
                    return res.status(403).json({
                        error: 'Dept Admin can only assign tasks to their own department'
                    });
                }
            } else if (req.user.role === 'TEACHER') {
                // Teachers can only create department tasks if assigned
                return res.status(403).json({
                    error: 'Teachers cannot create department-scope tasks'
                });
            }
        }

        if (visibilityScope === 'GROUP') {
            if (!groupIds || groupIds.length === 0) {
                return res.status(400).json({
                    error: 'groupIds required for GROUP scope'
                });
            }

            // Verify user is owner/collaborator of all groups
            const userGroups = await prisma.groupMembership.findMany({
                where: {
                    userId,
                    groupId: { in: groupIds },
                    role: { in: ['OWNER', 'COLLABORATOR'] }
                }
            });

            if (userGroups.length !== groupIds.length) {
                return res.status(403).json({
                    error: 'You must be owner/collaborator of all selected groups'
                });
            }
        }

        // Create task
        const task = await prisma.task.create({
            data: {
                title,
                description,
                type,
                subType,
                difficulty,
                timeLimit,
                status: 'DRAFT',
                audioUrl,
                audioFileName,
                passage,
                instructions,
                evaluationRubric: evaluationRubric ? JSON.stringify(evaluationRubric) : null,
                passingScore,
                showAnswers,
                showScores,
                organizationId: orgId,
                visibilityScope,
                createdById: userId,
                createdByRole: req.user.role,
                questions: {
                    create: questions.map((q, index) => ({
                        questionText: q.questionText || q.text,
                        options: q.options || q.opts,
                        correctAnswer: q.correctAnswer,
                        questionType: q.questionType || q.type,
                        explanation: q.explanation,
                        imageUrl: q.imageUrl,
                        audioUrl: q.audioUrl,
                        time: q.time || 20,
                        order: index
                    }))
                },
                departmentAssignments: {
                    create: departmentIds.map(deptId => ({
                        departmentId: deptId
                    }))
                },
                groupAssignments: {
                    create: groupIds.map(gId => ({
                        groupId: gId
                    }))
                }
            },
            include: {
                questions: true,
                departmentAssignments: { include: { department: { select: { id: true, name: true } } } },
                groupAssignments: { include: { group: { select: { id: true, name: true } } } }
            }
        });

        await logAudit(
            userId,
            'TASK_CREATED',
            'Task',
            task.id,
            { type, subType, visibilityScope, title },
            req
        );

        res.status(201).json(task);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

/**
 * Get tasks accessible to the user based on their role
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const orgId = req.user.organizationId;
        const { type, status } = req.query;

        let whereClause = { organizationId: orgId };

        // Add type filter if provided
        if (type) whereClause.type = type;
        if (status) whereClause.status = status;

        // Filter based on visibility and role
        if (req.user.role === 'STUDENT') {
            // Students can see: ORGANIZATION, DEPARTMENT (their dept), GROUP (they're in)
            const studentGroups = await prisma.groupMembership.findMany({
                where: { userId },
                select: { groupId: true }
            });
            const groupIds = studentGroups.map(g => g.groupId);

            // Get student's department
            const userDept = await prisma.user.findUnique({
                where: { id: userId },
                select: { department: true }
            });

            whereClause = {
                ...whereClause,
                OR: [
                    { visibilityScope: 'ORGANIZATION' },
                    {
                        visibilityScope: 'DEPARTMENT',
                        departmentAssignments: {
                            some: { department: { name: userDept?.department } }
                        }
                    },
                    {
                        visibilityScope: 'GROUP',
                        groupAssignments: {
                            some: { groupId: { in: groupIds } }
                        }
                    }
                ]
            };
        } else if (req.user.role === 'TEACHER') {
            // Teachers see: ORGANIZATION, GROUP (they own/collaborate), and their own tasks
            const collaborativeGroups = await prisma.groupMembership.findMany({
                where: {
                    userId,
                    role: { in: ['OWNER', 'COLLABORATOR'] }
                },
                select: { groupId: true }
            });
            const groupIds = collaborativeGroups.map(g => g.groupId);

            whereClause = {
                ...whereClause,
                OR: [
                    { visibilityScope: 'ORGANIZATION' },
                    {
                        visibilityScope: 'GROUP',
                        groupAssignments: {
                            some: { groupId: { in: groupIds } }
                        }
                    },
                    { createdById: userId }
                ]
            };
        }
        // ADMIN and DEPT_ADMIN see all tasks in their org

        const tasks = await prisma.task.findMany({
            where: whereClause,
            include: {
                questions: true,
                departmentAssignments: { include: { department: { select: { id: true, name: true } } } },
                groupAssignments: { include: { group: { select: { id: true, name: true } } } },
                createdBy: { select: { id: true, email: true, firstName: true, lastName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(tasks);
    } catch (error) {
        console.error('Fetch tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

/**
 * Get a specific task
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const orgId = req.user.organizationId;

        const task = await prisma.task.findFirst({
            where: {
                id,
                organizationId: orgId
            },
            include: {
                questions: true,
                departmentAssignments: { include: { department: { select: { id: true, name: true } } } },
                groupAssignments: { include: { group: { select: { id: true, name: true } } } },
                createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
                attempts: {
                    where: { userId },
                    select: {
                        id: true,
                        status: true,
                        score: true,
                        submittedAt: true,
                        studentAnswers: true
                    }
                }
            }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Check access
        if (req.user.role === 'STUDENT') {
            // Verify student can access
            const hasAccess = await canStudentAccessTask(userId, task);
            if (!hasAccess) {
                return res.status(403).json({ error: 'Access denied' });
            }
        } else if (req.user.role === 'TEACHER' && task.createdById !== userId) {
            // Check if teacher is collaborator in any assigned group
            if (task.visibilityScope === 'GROUP') {
                const isCollaborator = await prisma.groupMembership.findFirst({
                    where: {
                        userId,
                        groupId: {
                            in: task.groupAssignments.map(g => g.groupId)
                        },
                        role: { in: ['OWNER', 'COLLABORATOR'] }
                    }
                });
                if (!isCollaborator) {
                    return res.status(403).json({ error: 'Access denied' });
                }
            } else if (task.visibilityScope !== 'ORGANIZATION') {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        res.json(task);
    } catch (error) {
        console.error('Fetch task error:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});

/**
 * Publish a task (move from DRAFT to PUBLISHED)
 */
router.patch('/:id/publish', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const orgId = req.user.organizationId;

        const task = await prisma.task.findFirst({
            where: {
                id,
                organizationId: orgId,
                createdById: userId
            }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found or access denied' });
        }

        if (task.status !== 'DRAFT') {
            return res.status(400).json({ error: 'Only draft tasks can be published' });
        }

        const updated = await prisma.task.update({
            where: { id },
            data: { status: 'PUBLISHED' },
            include: {
                questions: true,
                departmentAssignments: { include: { department: { select: { id: true, name: true } } } },
                groupAssignments: { include: { group: { select: { id: true, name: true } } } }
            }
        });

        await logAudit(userId, 'TASK_PUBLISHED', 'Task', id, { title: task.title }, req);

        res.json(updated);
    } catch (error) {
        console.error('Publish task error:', error);
        res.status(500).json({ error: 'Failed to publish task' });
    }
});

/**
 * Update a task (draft only)
 */
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const orgId = req.user.organizationId;
        const {
            title, description, difficulty, timeLimit, audioUrl, passage,
            instructions, evaluationRubric, questions, passingScore
        } = req.body;

        const task = await prisma.task.findFirst({
            where: {
                id,
                organizationId: orgId,
                createdById: userId
            }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found or access denied' });
        }

        if (task.status !== 'DRAFT') {
            return res.status(400).json({ error: 'Only draft tasks can be edited' });
        }

        const updated = await prisma.task.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(difficulty && { difficulty }),
                ...(timeLimit !== undefined && { timeLimit }),
                ...(audioUrl && { audioUrl }),
                ...(passage && { passage }),
                ...(instructions && { instructions }),
                ...(evaluationRubric && { evaluationRubric: JSON.stringify(evaluationRubric) }),
                ...(passingScore && { passingScore }),
                ...(questions && {
                    questions: {
                        deleteMany: {},
                        create: questions.map((q, index) => ({
                            questionText: q.questionText || q.text,
                            options: q.options || q.opts,
                            correctAnswer: q.correctAnswer,
                            questionType: q.questionType || q.type,
                            explanation: q.explanation,
                            order: index
                        }))
                    }
                })
            },
            include: {
                questions: true,
                departmentAssignments: true,
                groupAssignments: true
            }
        });

        await logAudit(userId, 'TASK_UPDATED', 'Task', id, { title: updated.title }, req);

        res.json(updated);
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

/**
 * Delete a task (draft only)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const orgId = req.user.organizationId;

        const task = await prisma.task.findFirst({
            where: {
                id,
                organizationId: orgId,
                createdById: userId
            }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found or access denied' });
        }

        if (task.status !== 'DRAFT') {
            return res.status(400).json({ error: 'Only draft tasks can be deleted' });
        }

        await prisma.task.delete({ where: { id } });

        await logAudit(userId, 'TASK_DELETED', 'Task', id, { title: task.title }, req);

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

/**
 * Helper: Check if student can access task
 */
async function canStudentAccessTask(userId, task) {
    if (task.visibilityScope === 'ORGANIZATION') {
        return true;
    }

    if (task.visibilityScope === 'DEPARTMENT') {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { department: true }
        });
        const taskDepts = await prisma.taskDepartmentAssignment.findMany({
            where: { taskId: task.id },
            include: { department: { select: { name: true } } }
        });
        return taskDepts.some(d => d.department.name === user?.department);
    }

    if (task.visibilityScope === 'GROUP') {
        const membership = await prisma.groupMembership.findFirst({
            where: {
                userId,
                groupId: { in: task.groupAssignments.map(g => g.groupId) }
            }
        });
        return !!membership;
    }

    return false;
}

/**
 * Helper: Log audit
 */
async function logAudit(userId, action, entityType, entityId, changes, req) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                changes,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });
    } catch (err) {
        console.error('Audit log error:', err);
    }
}

module.exports = router;
