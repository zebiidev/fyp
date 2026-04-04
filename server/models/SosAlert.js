import mongoose from 'mongoose';

const sosAlertSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['passenger', 'rider', 'admin'],
        default: 'passenger'
    },
    message: {
        type: String,
        trim: true,
        default: ''
    },
    location: {
        lat: { type: Number },
        lng: { type: Number },
        accuracy: { type: Number }
    },
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride'
    },
    status: {
        type: String,
        enum: ['open', 'acknowledged', 'resolved'],
        default: 'open'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const SosAlert = mongoose.model('SosAlert', sosAlertSchema);

export default SosAlert;
