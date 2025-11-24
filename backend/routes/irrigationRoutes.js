const express = require('express');
const router = express.Router();
const { controlIrrigation } = require('../controllers/irrigationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/control', protect, controlIrrigation);

module.exports = router;
