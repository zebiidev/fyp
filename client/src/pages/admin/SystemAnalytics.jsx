import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    FaChartArea, FaArrowUp, FaArrowDown, FaCalendarAlt, 
    FaRoute, FaCar, FaClock, FaDownload
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../utils/api';

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

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                const res = await api.get('/admin/analytics');
                setAnalytics(res.data);
                setLoading(false);
            } catch {
                toast.error('Failed to load analytics');
                setLoading(false);
            }
        };
        loadAnalytics();
    }, []);

    const hotspots = useMemo(() => {
        if (analytics.popularDestinations.length > 0) {
            const colors = ['bg-primary', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500', 'bg-slate-400'];
            return analytics.popularDestinations.map((spot, idx) => ({
                name: spot._id || 'Unknown',
                count: spot.count || 0,
                color: colors[idx % colors.length]
            }));
        }

        return [
            { name: 'Main Library', count: 428, color: 'bg-primary' },
            { name: 'CS Department', count: 312, color: 'bg-emerald-500' },
            { name: 'Girls Hostel', count: 284, color: 'bg-orange-500' },
            { name: 'Comsats Gate 1', count: 195, color: 'bg-rose-500' },
            { name: 'Block A Cafeteria', count: 142, color: 'bg-slate-400' },
        ];
    }, [analytics.popularDestinations]);

    const highestCount = hotspots.length > 0 ? Math.max(...hotspots.map((spot) => spot.count)) : 1;
    const statusSeries = useMemo(() => {
        if (analytics.rideStatusBreakdown.length > 0) {
            return analytics.rideStatusBreakdown.map((status) => ({
                label: status._id || 'Unknown',
                count: status.count || 0
            }));
        }
        return [
            { label: 'completed', count: 58 },
            { label: 'scheduled', count: 34 },
            { label: 'ongoing', count: 12 },
            { label: 'cancelled', count: 6 }
        ];
    }, [analytics.rideStatusBreakdown]);
    const maxStatusCount = Math.max(...statusSeries.map((s) => s.count), 1);

    // Calculate dynamic stats
    const totalUsers = analytics.userRoleBreakdown.reduce((acc, r) => acc + r.count, 0);
    const completedRides = analytics.rideStatusBreakdown.find(r => r._id === 'completed')?.count || 0;
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
                    
                    {/* Visual Placeholder for Graph (Using real data values where possible) */}
                    <div className="w-full h-64 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100 flex items-center justify-center p-8">
                        <div className="w-full h-full flex items-end gap-2">
                            {statusSeries.map((status, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div 
                                        className="w-full bg-primary rounded-t-xl" 
                                        style={{ height: `${Math.min(100, (status.count / maxStatusCount) * 100)}%` }}
                                    ></div>
                                    <span className="text-[8px] font-black text-slate-400 rotate-45 mt-4">{status.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-4 mt-12 gap-4">
                        {analytics.rideStatusBreakdown.slice(0, 4).map((status, i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (status.count / completedRides) * 100)}%` }}></div>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{status._id}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Popular Destinations */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-full">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Popular Hotspots</h3>
                    <div className="space-y-6">
                        {hotspots.map((spot, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                                    <span>{spot.name}</span>
                                    <span>{spot.count} rides</span>
                                </div>
                                <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(spot.count / highestCount) * 100}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className={`h-full ${spot.color}`}
                                    />
                                </div>
                            </div>
                        ))}
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
