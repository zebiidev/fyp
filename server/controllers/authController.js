import dotenv from 'dotenv';

dotenv.config();

import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import SibApiV3Sdk from 'sib-api-v3-sdk';
// Initialize Brevo (Sendinblue) API client
SibApiV3Sdk.ApiClient.instance.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
const brevoApiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
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
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedReg = registrationNumber ? registrationNumber.toString().trim().toUpperCase() : '';

    try {
        const orClauses = [{ email: normalizedEmail }];
        if (normalizedReg) orClauses.push({ registrationNumber: normalizedReg });

        const existing = await User.findOne({ $or: orClauses }).select('email registrationNumber');
        if (existing) {
            if (existing.email === normalizedEmail) {
                return res.status(400).json({ message: 'User already exists' });
            }
            if (normalizedReg && existing.registrationNumber === normalizedReg) {
                return res.status(400).json({ message: 'Registration number already registered' });
            }
            return res.status(400).json({ message: 'Account already exists' });
        }

        const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = await User.create({
            name,
            email: normalizedEmail,
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
        const normalizedEmail = String(email || '').trim().toLowerCase();
        // Check for user
        const user = await User.findOne({ email: normalizedEmail }).select('-__v');

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

        const userResponse = user.toObject();
        delete userResponse.password;
        userResponse.id = userResponse._id;

        res.json({
            token,
            user: userResponse
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

        const existingUser = await User.findById(req.user.id).select('role vehicleDetails verificationDocuments');
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

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

        if (
            existingUser.role === 'rider' &&
            (req.body.vehicleDetails !== undefined || req.body.verificationDocuments !== undefined)
        ) {
            const nextVehicleDetails = {
                ...(existingUser.vehicleDetails || {}),
                ...(req.body.vehicleDetails || {})
            };
            const nextVerificationDocuments =
                req.body.verificationDocuments !== undefined
                    ? req.body.verificationDocuments
                    : existingUser.verificationDocuments;

            const missing = [];
            const hasText = (v) => typeof v === 'string' && v.trim().length > 0;

            if (!hasText(nextVehicleDetails.type)) missing.push('vehicle type');
            if (!hasText(nextVehicleDetails.make)) missing.push('vehicle make');
            if (!hasText(nextVehicleDetails.model)) missing.push('vehicle model');
            if (!hasText(nextVehicleDetails.plateNumber)) missing.push('plate number');

            const images = Array.isArray(nextVehicleDetails.images) ? nextVehicleDetails.images.filter(hasText) : [];
            if (images.length < 2) missing.push('vehicle images (vehicle + number plate)');

            const docs = Array.isArray(nextVerificationDocuments) ? nextVerificationDocuments : [];
            const hasDocUrl = docs.some((d) => hasText(d?.url));
            if (!hasDocUrl) missing.push('driving license image');

            if (missing.length) {
                return res.status(400).json({
                    message: `Incomplete vehicle verification details. Missing: ${missing.join(', ')}.`
                });
            }
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
/*
 * @desc    Request password reset (send email with token)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    try {
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(200).json({ message: 'If the email is registered, a reset link has been sent.' });
        }
        const crypto = await import('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = await bcrypt.hash(resetToken, 10);
        user.resetPasswordToken = resetTokenHash;
        user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
        await user.save();

        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&id=${user._id}`;
        console.log('Brevo config - API_KEY:', !!process.env.BREVO_API_KEY, 'SENDER_EMAIL:', !!process.env.BREVO_SENDER_EMAIL);
        if (process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL) {
            try {
                const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
                sendSmtpEmail.subject = 'Password Reset Request';
                sendSmtpEmail.htmlContent = `<p>Hello,</p><p>You requested a password reset. Click the link below to set a new password (valid for 1 hour):</p><a href="${resetUrl}">Reset Password</a>`;
                sendSmtpEmail.sender = { email: process.env.BREVO_SENDER_EMAIL };
                sendSmtpEmail.to = [{ email: normalizedEmail }];
                const response = await brevoApiInstance.sendTransacEmail(sendSmtpEmail);
                console.log('Brevo email send response:', response);
            } catch (emailErr) {
                console.error('Brevo email send error:', emailErr);
            }
        } else {
            console.warn('Brevo API key or sender email not set – skipping email send');
        }
        console.log('Password reset URL:', resetUrl);
        return res.status(200).json({ message: 'If the email is registered, a reset link has been sent.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/*
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
    const { token, userId, newPassword } = req.body;
    if (!token || !userId || !newPassword) {
        return res.status(400).json({ message: 'Invalid request.' });
    }
    try {
        const user = await User.findById(userId);
        if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }
        if (user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: 'Token has expired.' });
        }
        const isMatch = await bcrypt.compare(token, user.resetPasswordToken);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid token.' });
        }
        // Update password
        const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
        user.password = await bcrypt.hash(newPassword, saltRounds);
        // Clear reset fields
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();
        return res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

