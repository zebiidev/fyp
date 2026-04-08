import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    FaChartArea, FaArrowUp, FaArrowDown, FaCalendarAlt, 
    FaRoute, FaCar, FaClock, FaDownload
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Loader from '../../components/ui/Loader';

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

    const hotspots = useMemo(() => {
        const colors = ['bg-primary', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500', 'bg-slate-400'];
        return (analytics.popularDestinations || []).map((spot, idx) => ({
            name: spot._id || 'Unknown',
            count: spot.count || 0,
            color: colors[idx % colors.length]
        }));
    }, [analytics.popularDestinations]);

    const highestCount = hotspots.length > 0 ? Math.max(...hotspots.map((spot) => spot.count)) : 1;
    const statusSeries = useMemo(() => {
        return (analytics.rideStatusBreakdown || []).map((status) => ({
            label: status._id || 'Unknown',
            count: Number(status.count || 0)
        }));
    }, [analytics.rideStatusBreakdown]);
    const maxStatusCount = statusSeries.length > 0 ? Math.max(...statusSeries.map((s) => s.count), 1) : 1;
    const totalStatusCount = statusSeries.reduce((sum, item) => sum + item.count, 0);
    const hasStatusData = statusSeries.length > 0 && totalStatusCount > 0;

    // Calculate dynamic stats
    const totalUsers = (analytics.userRoleBreakdown || []).reduce((acc, r) => acc + r.count, 0);
    const completedRides = (analytics.rideStatusBreakdown || []).find(r => r._id === 'completed')?.count || 0;
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
                {/* Traffic Trend (Placeholder) */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm min-h-[400px]">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Ride Status Overview</h3>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-primary"></span> Completed
                            </span>
                            <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                            </span>
                        </div>
                    </div>
                    
                    {/* Ride Status Graph */}
                    <div className="w-full h-64 bg-gradient-to-br from-slate-50 to-white rounded-[32px] border border-slate-100 shadow-inner flex items-center justify-center p-6 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-40 pointer-events-none">
                            <div className="absolute inset-6 border border-dashed border-slate-100 rounded-[24px]" />
                            <div className="absolute inset-0 bg-[linear-gradient(to_top,transparent_0%,transparent_23%,rgba(148,163,184,0.08)_24%,transparent_25%,transparent_49%,rgba(148,163,184,0.08)_50%,transparent_51%,transparent_74%,rgba(148,163,184,0.08)_75%,transparent_76%)]" />
                        </div>
                        {hasStatusData ? (
                            <div className="w-full h-full flex items-end gap-3 pb-6 relative z-10">
                                {statusSeries.map((status, i) => {
                                    const rawPct = (status.count / maxStatusCount) * 100;
                                    const heightPct = status.count > 0 ? Math.max(10, Math.min(100, rawPct)) : 0;
                                    const barStyle = i % 3 === 0
                                        ? 'from-indigo-500 to-indigo-300'
                                        : i % 3 === 1
                                            ? 'from-emerald-500 to-emerald-300'
                                            : 'from-rose-500 to-rose-300';
                                    return (
                                        <div key={i} className="flex-1 h-full flex flex-col items-center gap-2">
                                            <div className="w-full flex-1 flex items-end">
                                                <motion.div
                                                    className={`w-full bg-gradient-to-t ${barStyle} rounded-2xl min-h-[14px] shadow-[0_10px_20px_rgba(99,102,241,0.2)]`}
                                                    initial={{ height: '0%' }}
                                                    whileInView={{ height: `${heightPct}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.08 }}
                                                    viewport={{ once: true, amount: 0.4 }}
                                                />
                                            </div>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest rotate-45 mt-2">{status.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No status data yet</p>
                        )}
                    </div>
                    
                    {hasStatusData && (
                        <div className="grid grid-cols-4 mt-12 gap-4">
                            {analytics.rideStatusBreakdown.slice(0, 4).map((status, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300"
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${Math.min(100, (status.count / maxStatusCount) * 100)}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.08 }}
                                            viewport={{ once: true, amount: 0.4 }}
                                        />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{status._id}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Popular Destinations */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-full">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Popular Hotspots</h3>
                    <div className="space-y-6">
                        {hotspots.length > 0 ? (
                            hotspots.map((spot, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                                        <span>{spot.name}</span>
                                        <span>{spot.count} rides</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${(spot.count / highestCount) * 100}%` }}
                                            transition={{ duration: 0.9, ease: 'easeOut', delay: i * 0.08 }}
                                            viewport={{ once: true, amount: 0.4 }}
                                            className={`h-full ${spot.color} shadow-[0_6px_12px_rgba(15,23,42,0.12)]`}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-slate-400 font-medium italic">
                                No hotspot data yet.
                            </div>
                        )}
                    </div>
                    <div className="mt-10 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex gap-3">
                        <FaClock className="text-primary mt-0.5" />
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
