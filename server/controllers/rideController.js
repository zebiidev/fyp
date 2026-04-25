import Ride from '../models/Ride.js';
import User from '../models/User.js';
import AdminSettings from '../models/AdminSettings.js';
import { createNotification } from './notificationController.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buildFlexibleRegex = (value) => {
    const tokens = String(value || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(escapeRegex);

    if (tokens.length === 0) return null;
    // Allow words in between, e.g. "gcuf gate" matches "GCUF main gate".
    return new RegExp(tokens.join('.*'), 'i');
};

const normalizeLocation = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');

const levenshteinDistance = (a, b) => {
    if (a === b) return 0;
    if (!a) return b.length;
    if (!b) return a.length;

    const rows = a.length + 1;
    const cols = b.length + 1;
    const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
    for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

    for (let i = 1; i < rows; i += 1) {
        for (let j = 1; j < cols; j += 1) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return matrix[rows - 1][cols - 1];
};

const isFuzzyMatch = (query, target) => {
    const normalizedQuery = normalizeLocation(query);
    if (!normalizedQuery) return true;

    const normalizedTarget = normalizeLocation(target);
    if (!normalizedTarget) return false;

    if (normalizedTarget.includes(normalizedQuery)) return true;

    const queryCompact = normalizedQuery.replace(/\s+/g, '');
    const targetCompact = normalizedTarget.replace(/\s+/g, '');

    if (targetCompact.includes(queryCompact)) return true;

    const minLen = Math.min(queryCompact.length, targetCompact.length);
    if (minLen < 4) return false;

    const distance = levenshteinDistance(queryCompact, targetCompact);
    if (distance <= 2) return true;

    const similarity = 1 - distance / Math.max(queryCompact.length, targetCompact.length);
    return similarity >= 0.7;
};

const getLocationSimilarityScore = (query, target) => {
    const normalizedQuery = normalizeLocation(query);
    const normalizedTarget = normalizeLocation(target);

    if (!normalizedQuery || !normalizedTarget) return 0;
    if (normalizedQuery === normalizedTarget) return 100;
    if (normalizedTarget.includes(normalizedQuery) || normalizedQuery.includes(normalizedTarget)) return 88;

    const queryTokens = new Set(normalizedQuery.split(' ').filter(Boolean));
    const targetTokens = new Set(normalizedTarget.split(' ').filter(Boolean));
    const sharedTokenCount = [...queryTokens].filter((token) => targetTokens.has(token)).length;

    if (sharedTokenCount > 0) {
        const tokenScore = Math.round((sharedTokenCount / Math.max(queryTokens.size, targetTokens.size)) * 80);
        if (tokenScore >= 35) return tokenScore;
    }

    if (isFuzzyMatch(query, target)) return 60;
    return 0;
};

const scoreRideMatch = ({ ride, from, to, userArea }) => {
    let score = 0;
    const reasons = [];

    const areaSource = from || userArea;
    const areaScore = getLocationSimilarityScore(areaSource, ride.pickupLocation);
    if (areaScore > 0) {
        score += areaScore;
        reasons.push(from ? 'Pickup matches your selected area' : 'Pickup matches your saved area');
    }

    const destinationScore = getLocationSimilarityScore(to, ride.dropoffLocation);
    if (destinationScore > 0) {
        score += destinationScore + 10;
        reasons.push('Drop-off matches your route');
    }

    if (areaScore > 0 && destinationScore > 0) {
        score += 20;
        reasons.push('Full route overlap');
    }

    return {
        score: Math.min(score, 100),
        reasons
    };
};

// @desc    Create a new ride
// @route   POST /api/rides
// @access  Private (Rider only)
export const createRide = async (req, res) => {
    try {
        const { pickupLocation, dropoffLocation, date, time, seatsAvailable, pricePerSeat, vehicle } = req.body;

        // Ensure user is a rider
        if (req.user.role !== 'rider') {
            return res.status(403).json({ message: 'Only riders can post rides' });
        }

        const settings = await AdminSettings.findOne().select('maintenanceMode strictVerification');
        if (settings?.maintenanceMode) {
            return res.status(503).json({ message: 'Service is temporarily unavailable due to maintenance mode.' });
        }

        if (settings?.strictVerification) {
            const isApproved = req.user.accountStatus === 'approved';
            const isVerified = req.user.isVerified === true;
            const vehicleDetails = req.user.vehicleDetails || {};
            const hasVehicleInfo = Boolean(vehicleDetails.make && vehicleDetails.model && vehicleDetails.plateNumber);
            const hasProfileInfo = Boolean(
                req.user.phoneNumber &&
                req.user.registrationNumber &&
                req.user.department &&
                req.user.programme &&
                req.user.semester &&
                req.user.emergencyName &&
                req.user.emergencyContact &&
                req.user.cnic &&
                req.user.gender
            );

            if (!isApproved || !isVerified) {
                return res.status(403).json({ message: 'Your rider account must be approved and verified before offering rides.' });
            }
            if (!hasProfileInfo || !hasVehicleInfo) {
                return res.status(400).json({ message: 'Please complete your rider profile and vehicle details before offering rides.' });
            }
        }

        const ride = await Ride.create({
            driver: req.user.id,
            pickupLocation,
            dropoffLocation,
            date,
            time,
            seatsAvailable,
            pricePerSeat,
            vehicle: vehicle || req.user.vehicleDetails // Use provided vehicle or user's default
        });

        res.status(201).json(ride);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Search for rides
// @route   GET /api/rides
// @access  Private
export const searchRides = async (req, res) => {
    try {
        const { from, to, date, useProfileArea } = req.query;
        const trimmedFrom = String(from || '').trim();
        const trimmedTo = String(to || '').trim();
        const shouldUseProfileArea = useProfileArea === 'true';
        const profileArea = shouldUseProfileArea ? String(req.user.address || '').trim() : '';
        const effectiveFrom = trimmedFrom || profileArea;

        const baseQuery = {
            status: 'scheduled',
            seatsAvailable: { $gt: 0 },
            driver: { $ne: req.user.id }
        };

        const query = { ...baseQuery };
        const fromRegex = buildFlexibleRegex(effectiveFrom);
        if (fromRegex) {
            query.pickupLocation = { $regex: fromRegex };
        }
        const toRegex = buildFlexibleRegex(trimmedTo);
        if (toRegex) {
            query.dropoffLocation = { $regex: toRegex };
        }
        if (date) {
            // Simple date match (exact day) - can be improved for ranges
            const searchDate = new Date(date);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            baseQuery.date = {
                $gte: searchDate,
                $lt: nextDay
            };
            query.date = baseQuery.date;
        }

        let rides = await Ride.find(query)
            .populate('driver', 'name avatar averageRating totalRatings vehicleDetails gender')
            .sort({ date: 1, time: 1 });

        if (rides.length === 0 && (effectiveFrom || trimmedTo)) {
            const fallbackRides = await Ride.find(baseQuery)
                .populate('driver', 'name avatar averageRating totalRatings vehicleDetails gender')
                .sort({ date: 1, time: 1 });

            rides = fallbackRides.filter((ride) => {
                if (effectiveFrom && !isFuzzyMatch(effectiveFrom, ride.pickupLocation)) return false;
                if (trimmedTo && !isFuzzyMatch(trimmedTo, ride.dropoffLocation)) return false;
                return true;
            });
        }

        const ridesWithMatchMetadata = rides
            .map((ride) => {
                const match = scoreRideMatch({
                    ride,
                    from: trimmedFrom,
                    to: trimmedTo,
                    userArea: profileArea
                });

                return {
                    ...ride.toObject(),
                    matchScore: match.score,
                    matchReasons: match.reasons
                };
            })
            .sort((a, b) => {
                if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
                const aDate = new Date(`${a.date} ${a.time || '00:00'}`).getTime() || 0;
                const bDate = new Date(`${b.date} ${b.time || '00:00'}`).getTime() || 0;
                return aDate - bDate;
            });

        res.json(ridesWithMatchMetadata);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Request to join a ride
// @route   POST /api/rides/:id/join
// @access  Private
export const requestRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.driver.toString() === req.user.id) {
            return res.status(400).json({ message: 'You cannot join your own ride' });
        }

        if (ride.seatsAvailable <= 0) {
            return res.status(400).json({ message: 'Ride is full' });
        }

        // Check if already joined
        const alreadyJoined = ride.passengers.some(p => p.user.toString() === req.user.id);
        if (alreadyJoined) {
            return res.status(400).json({ message: 'You have already requested to join this ride' });
        }

        // Add passenger
        ride.passengers.push({
            user: req.user.id,
            requestedAt: new Date(),
            status: 'pending', // Or 'accepted' if auto-approve
            seatsBooked: 1
        });

        await ride.save();

        // Notify Driver
        const io = req.app.get('io');
        try {
            await createNotification(io, {
                recipient: ride.driver,
                type: 'ride_request',
                title: 'New Ride Request',
                message: `${req.user.name} wants to join your ride from ${ride.pickupLocation} to ${ride.dropoffLocation}.`,
                link: '/rider/manage',
                sender: req.user.id
            });
        } catch (notificationErr) {
            console.error('Failed to notify driver about new ride request:', notificationErr.message);
        }

        res.json({ message: 'Request sent successfully', ride });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update ride status (Driver only)
// @route   PUT /api/rides/:id/status
// @access  Private
export const updateRideStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.driver.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const previousStatus = ride.status;
        ride.status = status;
        await ride.save();

        // Notify passengers on critical state changes.
        if (previousStatus !== status && (status === 'completed' || status === 'cancelled')) {
            const io = req.app.get('io');
            let recipients = [];

            if (status === 'completed') {
                recipients = ride.passengers
                    .filter((p) => p.status === 'accepted')
                    .map((p) => p.user.toString());
            } else {
                recipients = ride.passengers
                    .filter((p) => p.status !== 'rejected')
                    .map((p) => p.user.toString());
            }

            const uniqueRecipients = [...new Set(recipients)];
            await Promise.all(
                uniqueRecipients.map((recipient) =>
                    createNotification(io, {
                        recipient,
                        type: status === 'completed' ? 'ride_completed' : 'ride_cancelled',
                        title: status === 'completed' ? 'Ride Completed' : 'Ride Cancelled',
                        message:
                            status === 'completed'
                                ? `Your ride from ${ride.pickupLocation} to ${ride.dropoffLocation} has been marked completed.`
                                : `Your ride from ${ride.pickupLocation} to ${ride.dropoffLocation} has been cancelled by the rider.`,
                        link: '/passenger/bookings',
                        sender: req.user.id
                    }).catch((notificationErr) => {
                        console.error(`Failed to notify passenger ${recipient}:`, notificationErr.message);
                    })
                )
            );
        }

        res.json(ride);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get ride details
// @route   GET /api/rides/:id
// @access  Private
export const getRideById = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id)
            .populate('driver', 'name email averageRating vehicleDetails')
            .populate('passengers.user', 'name email');

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        res.json(ride);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get rides for current user (as driver or passenger)
// @route   GET /api/rides/my
// @access  Private
export const getMyRides = async (req, res) => {
    try {
        let query;

        if (req.user.role === 'rider') {
            // Rides I created as a driver
            query = { driver: req.user.id };
        } else {
            // Rides I joined as a passenger
            query = { 'passengers.user': req.user.id };
        }

        const rides = await Ride.find(query)
            .populate('driver', 'name vehicleDetails averageRating gender')
            .populate('passengers.user', 'name email')
            .sort({ date: -1, time: -1 });

        res.json(rides);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update passenger status (Accept/Reject)
// @route   PUT /api/rides/:id/passengers/:passengerId/status
// @access  Private (Rider only)
export const updatePassengerStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id, passengerId } = req.params;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const ride = await Ride.findById(id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.driver.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const passenger = ride.passengers.id(passengerId);
        if (!passenger) {
            return res.status(404).json({ message: 'Passenger request not found' });
        }

        // If accepting, check seats and update seatsAvailable
        if (status === 'accepted' && passenger.status !== 'accepted') {
            if (ride.seatsAvailable < passenger.seatsBooked) {
                return res.status(400).json({ message: 'Not enough seats available' });
            }
            ride.seatsAvailable -= passenger.seatsBooked;
        }

        // If rejecting an already accepted passenger, free up seats
        if (status === 'rejected' && passenger.status === 'accepted') {
            ride.seatsAvailable += passenger.seatsBooked;
        }

        passenger.status = status;
        await ride.save();

        // Notify Passenger
        const io = req.app.get('io');
        const isAccepted = status === 'accepted';
        try {
            await createNotification(io, {
                recipient: passenger.user,
                type: isAccepted ? 'ride_accepted' : 'ride_rejected',
                title: isAccepted ? 'Ride Request Accepted!' : 'Ride Request Rejected',
                message: isAccepted
                    ? `Pack your bags! Your request for the ride to ${ride.dropoffLocation} has been accepted.`
                    : `Sorry, your request for the ride to ${ride.dropoffLocation} was not accepted this time.`,
                link: '/passenger/bookings',
                sender: req.user.id
            });
        } catch (notificationErr) {
            console.error('Failed to notify passenger about request update:', notificationErr.message);
        }

        res.json(ride);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Rate rider for a completed ride (Passenger only)
// @route   POST /api/rides/:id/rate
// @access  Private
export const rateRide = async (req, res) => {
    try {
        const ratingValue = Number(req.body?.rating);
        if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
            return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
        }

        const ride = await Ride.findById(req.params.id);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.status !== 'completed') {
            return res.status(400).json({ message: 'You can only rate completed rides' });
        }

        const passenger = ride.passengers.find(
            (p) => p.user.toString() === req.user.id
        );

        if (!passenger) {
            return res.status(403).json({ message: 'Not authorized to rate this ride' });
        }

        if (passenger.status !== 'accepted') {
            return res.status(400).json({ message: 'Only accepted passengers can rate this ride' });
        }

        if (passenger.rating) {
            return res.status(400).json({ message: 'You have already rated this ride' });
        }

        passenger.rating = ratingValue;
        passenger.ratedAt = new Date();

        const driver = await User.findById(ride.driver);
        if (driver) {
            const totalRatings = Number(driver.totalRatings || 0);
            const currentAverage = Number(driver.averageRating || 0);
            const newAverage = ((currentAverage * totalRatings) + ratingValue) / (totalRatings + 1);
            driver.totalRatings = totalRatings + 1;
            driver.averageRating = Number(newAverage.toFixed(2));
            await driver.save();
        }

        await ride.save();

        res.json(ride);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
