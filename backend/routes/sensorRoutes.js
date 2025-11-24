const express = require('express');
const router = express.Router();
const { uploadData, getLatestData, getHistoryData } = require('../controllers/sensorController');
const { protect } = require('../middleware/authMiddleware');

router.post('/upload', uploadData); // Public for IoT device
router.get('/latest/:device_id', protect, getLatestData);
router.get('/history/:device_id', protect, getHistoryData);

module.exports = router;
