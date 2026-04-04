import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    FaUsers, FaCar, FaShieldAlt,
    FaExclamationTriangle, FaCheckCircle
} from 'react-icons/fa';
import api from '../../utils/api';

const AdminStat = ({ icon: Icon, label, value, trend, color }) => (
    <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-4 rounded-2xl ${color}`}>
                <Icon size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg uppercase tracking-widest">
                {trend}
            </span>
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-black text-slate-800">{value}</h3>
    </motion.div>
);

const fallbackAlerts = [
    { id: 1, type: 'emergency', msg: 'SOS Triggered by User #1292', time: '2 mins ago', status: 'Active' },
    { id: 2, type: 'verification', msg: 'New Rider Verification Request: Ali Khan', time: '15 mins ago', status: 'Pending' },
];

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalRiders: 0,
        totalPassengers: 0,
        activeRides: 0,
        pendingVerifications: 0
    });
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/admin/stats');
                setStats(res.data);
                if (Array.isArray(res.data.recentComplaints)) {
                    setAlerts(
                        res.data.recentComplaints.map((c) => ({
                            id: c._id,
                            type: c.type === 'emergency' ? 'emergency' : 'report',
                            msg: `${c.type}: ${c.subject}`,
                            time: new Date(c.createdAt).toLocaleString(),
                            status: c.status
                        }))
                    );
                }
            } catch (err) {
                toast.error('Failed to load dashboard stats');
            }
        };
        load();
    }, []);

    return (
        <div className="space-y-8 pb-10">
            <header>
                <h1 className="text-3xl font-black text-slate-800">System Overview</h1>
                <p className="text-slate-500 font-medium italic">Monitoring campus safety and system health in real-time.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStat icon={FaUsers} label="Total Users" value={stats.totalUsers.toLocaleString()} trend="Live" color="bg-indigo-50 text-primary" />
                <AdminStat icon={FaCar} label="Active Rides" value={stats.activeRides} trend="Live" color="bg-emerald-50 text-emerald-600" />
                <AdminStat icon={FaShieldAlt} label="Pending Verifications" value={stats.pendingVerifications} trend="Needs Review" color="bg-orange-50 text-orange-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">System Infrastructure</h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">All Systems Operational</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button className="p-8 bg-slate-900 text-white rounded-[40px] shadow-2xl shadow-slate-200 text-left transition-all hover:bg-slate-800">
                                <FaExclamationTriangle className="text-rose-500 mb-4" size={32} />
                                <h4 className="text-lg font-black mb-1">Emergency Protocol</h4>
                                <p className="text-xs text-slate-400 font-medium">Broadcast safety alerts to all active riders and passengers.</p>
                            </button>
                            <button className="p-8 bg-white border border-slate-100 rounded-[40px] shadow-sm text-left transition-all hover:border-emerald-500/50">
                                <FaCheckCircle className="text-emerald-500 mb-4" size={32} />
                                <h4 className="text-lg font-black text-slate-800 mb-1">Verify Riders</h4>
                                <p className="text-xs text-slate-400 font-medium">Review pending document submissions for new ride providers.</p>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-full">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Priority Signals</h3>
                    <div className="space-y-6">
                        {alerts.map((alert) => (
                            <div key={alert.id} className="relative pl-6 border-l-2 border-slate-100 group">
                                <div className={`absolute left-[-5px] top-0 w-2 h-2 rounded-full ${alert.type === 'emergency' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-slate-300'}`}></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{alert.time}</p>
                                <h4 className={`text-sm font-bold ${alert.type === 'emergency' ? 'text-rose-600' : 'text-slate-800'}`}>{alert.msg}</h4>
                                <span className="inline-block mt-2 text-[9px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded uppercase tracking-widest">{alert.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
