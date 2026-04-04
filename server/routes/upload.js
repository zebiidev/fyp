import express from 'express';
import { getUploadAuth } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/auth', protect, getUploadAuth);

export default router;
