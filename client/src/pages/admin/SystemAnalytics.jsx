import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    FaChartArea, FaArrowUp, FaArrowDown, FaCalendarAlt, 
    FaRoute, FaCar, FaClock, FaDownload
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Loader from '../../components/ui/Loader';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    AreaChart, Area,
    Legend
} from 'recharts';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const STATUS_COLORS = {
    completed: '#10b981',
    scheduled: '#6366f1',
    active: '#3b82f6',
    ongoing: '#8b5cf6',
    cancelled: '#ef4444',
    expired: '#94a3b8'
};

const AnalyticsStat = ({ label, value, trend, isUp, icon: Icon }) => (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl">
                <Icon size={20} />
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${isUp ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'} uppercase tracking-widest`}>
                {isUp ? <FaArrowUp /> : <FaArrowDown />} {trend}
            </div>
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-3xl font-black text-slate-800">{value}</h3>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 backdrop-blur-sm text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    {label || payload[0]?.name}
                </p>
                {payload.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill || item.color }}></span>
                        <span className="text-sm font-bold">{item.value} rides</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 backdrop-blur-sm text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{payload[0].name}</p>
                <p className="text-sm font-bold">{payload[0].value} users</p>
            </div>
        );
    }
    return null;
};

const SystemAnalytics = () => {
    const [analytics, setAnalytics] = useState({
        popularDestinations: [],
        rideStatusBreakdown: [],
        userRoleBreakdown: []
    });
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                const res = await api.get('/admin/analytics');
                setAnalytics(res.data);
                setLoadError('');
                setLoading(false);
            } catch {
                toast.error('Failed to load analytics');
                setLoadError('Unable to load analytics right now.');
                setLoading(false);
            }
        };
        loadAnalytics();
    }, []);

    // Ride Status bar chart data
    const statusChartData = useMemo(() => {
        return (analytics.rideStatusBreakdown || []).map((status) => ({
            name: (status._id || 'Unknown').charAt(0).toUpperCase() + (status._id || 'unknown').slice(1),
            rides: Number(status.count || 0),
            fill: STATUS_COLORS[status._id] || '#94a3b8'
        }));
    }, [analytics.rideStatusBreakdown]);

    // User Role pie chart data
    const roleChartData = useMemo(() => {
        return (analytics.userRoleBreakdown || []).map((role, i) => ({
            name: (role._id || 'Unknown').charAt(0).toUpperCase() + (role._id || 'unknown').slice(1),
            value: Number(role.count || 0),
            fill: CHART_COLORS[i % CHART_COLORS.length]
        }));
    }, [analytics.userRoleBreakdown]);

    // Hotspot / destination chart data
    const destinationChartData = useMemo(() => {
        return (analytics.popularDestinations || []).map((spot, i) => ({
            name: spot._id || 'Unknown',
            rides: Number(spot.count || 0),
            fill: CHART_COLORS[i % CHART_COLORS.length]
        }));
    }, [analytics.popularDestinations]);

    // Calculate dynamic stats
    const totalUsers = (analytics.userRoleBreakdown || []).reduce((acc, r) => acc + r.count, 0);
    const completedRides = (analytics.rideStatusBreakdown || []).find(r => r._id === 'completed')?.count || 0;
    const totalRides = (analytics.rideStatusBreakdown || []).reduce((acc, r) => acc + r.count, 0);
    const riderRatio = totalUsers > 0 
        ? ((analytics.userRoleBreakdown.find(r => r._id === 'rider')?.count || 0) / totalUsers * 100).toFixed(1) 
        : "0";

    const escapeCsv = (value) => {
        const stringValue = String(value ?? '');
        if (/[",\n]/.test(stringValue)) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };

    const handleExport = () => {
        try {
            const rows = [
                ['Section', 'Label', 'Count'],
                ...analytics.userRoleBreakdown.map((item) => ([
                    'User Roles',
                    item?._id || 'Unknown',
                    item?.count ?? 0
                ])),
                ...analytics.rideStatusBreakdown.map((item) => ([
                    'Ride Status',
                    item?._id || 'Unknown',
                    item?.count ?? 0
                ])),
                ...analytics.popularDestinations.map((item) => ([
                    'Popular Destinations',
                    item?._id || 'Unknown',
                    item?.count ?? 0
                ]))
            ];

            const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `system-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Analytics exported.');
        } catch {
            toast.error('Failed to export analytics.');
        }
    };

    if (loading) {
        return <Loader fullPage message="Loading analytics..." />;
    }

    if (loadError) {
        return (
            <div className="py-16">
                <div className="max-w-2xl mx-auto text-center bg-slate-50 border border-slate-100 rounded-3xl p-10">
                    <p className="text-sm font-bold text-slate-600">{loadError}</p>
                    <p className="text-xs text-slate-400 mt-2">Try refreshing or check back later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">System Analytics</h1>
                    <p className="text-slate-500 font-medium italic">Deep insights into campus mobility, user trends, and ride activity.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-6 py-3 bg-white border border-slate-100 rounded-2xl font-black text-xs text-slate-600 flex items-center gap-2 shadow-sm">
                        <FaCalendarAlt /> Last 7 Days
                    </button>
                    <button 
                        onClick={handleExport}
                        disabled={loading}
                        className="p-3 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl flex items-center gap-2 disabled:opacity-70"
                    >
                        <FaDownload /> Export
                    </button>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <AnalyticsStat 
                    label="User Base" 
                    value={totalUsers.toLocaleString()} 
                    trend="Riders" 
                    isUp={true} 
                    icon={FaChartArea} 
                />
                <AnalyticsStat 
                    label="Completed Rides" 
                    value={completedRides.toLocaleString()} 
                    trend="Efficiency" 
                    isUp={true} 
                    icon={FaCar} 
                />
                <AnalyticsStat 
                    label="Rider/User Ratio" 
                    value={`${riderRatio}%`} 
                    trend="Balance" 
                    isUp={parseFloat(riderRatio) > 20} 
                    icon={FaRoute} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Ride Status — Bar Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Ride Status Overview</h3>
                        <div className="flex gap-4 flex-wrap">
                            {statusChartData.slice(0, 3).map((item) => (
                                <span key={item.name} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }}></span> {item.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {statusChartData.length > 0 ? (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statusChartData} barCategoryGap="20%">
                                    <defs>
                                        {statusChartData.map((entry, i) => (
                                            <linearGradient key={`grad-${i}`} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={entry.fill} stopOpacity={1} />
                                                <stop offset="100%" stopColor={entry.fill} stopOpacity={0.5} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8', textTransform: 'uppercase' }}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)', radius: 12 }} />
                                    <Bar 
                                        dataKey="rides" 
                                        radius={[12, 12, 4, 4]}
                                        maxBarSize={60}
                                    >
                                        {statusChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={`url(#barGrad-${index})`} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No status data yet</p>
                        </div>
                    )}

                    {/* Ride Summary Strip */}
                    {statusChartData.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                            {statusChartData.slice(0, 4).map((status) => (
                                <div key={status.name} className="bg-slate-50 rounded-2xl p-4 text-center">
                                    <p className="text-xl font-black text-slate-800">{status.rides}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{status.name}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* User Role Distribution — Donut Chart */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6">User Distribution</h3>
                    {roleChartData.length > 0 ? (
                        <>
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={roleChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {roleChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-3 mt-4">
                                {roleChartData.map((entry) => (
                                    <div key={entry.name} className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }}></span>
                                            <span className="text-xs font-bold text-slate-600 capitalize">{entry.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-800">{entry.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-48 flex items-center justify-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                            <p className="text-xs font-bold text-slate-400">No user data yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Popular Destinations — Horizontal Bar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Popular Hotspots</h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top Destinations</span>
                    </div>

                    {destinationChartData.length > 0 ? (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={destinationChartData} layout="vertical" barCategoryGap="18%">
                                    <defs>
                                        <linearGradient id="destGrad" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis 
                                        type="number" 
                                        axisLine={false} 
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                                        allowDecimals={false}
                                    />
                                    <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false}
                                        width={120}
                                        tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                                    <Bar 
                                        dataKey="rides" 
                                        fill="url(#destGrad)"
                                        radius={[4, 12, 12, 4]}
                                        maxBarSize={32}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                            <p className="text-xs font-bold text-slate-400">No hotspot data yet</p>
                        </div>
                    )}
                </div>

                {/* Ride Completion Rate */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6">Completion Rate</h3>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="h-48 w-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Completed', value: completedRides },
                                            { name: 'Other', value: Math.max(0, totalRides - completedRides) }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={78}
                                        paddingAngle={2}
                                        dataKey="value"
                                        strokeWidth={0}
                                        startAngle={90}
                                        endAngle={-270}
                                    >
                                        <Cell fill="#10b981" />
                                        <Cell fill="#f1f5f9" />
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="-mt-28 text-center mb-20">
                            <p className="text-3xl font-black text-slate-800">
                                {totalRides > 0 ? Math.round((completedRides / totalRides) * 100) : 0}%
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Success Rate</p>
                        </div>
                    </div>
                    <div className="mt-auto p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex gap-3">
                        <FaClock className="text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-primary/70 font-bold leading-relaxed italic">
                            Peak ride hours detected between 8:30 AM - 10:00 AM.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemAnalytics;
