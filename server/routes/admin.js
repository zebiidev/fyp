import express from 'express';
import { getDashboardStats, getSystemAnalytics, getPendingUsers, updateUserStatus, getAllUsers, deleteUser, getPendingRiderVerifications, verifyRider } from '../controllers/adminController.js';
import { 
    getAdminSettings,
    updateAdminSettings,
    updateAdminPassword,
    getAdminAuditLogs,
    exportAdminAuditPdf,
    resetSystemAnalytics,
    deleteSuspendedAccounts
} from '../controllers/adminSettingsController.js';
import { getAdmins, createAdmin, promoteToAdmin } from '../controllers/adminManagementController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, admin, getDashboardStats);
router.get('/analytics', protect, admin, getSystemAnalytics);
router.get('/riders/pending-verifications', protect, admin, getPendingRiderVerifications);
router.put('/riders/:id/verify', protect, admin, verifyRider);
router.get('/settings', protect, admin, getAdminSettings);
router.put('/settings', protect, admin, updateAdminSettings);
router.put('/settings/password', protect, admin, updateAdminPassword);
router.get('/settings/audit', protect, admin, getAdminAuditLogs);
router.get('/settings/audit/export', protect, admin, exportAdminAuditPdf);
router.post('/settings/reset-analytics', protect, admin, resetSystemAnalytics);
router.post('/settings/delete-suspended', protect, admin, deleteSuspendedAccounts);
router.get('/admins', protect, admin, getAdmins);
router.post('/admins', protect, admin, createAdmin);
router.put('/admins/:id/promote', protect, admin, promoteToAdmin);
router.get('/users/pending', protect, admin, getPendingUsers);
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/status', protect, admin, updateUserStatus);
router.delete('/users/:id', protect, admin, deleteUser);

export default router;


