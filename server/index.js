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

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for now (dev)
        methods: ["GET", "POST"]
    }
});

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Unauthorized'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id.toString();
        next();
    } catch (error) {
        next(new Error('Unauthorized'));
    }
});
app.set('io', io);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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

    socket.on('disconnect', () => {
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
