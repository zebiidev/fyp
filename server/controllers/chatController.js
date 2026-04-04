import Message from '../models/Message.js';
import User from '../models/User.js';

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

        // Find all messages where user is sender or recipient
        const messages = await Message.find({
            $or: [{ sender: myId }, { recipient: myId }]
        }).sort({ createdAt: -1 });

        // Extract unique user IDs
        const userIds = new Set();
        messages.forEach(msg => {
            if (msg.sender.toString() !== myId) userIds.add(msg.sender.toString());
            if (msg.recipient.toString() !== myId) userIds.add(msg.recipient.toString());
        });

        // Get user details
        const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('name email role');

        // Map users to conversation format (add last message info if needed)
        const conversations = users.map(user => {
            const lastMsg = messages.find(m =>
                (m.sender.toString() === user._id.toString() && m.recipient.toString() === myId) ||
                (m.sender.toString() === myId && m.recipient.toString() === user._id.toString())
            );

            return {
                user,
                lastMessage: lastMsg
                    ? (lastMsg.messageType === 'image' ? '[Image]' : (lastMsg.text || ''))
                    : '',
                time: lastMsg ? lastMsg.createdAt : null,
                unread: 0 // logic for unread count can be added later
            };
        });

        res.json(conversations);
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
