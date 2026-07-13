const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { sendMessage, getHistory } = require('../controllers/chatController');

// All chat routes require a valid JWT
router.use(protect);

// POST /api/chat  — send a message, get AI reply
router.post('/', sendMessage);

// GET /api/chat/history  — retrieve conversation history
router.get('/history', getHistory);

module.exports = router;
