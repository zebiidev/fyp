import express from 'express';
import { createRide, searchRides, requestRide, updateRideStatus, getRideById, getRideContact, getMyRides, updatePassengerStatus, rateRide } from '../controllers/rideController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createRide);
router.get('/', protect, searchRides);
router.get('/my', protect, getMyRides); // Must be before /:id to avoid conflict
router.get('/:id/contact', protect, getRideContact);
router.get('/:id', protect, getRideById);
router.post('/:id/join', protect, requestRide);
router.put('/:id/status', protect, updateRideStatus);
router.put('/:id/passengers/:passengerId/status', protect, updatePassengerStatus);
router.post('/:id/rate', protect, rateRide);

export default router;
