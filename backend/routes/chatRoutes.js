const express = require('express');
const router = express.Router();
const { createSession, getSessions, getSessionMessages, deleteSession } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/sessions', protect, createSession);
router.get('/sessions', protect, getSessions);
router.get('/sessions/:sessionId/messages', protect, getSessionMessages);
router.delete('/sessions/:sessionId', protect, deleteSession);

module.exports = router;
