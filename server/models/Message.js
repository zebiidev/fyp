import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        default: ''
    },
    messageType: {
        type: String,
        enum: ['text', 'image'],
        default: 'text'
    },
    imageUrl: {
        type: String,
        default: ''
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Speeds up: chat history, conversations list, and unread checks.
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, read: 1, createdAt: -1 });

messageSchema.pre('validate', function () {
    const hasText = typeof this.text === 'string' && this.text.trim().length > 0;
    const hasImage = typeof this.imageUrl === 'string' && this.imageUrl.trim().length > 0;

    if (!hasText && !hasImage) {
        this.invalidate('text', 'Message must include text or image');
    }
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
