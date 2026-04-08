import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    FaUsers, FaCar, FaShieldAlt,
    FaExclamationTriangle, FaCheckCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
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
                } else {
                    setAlerts([]);
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
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">System Pulse</h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Overview</span>
                            </div>
                        </div>

                        {stats.totalUsers > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* User Mix */}
                                <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-sm font-black text-slate-800">User Mix</h4>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Total {stats.totalUsers}
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${Math.min(100, (stats.totalRiders / stats.totalUsers) * 100)}%`
                                                }}
                                                transition={{ duration: 0.9, ease: 'easeOut' }}
                                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-300"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <span>Riders</span>
                                            <span>{stats.totalRiders}</span>
                                        </div>
                                        <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${Math.min(100, (stats.totalPassengers / stats.totalUsers) * 100)}%`
                                                }}
                                                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
                                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <span>Passengers</span>
                                            <span>{stats.totalPassengers}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Operational Health */}
                                <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-sm font-black text-slate-800">Operational Health</h4>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Now</span>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-slate-600 text-xs font-bold">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                                Active Rides
                                            </div>
                                            <span className="text-sm font-black text-slate-800">{stats.activeRides}</span>
                                        </div>
                                        <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${Math.min(100, (stats.activeRides / Math.max(1, stats.totalRiders)) * 100)}%`
                                                }}
                                                transition={{ duration: 0.9, ease: 'easeOut' }}
                                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-slate-600 text-xs font-bold">
                                                <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                                                Pending Verifications
                                            </div>
                                            <span className="text-sm font-black text-slate-800">{stats.pendingVerifications}</span>
                                        </div>
                                        <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${Math.min(100, (stats.pendingVerifications / Math.max(1, stats.totalRiders)) * 100)}%`
                                                }}
                                                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
                                                className="h-full bg-gradient-to-r from-orange-400 to-orange-200"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-14 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                                <p className="text-sm font-bold text-slate-400">No system data yet.</p>
                                <p className="text-xs text-slate-300 mt-1">Analytics will appear once users and rides are created.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-full">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Priority Signals</h3>
                    <div className="space-y-6">
                        {alerts.length > 0 ? (
                            alerts.map((alert) => (
                                <div key={alert.id} className="relative pl-6 border-l-2 border-slate-100 group">
                                    <div className={`absolute left-[-5px] top-0 w-2 h-2 rounded-full ${alert.type === 'emergency' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-slate-300'}`}></div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{alert.time}</p>
                                    <h4 className={`text-sm font-bold ${alert.type === 'emergency' ? 'text-rose-600' : 'text-slate-800'}`}>{alert.msg}</h4>
                                    <span className="inline-block mt-2 text-[9px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded uppercase tracking-widest">{alert.status}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-slate-400 font-medium italic">
                                No priority signals right now.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
