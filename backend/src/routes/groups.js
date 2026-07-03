const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authMiddleware } = require('../../middleware/auth');

router.get('/my-groups', authMiddleware, groupController.getMyGroups);
router.get('/', authMiddleware, groupController.getGroups);
router.get('/:id', authMiddleware, groupController.getGroupById);
router.post('/', authMiddleware, groupController.createGroup);
router.delete('/:id', authMiddleware, groupController.deleteGroup);

router.post('/:id/members', authMiddleware, groupController.addGroupMember);
router.delete('/:id/members/:userId', authMiddleware, groupController.removeGroupMember);

router.post('/:id/admins', authMiddleware, groupController.addGroupAdmin);
router.delete('/:id/admins/:userId', authMiddleware, groupController.removeGroupAdmin);

module.exports = router;
