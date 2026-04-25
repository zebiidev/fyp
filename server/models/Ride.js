import mongoose from 'mongoose';

const rideSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    passengers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        requestedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        ratedAt: {
            type: Date
        },
        seatsBooked: {
            type: Number,
            default: 1
        }
    }],
    pickupLocation: {
        type: String,
        required: true,
        trim: true
    },
    dropoffLocation: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    seatsAvailable: {
        type: Number,
        required: true,
        min: 0
    },
    pricePerSeat: {
        type: Number,
        required: true,
        min: 0
    },
    vehicle: {
        make: String,
        model: String,
        plateNumber: String,
        color: String
    },
    status: {
        type: String,
        enum: ['scheduled', 'active', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Ride = mongoose.model('Ride', rideSchema);

export default Ride;
