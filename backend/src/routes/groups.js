const express = require('express');
const router = express.Router();
const multer = require('multer');
const groupController = require('../controllers/groupController');
const { authMiddleware } = require('../../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/my-groups', authMiddleware, groupController.getMyGroups);
router.get('/', authMiddleware, groupController.getGroups);
router.get('/:id', authMiddleware, groupController.getGroupById);
router.post('/', authMiddleware, groupController.createGroup);
router.put('/:id', authMiddleware, groupController.updateGroup);
router.delete('/:id', authMiddleware, groupController.deleteGroup);

router.post('/:id/members', authMiddleware, groupController.addGroupMember);
router.delete('/:id/members/:userId', authMiddleware, groupController.removeGroupMember);

router.post('/:id/remove-admin', authMiddleware, groupController.removeGroupAdmin);
router.post('/:id/tasks/:taskId', authMiddleware, groupController.assignTaskToGroup);

router.post('/:id/admins', authMiddleware, groupController.addGroupAdmin);
router.delete('/:id/admins/:userId', authMiddleware, groupController.removeGroupAdmin);

router.post('/:id/bulk-import/parse', authMiddleware, upload.single('file'), groupController.parseBulkImport);
router.post('/:id/bulk-import/confirm', authMiddleware, groupController.confirmBulkImport);

module.exports = router;
