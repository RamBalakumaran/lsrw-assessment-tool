const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

router.get('/my-groups', groupController.getMyGroups);
router.get('/', groupController.getGroups);
router.get('/:id', groupController.getGroupById);
router.post('/', groupController.createGroup);
router.delete('/:id', groupController.deleteGroup);

router.post('/:id/members', groupController.addGroupMember);
router.delete('/:id/members/:userId', groupController.removeGroupMember);

router.post('/:id/admins', groupController.addGroupAdmin);
router.delete('/:id/admins/:userId', groupController.removeGroupAdmin);

module.exports = router;
