const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../../middleware/auth');

router.get('/:userId/performance', authMiddleware, userController.getUserPerformance);
router.get('/', authMiddleware, userController.getUsers);
router.post('/invite', authMiddleware, userController.inviteUser);
router.patch('/:id', authMiddleware, userController.updateUser);
router.delete('/:id', authMiddleware, userController.deleteUser);

module.exports = router;
