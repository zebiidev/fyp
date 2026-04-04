import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    FaBell, FaLock, FaCogs, 
    FaSave, FaShieldAlt, FaExclamationTriangle, FaTerminal
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const SettingsSection = ({ icon: Icon, title, description, children }) => (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
        <div className="flex items-start gap-6 mb-8">
            <div className="p-4 bg-slate-900 text-white rounded-2xl">
                <Icon size={20} />
            </div>
            <div>
                <h3 className="text-xl font-black text-slate-800">{title}</h3>
                <p className="text-sm text-slate-400 font-medium italic">{description}</p>
            </div>
        </div>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

const ToggleInput = ({ label, description, enabled, onToggle }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
        <div className="max-w-md">
            <p className="text-sm font-black text-slate-700 mb-1">{label}</p>
            <p className="text-xs text-slate-400 font-medium">{description}</p>
        </div>
        <button 
            onClick={onToggle}
            className={`w-12 h-6 rounded-full transition-all flex items-center px-1
                ${enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
        >
            <motion.div 
                animate={{ x: enabled ? 24 : 0 }}
                className="w-4 h-4 bg-white rounded-full shadow-sm"
            />
        </button>
    </div>
);

const AdminSettings = () => {
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        strictVerification: true,
        emailAlerts: true,
        internalAlerts: true,
        serviceFeePercent: 5
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: ''
    });

    const loadSettings = async () => {
        setLoading(true);
        try {
            const [settingsRes, logsRes] = await Promise.all([
                api.get('/admin/settings'),
                api.get('/admin/settings/audit?limit=20')
            ]);
            setSettings({
                maintenanceMode: !!settingsRes.data.maintenanceMode,
                strictVerification: !!settingsRes.data.strictVerification,
                emailAlerts: !!settingsRes.data.emailAlerts,
                internalAlerts: settingsRes.data.internalAlerts !== false,
                serviceFeePercent: settingsRes.data.serviceFeePercent ?? 5
            });
            setAuditLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load admin settings');
        } finally {
            setLoading(false);
        }
    };

    const refreshAuditLogs = async () => {
        try {
            const logsRes = await api.get('/admin/settings/audit?limit=20');
            setAuditLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
        } catch {
            // Silent refresh failure
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleSave = async () => {
        if (settings.serviceFeePercent === '' || Number.isNaN(Number(settings.serviceFeePercent))) {
            toast.error('Please enter a valid service fee percentage.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                maintenanceMode: settings.maintenanceMode,
                strictVerification: settings.strictVerification,
                emailAlerts: settings.emailAlerts,
                internalAlerts: settings.internalAlerts,
                serviceFeePercent: Number(settings.serviceFeePercent)
            };
            const res = await api.put('/admin/settings', payload);
            setSettings({
                maintenanceMode: !!res.data.maintenanceMode,
                strictVerification: !!res.data.strictVerification,
                emailAlerts: !!res.data.emailAlerts,
                internalAlerts: res.data.internalAlerts !== false,
                serviceFeePercent: res.data.serviceFeePercent ?? 5
            });
            refreshAuditLogs();
            toast.success('Admin settings saved.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (!passwords.currentPassword || !passwords.newPassword) {
            toast.error('Please fill in both password fields.');
            return;
        }
        try {
            await api.put('/admin/settings/password', passwords);
            toast.success('Password updated successfully.');
            setPasswords({ currentPassword: '', newPassword: '' });
            refreshAuditLogs();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update password');
        }
    };

    const handleExportAudit = async () => {
        setExporting(true);
        try {
            const res = await api.get('/admin/settings/audit/export', { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'admin-audit-log.pdf';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Audit log downloaded.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to export audit log');
        } finally {
            setExporting(false);
        }
    };

    const handleResetAnalytics = async () => {
        const confirmed = window.confirm('Reset analytics? This will only show data collected after the reset.');
        if (!confirmed) return;
        setResetting(true);
        try {
            await api.post('/admin/settings/reset-analytics');
            toast.success('Analytics reset timestamp updated.');
            refreshAuditLogs();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset analytics');
        } finally {
            setResetting(false);
        }
    };

    const handleDeleteSuspended = async () => {
        const confirmed = window.confirm('Delete all suspended (rejected) accounts? This cannot be undone.');
        if (!confirmed) return;
        setDeleting(true);
        try {
            const res = await api.post('/admin/settings/delete-suspended');
            toast.success(res.data?.message || 'Suspended accounts deleted.');
            refreshAuditLogs();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete suspended accounts');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">System Control Panel</h1>
                    <p className="text-slate-500 font-medium italic">Global configurations and administrative security settings.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-70"
                >
                    <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Global System Settings */}
                <SettingsSection 
                    icon={FaCogs} 
                    title="Platform Controls" 
                    description="Manage core system behavior and uptime."
                >
                    <ToggleInput 
                        label="Maintenance Mode" 
                        description="Redirect all users to a maintenance page. Used during system upgrades."
                        enabled={settings.maintenanceMode}
                        onToggle={() => setSettings((prev) => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                    />
                    <ToggleInput 
                        label="Strict Rider Verification" 
                        description="Force manual admin approval for all new vehicle documents before offering rides."
                        enabled={settings.strictVerification}
                        onToggle={() => setSettings((prev) => ({ ...prev, strictVerification: !prev.strictVerification }))}
                    />
                    <div className="pt-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Platform Service Fee (%)</label>
                        <div className="flex items-center gap-4">
                            <input 
                                type="number" 
                                value={settings.serviceFeePercent}
                                onChange={(e) => setSettings((prev) => ({
                                    ...prev,
                                    serviceFeePercent: e.target.value === '' ? '' : Number(e.target.value)
                                }))}
                                className="w-24 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900" 
                            />
                            <p className="text-xs text-slate-500 font-medium">Fee taken from rider earnings per successful trip.</p>
                        </div>
                    </div>
                </SettingsSection>

                {/* Security & Access */}
                <SettingsSection 
                    icon={FaShieldAlt} 
                    title="Admin Security" 
                    description="Manage your credentials and access protocols."
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Current Admin Password</label>
                            <input 
                                type="password" 
                                placeholder="********" 
                                value={passwords.currentPassword}
                                onChange={(e) => setPasswords((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">New System Password</label>
                            <input 
                                type="password" 
                                placeholder="Enter new password" 
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords((prev) => ({ ...prev, newPassword: e.target.value }))}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900" 
                            />
                        </div>
                        <button 
                            onClick={handlePasswordUpdate}
                            className="w-full py-3 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                            <FaLock /> Update Security Credentials
                        </button>
                    </div>
                </SettingsSection>

                {/* Notification Routing */}
                <SettingsSection 
                    icon={FaBell} 
                    title="Communication Sync" 
                    description="Configure how you receive critical system signals."
                >
                    <ToggleInput 
                        label="Internal System Alerts" 
                        description="Notify about SOS triggers and critical server errors in the admin dashboard."
                        enabled={settings.internalAlerts}
                        onToggle={() => setSettings((prev) => ({ ...prev, internalAlerts: !prev.internalAlerts }))}
                    />
                    <ToggleInput 
                        label="Email Dispatch" 
                        description="Receive rider verification requests and harassment reports via email."
                        enabled={settings.emailAlerts}
                        onToggle={() => setSettings((prev) => ({ ...prev, emailAlerts: !prev.emailAlerts }))}
                    />
                </SettingsSection>

                {/* Audit & Logs */}
                <SettingsSection 
                    icon={FaTerminal} 
                    title="System Terminal" 
                    description="View recent administrative actions and audit trails."
                >
                    <div className="bg-slate-900 rounded-3xl p-6 font-mono text-[10px] space-y-2 text-emerald-400/80 min-h-[140px]">
                        {auditLogs.length === 0 ? (
                            <p className="text-slate-400">No audit logs available yet.</p>
                        ) : (
                            auditLogs.slice(0, 6).map((log) => (
                                <p key={log._id}>
                                    <span className="text-slate-500">
                                        [{new Date(log.createdAt).toLocaleString()}]
                                    </span>{' '}
                                    {log.action}: {log.details || 'No details'}
                                </p>
                            ))
                        )}
                        <div className="flex items-center gap-2 pt-2 text-slate-400 animate-pulse">
                            <span>&gt;</span>
                            <div className="w-2 h-4 bg-slate-400"></div>
                        </div>
                    </div>
                    <button 
                        onClick={handleExportAudit}
                        disabled={exporting}
                        className="w-full py-3 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors disabled:opacity-70"
                    >
                        {exporting ? 'Exporting...' : 'Download Full System Audit PDF'}
                    </button>
                </SettingsSection>
            </div>

            {/* Danger Zone */}
            <div className="p-8 bg-rose-50 rounded-[40px] border border-rose-100">
                <div className="flex items-center gap-4 mb-4 text-rose-600">
                    <FaExclamationTriangle size={24} />
                    <h3 className="text-xl font-black">Advanced Danger Zone</h3>
                </div>
                <p className="text-sm text-rose-800/70 font-medium mb-6 italic">Actions here are irreversible and affect the entire platform ecosystem.</p>
                <div className="flex flex-wrap gap-4">
                    <button 
                        onClick={handleResetAnalytics}
                        className="px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-2xl text-xs font-black shadow-sm hover:bg-rose-600 hover:text-white transition-all disabled:opacity-70"
                        disabled={resetting}
                    >
                        {resetting ? 'Resetting...' : 'Reset System Analytics'}
                    </button>
                    <button 
                        onClick={handleDeleteSuspended}
                        className="px-6 py-3 bg-rose-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all disabled:opacity-70"
                        disabled={deleting}
                    >
                        {deleting ? 'Deleting...' : 'Delete All Suspended Accounts'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
