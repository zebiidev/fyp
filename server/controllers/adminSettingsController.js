import bcrypt from 'bcryptjs';
import AdminSettings from '../models/AdminSettings.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import User from '../models/User.js';
import Ride from '../models/Ride.js';
import Complaint from '../models/Complaint.js';

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

const getOrCreateSettings = async (actorId) => {
    let settings = await AdminSettings.findOne();
    if (!settings) {
        settings = await AdminSettings.create({
            updatedBy: actorId
        });
        await logAdminAction({
            action: 'SETTINGS_INITIALIZED',
            details: 'Default admin settings created.',
            actor: actorId
        });
    }
    return settings;
};

// @desc    Get Admin Settings
// @route   GET /api/admin/settings
// @access  Private (Admin)
export const getAdminSettings = async (req, res) => {
    try {
        const settings = await getOrCreateSettings(req.user?._id);
        res.json(settings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update Admin Settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
export const updateAdminSettings = async (req, res) => {
    try {
        const settings = await getOrCreateSettings(req.user?._id);

        const updates = {};
        const allowed = [
            'maintenanceMode',
            'strictVerification',
            'emailAlerts',
            'internalAlerts',
            'serviceFeePercent'
        ];

        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        if (updates.serviceFeePercent !== undefined) {
            const fee = Number(updates.serviceFeePercent);
            if (Number.isNaN(fee) || fee < 0 || fee > 100) {
                return res.status(400).json({ message: 'Service fee must be between 0 and 100.' });
            }
            updates.serviceFeePercent = fee;
        }

        updates.updatedBy = req.user?._id;
        updates.updatedAt = new Date();

        const updated = await AdminSettings.findByIdAndUpdate(
            settings._id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        await logAdminAction({
            action: 'UPDATE_SETTINGS',
            details: `Settings updated: ${Object.keys(updates).join(', ')}`,
            actor: req.user?._id
        });

        res.json(updated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update Admin Password
// @route   PUT /api/admin/settings/password
// @access  Private (Admin)
export const updateAdminPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters.' });
        }

        const adminUser = await User.findById(req.user?._id);
        if (!adminUser) {
            return res.status(404).json({ message: 'Admin user not found.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, adminUser.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect.' });
        }

        const salt = await bcrypt.genSalt(10);
        adminUser.password = await bcrypt.hash(newPassword, salt);
        await adminUser.save();

        await logAdminAction({
            action: 'UPDATE_ADMIN_PASSWORD',
            details: 'Admin password updated.',
            actor: req.user?._id
        });

        res.json({ message: 'Password updated successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get Admin Audit Logs
// @route   GET /api/admin/settings/audit
// @access  Private (Admin)
export const getAdminAuditLogs = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 200);
        const logs = await AdminAuditLog.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('actor', 'name email');
        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Export Admin Audit Logs PDF
// @route   GET /api/admin/settings/audit/export
// @access  Private (Admin)
export const exportAdminAuditPdf = async (req, res) => {
    try {
        const logs = await AdminAuditLog.find()
            .sort({ createdAt: -1 })
            .limit(500)
            .populate('actor', 'name email');

        const { default: PDFDocument } = await import('pdfkit');
        const doc = new PDFDocument({ margin: 40 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=\"admin-audit-log.pdf\"');

        doc.fontSize(18).text('System Audit Log', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(10).text(`Generated at: ${new Date().toLocaleString()}`);
        doc.moveDown(1.5);

        logs.forEach((log, index) => {
            doc.fontSize(11).text(`${index + 1}. ${log.action}`, { continued: false });
            doc.fontSize(9).fillColor('#555').text(`Time: ${new Date(log.createdAt).toLocaleString()}`);
            if (log.actor) {
                doc.text(`Actor: ${log.actor.name || 'Unknown'} (${log.actor.email || 'No email'})`);
            }
            if (log.details) {
                doc.text(`Details: ${log.details}`);
            }
            doc.fillColor('#000').moveDown(0.8);
        });

        doc.pipe(res);
        doc.end();

        await logAdminAction({
            action: 'EXPORT_AUDIT_LOG',
            details: 'Admin audit log exported.',
            actor: req.user?._id
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Reset System Analytics
// @route   POST /api/admin/settings/reset-analytics
// @access  Private (Admin)
export const resetSystemAnalytics = async (req, res) => {
    try {
        const settings = await getOrCreateSettings(req.user?._id);
        settings.analyticsResetAt = new Date();
        settings.updatedBy = req.user?._id;
        settings.updatedAt = new Date();
        await settings.save();

        await logAdminAction({
            action: 'RESET_ANALYTICS',
            details: 'System analytics reset timestamp updated.',
            actor: req.user?._id
        });

        res.json({ message: 'System analytics reset successfully.', analyticsResetAt: settings.analyticsResetAt });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete Suspended (Rejected) Accounts
// @route   POST /api/admin/settings/delete-suspended
// @access  Private (Admin)
export const deleteSuspendedAccounts = async (req, res) => {
    try {
        const suspendedUsers = await User.find({ accountStatus: 'rejected', role: { $ne: 'admin' } }).select('_id');
        const suspendedIds = suspendedUsers.map((u) => u._id);

        if (suspendedIds.length === 0) {
            return res.json({ message: 'No suspended accounts found.', deleted: 0 });
        }

        await Ride.deleteMany({ driver: { $in: suspendedIds } });
        await Complaint.deleteMany({ user: { $in: suspendedIds } });
        const result = await User.deleteMany({ _id: { $in: suspendedIds } });

        await logAdminAction({
            action: 'DELETE_SUSPENDED_ACCOUNTS',
            details: `Deleted ${result.deletedCount || 0} suspended accounts.`,
            actor: req.user?._id
        });

        res.json({ message: 'Suspended accounts deleted.', deleted: result.deletedCount || 0 });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
