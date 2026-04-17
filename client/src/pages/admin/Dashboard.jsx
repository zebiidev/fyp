import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    FaUsers, FaCar, FaShieldAlt,
    FaExclamationTriangle, FaCheckCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Loader from '../../components/ui/Loader';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    RadialBarChart, RadialBar, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold">
                <span className="capitalize">{payload[0].name}</span>: {payload[0].value}
            </div>
        );
    }
    return null;
};

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalRiders: 0,
        totalPassengers: 0,
        activeRides: 0,
        pendingVerifications: 0
    });
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

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
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return <Loader fullPage message="Loading dashboard data..." />;
    }

    // Pie chart data for User Mix
    const userMixData = [
        { name: 'Riders', value: stats.totalRiders },
        { name: 'Passengers', value: stats.totalPassengers },
        { name: 'Others', value: Math.max(0, stats.totalUsers - stats.totalRiders - stats.totalPassengers) }
    ].filter(d => d.value > 0);

    // Radial bar data for Operational Health
    const opHealthData = [
        {
            name: 'Active Rides',
            value: Math.min(100, (stats.activeRides / Math.max(1, stats.totalRiders)) * 100),
            count: stats.activeRides,
            fill: '#10b981'
        },
        {
            name: 'Pending Verifications',
            value: Math.min(100, (stats.pendingVerifications / Math.max(1, stats.totalRiders)) * 100),
            count: stats.pendingVerifications,
            fill: '#f59e0b'
        }
    ];

    const renderCustomLabel = ({ cx, cy }) => (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
            <tspan x={cx} dy="-8" className="text-2xl font-black fill-slate-800">{stats.totalUsers}</tspan>
            <tspan x={cx} dy="22" className="text-[10px] font-bold fill-slate-400 uppercase tracking-widest">Total Users</tspan>
        </text>
    );

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
                                {/* User Mix — Donut Chart */}
                                <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-black text-slate-800">User Mix</h4>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Total {stats.totalUsers}
                                        </span>
                                    </div>
                                    <div className="h-52">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={userMixData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={55}
                                                    outerRadius={80}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    strokeWidth={0}
                                                    labelLine={false}
                                                    label={renderCustomLabel}
                                                >
                                                    {userMixData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex items-center justify-center gap-6 mt-2">
                                        {userMixData.map((entry, index) => (
                                            <div key={entry.name} className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{entry.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Operational Health — Radial Bar */}
                                <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-black text-slate-800">Operational Health</h4>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Now</span>
                                    </div>
                                    <div className="h-52">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadialBarChart
                                                cx="50%"
                                                cy="50%"
                                                innerRadius="35%"
                                                outerRadius="90%"
                                                barSize={14}
                                                data={opHealthData}
                                                startAngle={210}
                                                endAngle={-30}
                                            >
                                                <RadialBar
                                                    background={{ fill: '#f1f5f9' }}
                                                    clockWise
                                                    dataKey="value"
                                                    cornerRadius={10}
                                                />
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold">
                                                                    {payload[0].payload.name}: {payload[0].payload.count}
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                            </RadialBarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-col gap-3 mt-2">
                                        {opHealthData.map((entry) => (
                                            <div key={entry.name} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }}></span>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{entry.name}</span>
                                                </div>
                                                <span className="text-sm font-black text-slate-800">{entry.count}</span>
                                            </div>
                                        ))}
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
