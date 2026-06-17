const express = require('express');
const router = express.Router();
const multer = require('multer');
const bulkImportController = require('../controllers/bulkImportController');

// Multer config: memory storage keeps file in buffer instead of disk, which is fine for small/medium excel files.
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/students', upload.single('file'), bulkImportController.importStudents);
router.post('/teachers', upload.single('file'), bulkImportController.importTeachers);
router.post('/map-students-to-teachers', upload.single('file'), bulkImportController.mapStudentsToTeachers);

router.get('/template/:type', bulkImportController.downloadTemplate);

module.exports = router;
