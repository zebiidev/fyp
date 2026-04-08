import mongoose from 'mongoose';

const registrationNumberSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    status: {
        type: String,
        enum: ['valid', 'used', 'revoked'],
        default: 'valid'
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    usedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

const RegistrationNumber = mongoose.model('RegistrationNumber', registrationNumberSchema);

export default RegistrationNumber;
