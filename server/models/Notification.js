import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    type: {
        type: String,
        enum: [
            'ride_request',
            'ride_accepted',
            'ride_rejected',
            'ride_completed',
            'ride_cancelled',
            'system',
            'sos_alert'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String, // e.g., /passenger/bookings or /rider/manage
        required: false
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

// Speeds up: notifications list and unread counts.
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;
