import mongoose from 'mongoose';

const adminSettingsSchema = new mongoose.Schema({
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    strictVerification: {
        type: Boolean,
        default: true
    },
    emailAlerts: {
        type: Boolean,
        default: true
    },
    internalAlerts: {
        type: Boolean,
        default: true
    },
    serviceFeePercent: {
        type: Number,
        default: 5,
        min: 0,
        max: 100
    },
    analyticsResetAt: {
        type: Date,
        default: null
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);

export default AdminSettings;
