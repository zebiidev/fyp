import Message from '../models/Message.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// @desc    Get chat history with a specific user
// @route   GET /api/chat/:userId
// @access  Private
export const getChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const myId = req.user.id;

        const messages = await Message.find({
            $or: [
                { sender: myId, recipient: userId },
                { sender: userId, recipient: myId }
            ]
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get list of conversations (users chatted with)
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res) => {
    try {
        const myId = req.user.id;

        const myObjectId = new mongoose.Types.ObjectId(myId);

        // Use an aggregation pipeline to avoid loading all messages into memory.
        // Returns latest message per conversation partner.
        const latestPerUser = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: myObjectId }, { recipient: myObjectId }]
                }
            },
            {
                $addFields: {
                    otherUser: {
                        $cond: [{ $eq: ['$sender', myObjectId] }, '$recipient', '$sender']
                    }
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$otherUser',
                    lastMessage: { $first: '$$ROOT' }
                }
            },
            { $sort: { 'lastMessage.createdAt': -1 } },
            { $limit: 50 }
        ]);

        const userIds = latestPerUser.map((row) => row._id);
        const users = await User.find({ _id: { $in: userIds } })
            .select('name email role avatar')
            .lean();

        const userById = new Map(users.map((u) => [String(u._id), u]));

        const conversations = latestPerUser
            .map((row) => {
                const user = userById.get(String(row._id));
                if (!user) return null;

                const msg = row.lastMessage || {};
                const lastMessage =
                    msg.messageType === 'image' ? '[Image]' : (typeof msg.text === 'string' ? msg.text : '');

                return {
                    user,
                    lastMessage,
                    time: msg.createdAt || null,
                    unread: 0
                };
            })
            .filter(Boolean);

        res.json(conversations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get primary admin contact
// @route   GET /api/chat/admin
// @access  Private
export const getAdminContact = async (req, res) => {
    try {
        const adminUser = await User.findOne({ role: 'admin' }).select('name email role avatar');
        if (!adminUser) {
            return res.status(404).json({ message: 'Admin user not found' });
        }
        res.json({ user: adminUser });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a message sent by current user
// @route   DELETE /api/chat/message/:messageId
// @access  Private
export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const myId = req.user.id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        if (message.sender.toString() !== myId) {
            return res.status(403).json({ message: 'You can only delete your own messages' });
        }

        const recipientId = message.recipient.toString();
        await Message.deleteOne({ _id: messageId });

        const io = req.app.get('io');
        if (io) {
            const payload = {
                messageId: messageId.toString(),
                sender: myId,
                recipient: recipientId
            };
            io.to(`user:${myId}`).emit('message_deleted', payload);
            io.to(`user:${recipientId}`).emit('message_deleted', payload);
        }

        res.json({ message: 'Message deleted', messageId });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
