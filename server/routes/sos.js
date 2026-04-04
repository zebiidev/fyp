import express from 'express';
import { createSosAlert } from '../controllers/sosController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createSosAlert);

export default router;
