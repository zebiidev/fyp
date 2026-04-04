import express from 'express';
import { deleteMessage, getChatHistory, getConversations } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/:userId', protect, getChatHistory);
router.delete('/message/:messageId', protect, deleteMessage);

export default router;
