const { query } = require('../config/db');

// @desc    Create a new chat session
// @route   POST /api/chat/sessions
// @access  Private
const createSession = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.user.id;

    const result = await query(
      'INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING *',
      [userId, title || 'New Chat']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all chat sessions for user
// @route   GET /api/chat/sessions
// @access  Private
const getSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      'SELECT * FROM chat_sessions WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get messages for a session
// @route   GET /api/chat/sessions/:sessionId/messages
// @access  Private
const getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const sessionCheck = await query('SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const result = await query(
      'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a session
// @route   DELETE /api/chat/sessions/:sessionId
// @access  Private
const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const result = await query(
      'DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2 RETURNING *',
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({ message: 'Session deleted' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createSession,
  getSessions,
  getSessionMessages,
  deleteSession
};
