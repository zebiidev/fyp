import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride'
    },
    againstUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    againstRole: {
        type: String,
        enum: ['passenger', 'rider', 'admin', 'other']
    },
    againstText: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'Ride Issue',
            'Driver Behavior',
            'App Bug',
            'Payment',
            'Other',
            'Passenger Behavior',
            'Route Issue',
            'Vehicle Issue',
            'Safety'
        ]
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
        default: 'Pending'
    },
    adminResponse: {
        type: String
    },
    ticketId: {
        type: String,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Generate Ticket ID
complaintSchema.pre('save', function () {
    if (!this.ticketId) {
        this.ticketId = 'TKT-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
    }
    this.updatedAt = Date.now();
});

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
