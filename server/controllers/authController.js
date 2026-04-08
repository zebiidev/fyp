import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    const { name, email, password, role, registrationNumber } = req.body;
    const normalizedReg = registrationNumber ? registrationNumber.toString().trim().toUpperCase() : '';

    try {
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Check if registration number is already used
        if (normalizedReg) {
            const regExists = await User.findOne({ registrationNumber: normalizedReg });
            if (regExists) {
                return res.status(400).json({ message: 'Registration number already registered' });
            }
        }

        // Manual Hashing before creation
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            registrationNumber: normalizedReg,
            accountStatus: 'pending' // Default to pending
        });

        const shouldIssueToken = user.role === 'admin' || user.accountStatus === 'approved';
        const token = shouldIssueToken ? generateToken(user._id) : null;

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus
            },
            message: shouldIssueToken
                ? 'Account created'
                : 'Account created. Please wait for admin approval before logging in.'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check for user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check Account Status
        if (user.role !== 'admin' && user.accountStatus !== 'approved') {
            return res.status(403).json({
                message: `Your account is currently ${user.accountStatus}. Please wait for admin approval.`
            });
        }
        if (user.role !== 'admin' && user.isBlocked) {
            return res.status(403).json({
                message: 'Your account has been blocked. Please contact support.'
            });
        }

        const token = generateToken(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update current user's profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const allowedFields = [
            'name',
            'phoneNumber',
            'department',
            'programme',
            'semester',
            'emergencyContact',
            'emergencyName',
            'cnic',
            'address',
            'gender',
            'avatar'
        ];
        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        // Rider specific vehicle details
        if (req.user.role === 'rider' && req.body.vehicleDetails) {
            updates.vehicleDetails = {
                ...req.user.vehicleDetails,
                ...req.body.vehicleDetails
            };
        }
        if (req.user.role === 'rider' && req.body.verificationDocuments) {
            updates.verificationDocuments = req.body.verificationDocuments;
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
