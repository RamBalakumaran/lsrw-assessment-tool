const express = require('express');
const router = express.Router();
const db = require('../models');
const { authMiddleware } = require('../../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const notifications = await db.Notification.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to load notifications" });
    }
});

router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        const notification = await db.Notification.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }
        notification.isRead = true;
        await notification.save();
        res.json(notification);
    } catch (error) {
        console.error("Error updating notification:", error);
        res.status(500).json({ error: "Failed to update notification" });
    }
});

module.exports = router;
