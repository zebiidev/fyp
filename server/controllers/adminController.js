import User from '../models/User.js';
import Ride from '../models/Ride.js';
import Complaint from '../models/Complaint.js';
import AdminSettings from '../models/AdminSettings.js';
import { sendApprovalEmail, sendRejectionEmail } from '../utils/emailService.js';
import { createNotification } from './notificationController.js';

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalRiders = await User.countDocuments({ role: 'rider' });
        const totalPassengers = await User.countDocuments({ role: 'passenger' });

        const activeRides = await Ride.countDocuments({ status: { $in: ['active', 'scheduled'] } });
        const pendingVerifications = await User.countDocuments({ role: 'rider', accountStatus: 'approved', isVerified: false });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const recentComplaints = await Complaint.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name');

        res.json({
            totalUsers,
            totalRiders,
            totalPassengers,
            activeRides,
            pendingVerifications,
            recentComplaints
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get System Analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
export const getSystemAnalytics = async (req, res) => {
    try {
        const settings = await AdminSettings.findOne().select('analyticsResetAt');
        const rideMatch = settings?.analyticsResetAt
            ? { createdAt: { $gte: settings.analyticsResetAt } }
            : {};

        const popularDestinations = await Ride.aggregate([
            ...(Object.keys(rideMatch).length ? [{ $match: rideMatch }] : []),
            { $group: { _id: "$dropoffLocation", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const rideStatusBreakdown = await Ride.aggregate([
            ...(Object.keys(rideMatch).length ? [{ $match: rideMatch }] : []),
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const userRoleBreakdown = await User.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);

        res.json({
            popularDestinations,
            rideStatusBreakdown,
            userRoleBreakdown
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get Pending Rider Verifications
// @route   GET /api/admin/riders/pending-verifications
// @access  Private (Admin)
export const getPendingRiderVerifications = async (req, res) => {
    try {
        const riders = await User.find({
            role: 'rider',
            accountStatus: 'approved',
            isVerified: false
        }).select('-password');

        res.json(riders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Verify/Reject Rider Documents
// @route   PUT /api/admin/riders/:id/verify
// @access  Private (Admin)
export const verifyRider = async (req, res) => {
    try {
        const { status } = req.body; // approved | rejected
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role !== 'rider') {
            return res.status(400).json({ message: 'Only riders can be verified here' });
        }

        if (status === 'approved') {
            user.isVerified = true;
            if (Array.isArray(user.verificationDocuments)) {
                user.verificationDocuments = user.verificationDocuments.map((doc) => ({
                    ...doc.toObject?.() ?? doc,
                    status: 'verified'
                }));
            }
        } else if (status === 'rejected') {
            user.isVerified = false;
            if (Array.isArray(user.verificationDocuments)) {
                user.verificationDocuments = user.verificationDocuments.map((doc) => ({
                    ...doc.toObject?.() ?? doc,
                    status: 'rejected'
                }));
            }
        } else {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        await user.save();
        res.json({ message: `Rider verification ${status}`, user: user.toJSON() });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get Pending Users
// @route   GET /api/admin/users/pending
// @access  Private (Admin)
export const getPendingUsers = async (req, res) => {
    try {
        const users = await User.find({ accountStatus: 'pending' }).select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update User Status (Approve/Reject)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
export const updateUserStatus = async (req, res) => {
    const { status, reason } = req.body; // status: 'approved' or 'rejected'

    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.accountStatus = status;
        if (status === 'approved') {
            if (user.role !== 'rider') {
                user.isVerified = true;
            } else {
                user.isVerified = false;
            }
            await sendApprovalEmail(user.email, user.name);
        } else if (status === 'rejected') {
            user.isVerified = false;
            await sendRejectionEmail(user.email, user.name, reason || 'Account rejected by admin.');
        }

        await user.save();

        // In-App Notification
        const io = req.app.get('io');
        const isApproved = status === 'approved';
        try {
            await createNotification(io, {
                recipient: user._id,
                type: 'system',
                title: isApproved ? 'Account Approved!' : 'Account Update',
                message: isApproved
                    ? 'Welcome to RideShare! Your account has been verified and approved.'
                    : `Your account application was not approved. Reason: ${reason || 'Contact support for details.'}`,
                link: isApproved ? '/home' : '/login'
            });
        } catch (notificationErr) {
            console.error('Failed to notify user about account status update:', notificationErr.message);
        }

        res.json({ message: `User ${status}`, user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get All Users (Paginated)
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const role = req.query.role;
    const search = req.query.search;

    try {
        const query = { role: { $ne: 'admin' } };
        if (role && role !== 'all') {
            query.role = role;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { registrationNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        res.json({
            users,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Optional: Clean up related data
        await Ride.deleteMany({ driver: user._id });
        await Complaint.deleteMany({ user: user._id });
        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User and all associated data deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
