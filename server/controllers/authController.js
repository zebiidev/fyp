import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const ADDRESS_STOP_WORDS = new Set([
    'house', 'home', 'street', 'st', 'road', 'rd', 'lane', 'ln', 'sector',
    'phase', 'plot', 'flat', 'apt', 'apartment', 'near', 'opposite', 'opp',
    'behind', 'beside', 'block', 'blk', 'no', 'number'
]);

const normalizeAddress = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const extractAreaTokens = (address) => {
    const normalized = normalizeAddress(address);
    if (!normalized) return [];

    const cleanedTokens = normalized
        .split(' ')
        .filter(Boolean)
        .filter((token) => !/^\d+[a-z]*$/i.test(token))
        .filter((token) => token.length > 1)
        .filter((token) => !ADDRESS_STOP_WORDS.has(token));

    return [...new Set(cleanedTokens.slice(-4))];
};

const formatAreaLabel = (tokens) =>
    tokens
        .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
        .join(' ');

const getAreaMatch = (sourceAddress, candidateAddress) => {
    const sourceTokens = extractAreaTokens(sourceAddress);
    const candidateTokens = extractAreaTokens(candidateAddress);

    if (!sourceTokens.length || !candidateTokens.length) {
        return { isMatch: false, score: 0, sharedTokens: [], sourceLabel: '', candidateLabel: '' };
    }

    const candidateSet = new Set(candidateTokens);
    const sharedTokens = sourceTokens.filter((token) => candidateSet.has(token));
    const unionSize = new Set([...sourceTokens, ...candidateTokens]).size;
    const overlapRatio = unionSize > 0 ? sharedTokens.length / unionSize : 0;
    const subsetMatch =
        sharedTokens.length > 0 &&
        (sharedTokens.length === sourceTokens.length || sharedTokens.length === candidateTokens.length);

    return {
        isMatch: sharedTokens.length >= 2 || subsetMatch || overlapRatio >= 0.5,
        score: Math.min(
            100,
            Math.round((sharedTokens.length / Math.max(sourceTokens.length, candidateTokens.length)) * 100)
        ),
        sharedTokens,
        sourceLabel: formatAreaLabel(sourceTokens),
        candidateLabel: formatAreaLabel(candidateTokens)
    };
};

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

// @desc    Get approved riders from the same area as the logged-in passenger
// @route   GET /api/auth/riders-from-area
// @access  Private (Passenger only)
export const getRidersFromArea = async (req, res) => {
    try {
        if (req.user.role !== 'passenger') {
            return res.status(403).json({ message: 'Only passengers can view riders from their area.' });
        }

        const passenger = await User.findById(req.user.id).select('address');
        const passengerAddress = String(passenger?.address || '').trim();

        if (!passengerAddress) {
            return res.status(400).json({ message: 'Add your address first to view riders from your area.' });
        }

        const riders = await User.find({
            role: 'rider',
            accountStatus: 'approved',
            isBlocked: false,
            address: { $exists: true, $ne: '' },
            _id: { $ne: req.user.id }
        }).select('name email registrationNumber department programme semester gender address avatar averageRating totalRatings vehicleDetails');

        const matchedRiders = riders
            .map((rider) => {
                const areaMatch = getAreaMatch(passengerAddress, rider.address);
                if (!areaMatch.isMatch) return null;

                return {
                    ...rider.toObject(),
                    areaMatch: {
                        score: areaMatch.score,
                        sharedTokens: areaMatch.sharedTokens,
                        passengerArea: areaMatch.sourceLabel,
                        riderArea: areaMatch.candidateLabel
                    }
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                if (b.areaMatch.score !== a.areaMatch.score) return b.areaMatch.score - a.areaMatch.score;
                return (b.averageRating || 0) - (a.averageRating || 0);
            });

        res.json({
            passengerAddress,
            passengerArea: formatAreaLabel(extractAreaTokens(passengerAddress)),
            riders: matchedRiders
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
