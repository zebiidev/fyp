import express from 'express';
import { createComplaint, getMyComplaints, getAllComplaints, resolveComplaint, updateComplaint } from '../controllers/complaintController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createComplaint);
router.get('/my', protect, getMyComplaints);
router.get('/', protect, admin, getAllComplaints); // Admin route
router.put('/:id/resolve', protect, admin, resolveComplaint); // Admin route
router.put('/:id', protect, admin, updateComplaint); // Admin update route

export default router;
