import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AdminAuditLog from '../models/AdminAuditLog.js';

const logAdminAction = async ({ action, details = '', actor }) => {
    try {
        await AdminAuditLog.create({
            action,
            details,
            actor
        });
    } catch (err) {
        console.error('Failed to write admin audit log:', err.message);
    }
};

const generateAdminRegNo = async () => {
    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    const regNo = `ADMIN-${token}`;
    const exists = await User.findOne({ registrationNumber: regNo });
    if (exists) {
        return `ADMIN-${Date.now().toString().slice(-6)}`;
    }
    return regNo;
};

// @desc    Get all admins
// @route   GET /api/admin/admins
// @access  Private (Admin)
export const getAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' })
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(admins);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create a new admin
// @route   POST /api/admin/admins
// @access  Private (Admin)
export const createAdmin = async (req, res) => {
    const { name, email, password, registrationNumber } = req.body;

    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email is already in use.' });
        }

        const regNo = registrationNumber?.trim() || await generateAdminRegNo();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'admin',
            registrationNumber: regNo,
            accountStatus: 'approved',
            isVerified: true
        });

        await logAdminAction({
            action: 'CREATE_ADMIN',
            details: `Admin created: ${admin.name} (${admin.email})`,
            actor: req.user?._id
        });

        res.status(201).json(admin.toJSON());
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Promote existing user to admin
// @route   PUT /api/admin/admins/:id/promote
// @access  Private (Admin)
export const promoteToAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'User is already an admin.' });
        }

        user.role = 'admin';
        user.accountStatus = 'approved';
        user.isVerified = true;
        await user.save();

        await logAdminAction({
            action: 'PROMOTE_ADMIN',
            details: `User promoted to admin: ${user.name} (${user.email})`,
            actor: req.user?._id
        });

        res.json(user.toJSON());
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
