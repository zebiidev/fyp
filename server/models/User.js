import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['passenger', 'rider', 'admin'],
        default: 'passenger'
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    registrationNumber: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    department: {
        type: String,
        trim: true
    },
    programme: {
        type: String,
        trim: true
    },
    semester: {
        type: String,
        trim: true
    },
    emergencyContact: {
        type: String,
        trim: true
    },
    emergencyName: {
        type: String,
        trim: true
    },
    cnic: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        trim: true
    },
    accountStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    // For Riders
    vehicleDetails: {
        type: {
            type: String,
            trim: true
        },
        make: String,
        model: String,
        plateNumber: String,
        color: String,
        images: [String] // Array of vehicle image URLs
    },
    avatar: {
        type: String,
        default: ''
    },
    verificationDocuments: [{
        url: {
            type: String, // URL of the document
            trim: true
        },
        status: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        }
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compare password method - Keep this for login
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data when returning JSON
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;
