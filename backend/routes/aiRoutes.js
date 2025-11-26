const express = require('express');
const router = express.Router();
const { getAIAnalysis } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze', protect, getAIAnalysis);

module.exports = router;
