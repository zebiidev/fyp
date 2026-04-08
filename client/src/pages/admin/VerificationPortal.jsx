import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaCar, FaIdCard, FaCheck, FaTimes, 
    FaSearch, FaEye, FaCalendarAlt, FaInfoCircle
} from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const VerificationPortal = () => {
    const [selectedApp, setSelectedApp] = useState(null);
    const [mainPreview, setMainPreview] = useState('');
    const [apiApplications, setApiApplications] = useState([]);
    const [actionLoading, setActionLoading] = useState({ id: null, type: null }); // { id, type: 'approved' | 'rejected' }

    const fetchPending = async () => {
        try {
            const res = await api.get('/admin/riders/pending-verifications');
            const formattedApps = (res.data || []).map((user) => ({
                id: user._id,
                name: user.name,
                dept: user.department || 'N/A',
                vehicleType: user.vehicleDetails?.type || 'Vehicle',
                model: `${user.vehicleDetails?.model || ''}`.trim() || 'Not submitted',
                reg: user.vehicleDetails?.plateNumber || 'Not submitted',
                docs: {
                    vehicle: user.vehicleDetails?.images?.[0] || '',
                    plate: user.vehicleDetails?.images?.[1] || '',
                    license: user.verificationDocuments?.[0]?.url || ''
                },
                time: user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Pending'
            }));
            setApiApplications(formattedApps);
        } catch {
            toast.error('Failed to load pending verifications');
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (userId, status) => {
        setActionLoading({ id: userId, type: status });
        try {
            await api.put(`/admin/riders/${userId}/verify`, { status });
            toast.success(`Rider verification ${status}`);
            setApiApplications(prev => prev.filter(app => app.id !== userId));
            if (selectedApp?.id === userId) setSelectedApp(null);
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to ${status} rider`);
        } finally {
            setActionLoading({ id: null, type: null });
        }
    };

    const applications = useMemo(() => (
        apiApplications.length > 0 ? apiApplications : []
    ), [apiApplications]);

    return (
        <div className="space-y-8 pb-10">
            <header>
                <h1 className="text-3xl font-black text-slate-800">Rider Verification Portal</h1>
                <p className="text-slate-500 font-medium italic">Review and approve document submissions for new ride providers.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-w-0">
                {/* Applications List */}
                <div className="lg:col-span-1 space-y-4 min-w-0">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Verification Queue</h3>
                    {applications.length > 0 ? (
    applications.map((app) => (
        <motion.div 
            key={app.id}
            whileHover={{ x: 5 }}
            onClick={() => {
                setSelectedApp(app);
                setMainPreview(app.docs.vehicle);
            }}
            className={`p-6 rounded-[32px] border cursor-pointer transition-all overflow-hidden relative
                ${selectedApp?.id === app.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' 
                    : 'bg-white border-slate-100 hover:border-slate-300'}`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${selectedApp?.id === app.id ? 'bg-slate-800' : 'bg-slate-50 text-slate-400'}`}>
                    {app.vehicleType === 'Car' ? <FaCar /> : <FaCar />}
                </div>
                <span className="text-[9px] font-black uppercase opacity-60">{app.time}</span>
            </div>
            <h4 className="font-black text-lg">{app.name}</h4>
            <p className={`text-xs font-bold ${selectedApp?.id === app.id ? 'text-slate-400' : 'text-slate-500'}`}>
                {app.model} • {app.reg}
            </p>
            {selectedApp?.id === app.id && (
                <motion.div 
                    layoutId="active-indicator"
                    className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-5 h-20 bg-emerald-500 rounded-full"
                />
            )}
        </motion.div>
    ))
) : (
    <div className="text-center py-10 bg-slate-50 rounded-[28px] border border-dashed border-slate-200">
        <p className="text-sm text-slate-400 font-medium italic">No pending applications.</p>
    </div>
)}
                </div>

                {/* Review Detail Panel */}
                <div className="lg:col-span-2 min-w-0">
                    {selectedApp ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-50">
                                <div className="flex gap-6 items-center">
                                    <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center text-white text-2xl font-black">
                                        {selectedApp.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-2xl font-black text-slate-800 truncate">{selectedApp.name}</h2>
                                        <p className="text-sm font-bold text-slate-400 break-all">
                                            Application #{selectedApp.id} • <span className="inline-block">{selectedApp.dept} Department</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button 
                                        onClick={() => handleAction(selectedApp.id, 'rejected')}
                                        disabled={actionLoading.id === selectedApp.id}
                                        className="flex-1 md:flex-none px-8 py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-xs hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading.id === selectedApp.id && actionLoading.type === 'rejected' ? 'Rejecting...' : 'Reject App'}
                                    </button>
                                    <button 
                                        onClick={() => handleAction(selectedApp.id, 'approved')}
                                        disabled={actionLoading.id === selectedApp.id}
                                        className="flex-1 md:flex-none px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading.id === selectedApp.id && actionLoading.type === 'approved' ? (
                                            <>Approving...</>
                                        ) : (
                                            <>
                                                <FaCheck /> Approve Rider
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Vehicle Comparison</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Declared Model</p>
                                            <p className="text-sm font-black text-slate-700">{selectedApp.model}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Plate Number</p>
                                            <p className="text-sm font-black text-slate-700">{selectedApp.reg}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                        <FaInfoCircle className="text-amber-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-amber-800 font-medium leading-relaxed italic">
                                            Ensure the registration plate in the photo matches the text above and the vehicle model is consistent.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 min-w-0">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Documents Preview</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {Object.entries(selectedApp.docs).map(([key, src]) => (
                                            <div
                                                key={key}
                                                onClick={() => src && setMainPreview(src)}
                                                className={`relative group rounded-xl overflow-hidden shadow-sm border aspect-square ${
                                                    src ? 'cursor-pointer' : 'bg-slate-50'
                                                } ${mainPreview === src && src ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-slate-100'}`}
                                            >
                                                {src ? (
                                                    <>
                                                        <img src={src} alt={key} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <FaEye className="text-white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[9px] font-black uppercase tracking-widest text-slate-300">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-2">Click photos to expand</p>
                                </div>
                            </div>

                            {/* Full Image Review (Simulation) */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Main Vehicle Image</h3>
                                <div className="w-full h-80 rounded-[32px] overflow-hidden shadow-inner bg-slate-50 border-4 border-white translate-z-0">
                                    {mainPreview || selectedApp.docs.vehicle ? (
                                        <img src={mainPreview || selectedApp.docs.vehicle} alt="Vehicle Detail" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-black uppercase tracking-widest text-slate-300">
                                            No Preview Available
                                        </div>
                                    )}
                                </div>
                            </div>

                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center">
                            <div className="p-6 bg-white rounded-[32px] text-slate-200 shadow-sm mb-6">
                                <FaIdCard size={48} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Select an Application</h3>
                            <p className="text-sm text-slate-400 font-medium italic max-w-xs">
                                Choose a rider application from the queue to review their credentials and vehicle photos.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerificationPortal;

