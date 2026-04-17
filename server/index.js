import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';

// Import Routes
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaint.js';
import chatRoutes from './routes/chat.js';
import rideRoutes from './routes/ride.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import notificationRoutes from './routes/notification.js';
import sosRoutes from './routes/sos.js';

import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from './models/Message.js';
import User from './models/User.js';
import Ride from './models/Ride.js';

const app = express();
const httpServer = createServer(app);
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
].filter(Boolean);

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Unauthorized'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('role isBlocked');
        if (!user) return next(new Error('Unauthorized'));
        if (user.role !== 'admin' && user.isBlocked) return next(new Error('Blocked'));
        socket.userId = decoded.id.toString();
        next();
    } catch (error) {
        next(new Error('Unauthorized'));
    }
});
app.set('io', io);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Database Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sos', sosRoutes);

// Socket.io Logic
let onlineUsers = new Map(); // userId -> socketId
const liveRideLocations = new Map(); // rideId -> { lat, lng, updatedAt, publisherId }
const socketPublishedRides = new Map(); // socketId -> Set<rideId>

const normalizeRideId = (value) => String(value || '').trim();

const getRideTrackingAccess = async (rideId, userId) => {
    const normalizedRideId = normalizeRideId(rideId);
    if (!normalizedRideId || !userId) return null;

    const ride = await Ride.findById(normalizedRideId).select('driver passengers status');
    if (!ride) return null;

    const isDriver = String(ride.driver) === String(userId);
    const isAcceptedPassenger = (ride.passengers || []).some(
        (passenger) => String(passenger.user) === String(userId) && passenger.status === 'accepted'
    );

    return {
        ride,
        rideId: normalizedRideId,
        isDriver,
        isAcceptedPassenger
    };
};

const clearPublishedRide = (rideId) => {
    const normalizedRideId = normalizeRideId(rideId);
    if (!normalizedRideId) return;

    liveRideLocations.delete(normalizedRideId);
    io.to(`ride:${normalizedRideId}`).emit('tracking_stopped', { rideId: normalizedRideId });
};

io.on('connection', (socket) => {

    // User joins after token auth
    socket.on('join_chat', () => {
        onlineUsers.set(socket.userId, socket.id);
        socket.join(`user:${socket.userId}`);
        io.emit('online_users', Array.from(onlineUsers.keys()));
    });

    // Send Message
    socket.on('send_message', async (data) => {
        const { recipient, text, imageUrl, messageType } = data;
        const sender = socket.userId;
        const cleanText = typeof text === 'string' ? text.trim() : '';
        const cleanImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
        const resolvedType = messageType === 'image' || cleanImageUrl ? 'image' : 'text';

        if (!sender || !recipient || (!cleanText && !cleanImageUrl)) return;

        // Save to DB
        try {
            const newMessage = await Message.create({
                sender,
                recipient,
                text: cleanText,
                messageType: resolvedType,
                imageUrl: cleanImageUrl,
                read: false
            });

            // Emit to recipient if online
            const recipientSocket = onlineUsers.get(recipient);
            if (recipientSocket) {
                io.to(recipientSocket).emit('receive_message', newMessage);
            }

            // Emit back to sender so sender UI stays in sync without optimistic state.
            io.to(socket.id).emit('receive_message', newMessage);

        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    socket.on('join_ride_tracking', (payload) => {
        const rideId = normalizeRideId(payload?.rideId);
        if (!rideId) return;

        getRideTrackingAccess(rideId, socket.userId)
            .then((access) => {
                if (!access) {
                    socket.emit('tracking_error', { rideId, message: 'Ride not found.' });
                    return;
                }

                if (!access.isDriver && !access.isAcceptedPassenger) {
                    socket.emit('tracking_error', { rideId, message: 'Not authorized to view this ride.' });
                    return;
                }

                if (access.ride.status !== 'active') {
                    socket.emit('tracking_error', { rideId, message: 'Live tracking is only available for active rides.' });
                    return;
                }

                socket.join(`ride:${rideId}`);

                const lastKnownLocation = liveRideLocations.get(rideId);
                if (lastKnownLocation) {
                    socket.emit('ride_location_update', {
                        rideId,
                        lat: lastKnownLocation.lat,
                        lng: lastKnownLocation.lng,
                        updatedAt: lastKnownLocation.updatedAt
                    });
                }
            })
            .catch((error) => {
                console.error('Failed to authorize ride tracking join:', error);
                socket.emit('tracking_error', { rideId, message: 'Unable to join live tracking right now.' });
            });
    });

    socket.on('leave_ride_tracking', (payload) => {
        const rideId = normalizeRideId(payload?.rideId);
        if (rideId) {
            socket.leave(`ride:${rideId}`);
        }
    });

    socket.on('stop_ride_tracking', async (payload) => {
        const rideId = normalizeRideId(payload?.rideId);
        if (!rideId) return;

        try {
            const access = await getRideTrackingAccess(rideId, socket.userId);
            if (!access?.isDriver) return;

            clearPublishedRide(rideId);

            const publishedRides = socketPublishedRides.get(socket.id);
            if (publishedRides) {
                publishedRides.delete(rideId);
                if (publishedRides.size === 0) {
                    socketPublishedRides.delete(socket.id);
                }
            }
        } catch (error) {
            console.error('Failed to stop ride tracking:', error);
        }
    });

    socket.on('ride_location_update', async (payload) => {
        const rideId = normalizeRideId(payload?.rideId);
        const lat = Number(payload?.lat);
        const lng = Number(payload?.lng);

        if (!rideId || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

        try {
            const access = await getRideTrackingAccess(rideId, socket.userId);
            if (!access?.isDriver || access.ride.status !== 'active') {
                socket.emit('tracking_error', { rideId, message: 'Not authorized to publish ride location.' });
                return;
            }

            liveRideLocations.set(rideId, {
                lat,
                lng,
                updatedAt: new Date().toISOString(),
                publisherId: socket.userId
            });

            const publishedRides = socketPublishedRides.get(socket.id) || new Set();
            publishedRides.add(rideId);
            socketPublishedRides.set(socket.id, publishedRides);

            io.to(`ride:${rideId}`).emit('ride_location_update', {
                rideId,
                lat,
                lng,
                updatedAt: liveRideLocations.get(rideId).updatedAt
            });
        } catch (error) {
            console.error('Failed to publish ride location:', error);
            socket.emit('tracking_error', { rideId, message: 'Unable to share ride location right now.' });
        }
    });

    socket.on('disconnect', () => {
        const publishedRides = socketPublishedRides.get(socket.id);
        if (publishedRides) {
            publishedRides.forEach((rideId) => clearPublishedRide(rideId));
            socketPublishedRides.delete(socket.id);
        }

        // Remove user from onlineUsers
        for (let [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                break;
            }
        }
        io.emit('online_users', Array.from(onlineUsers.keys()));
    });
});

app.get('/', (req, res) => {
    res.send('Smart Campus Ride Sharing API is running');
});

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
