import mongoose from 'mongoose';

const adminAuditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        trim: true
    },
    details: {
        type: String,
        default: ''
    },
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);

export default AdminAuditLog;
