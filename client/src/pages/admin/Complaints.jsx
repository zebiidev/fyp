import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFlag, FaCheck, FaClock, FaUser, FaSearch, FaFilter } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Loader from '../../components/ui/Loader';

const AdminComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolvingId, setResolvingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [statusDraft, setStatusDraft] = useState('Pending');
    const [responseDraft, setResponseDraft] = useState('');
    const [filter, setFilter] = useState('all'); // all, Pending, In Progress, Resolved, Rejected
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const res = await api.get('/complaints');
            setComplaints(res.data);
            setLoading(false);
        } catch (err) {
            toast.error('Failed to fetch complaints');
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        setResolvingId(id);
        try {
            await api.put(`/complaints/${id}`, { status: 'Resolved' });
            toast.success('Complaint marked as resolved');
            setComplaints(complaints.map(c => c._id === id ? { ...c, status: 'Resolved' } : c));
        } catch (err) {
            toast.error('Failed to resolve complaint');
        } finally {
            setResolvingId(null);
        }
    };

    const startEdit = (complaint) => {
        setEditingId(complaint._id);
        setStatusDraft(complaint.status || 'Pending');
        setResponseDraft(complaint.adminResponse || '');
    };

    const handleUpdate = async (id) => {
        setResolvingId(id);
        try {
            await api.put(`/complaints/${id}`, {
                status: statusDraft,
                adminResponse: responseDraft
            });
            toast.success('Complaint updated');
            setComplaints(complaints.map(c => c._id === id ? { 
                ...c, 
                status: statusDraft, 
                adminResponse: responseDraft 
            } : c));
            setEditingId(null);
        } catch (err) {
            toast.error('Failed to update complaint');
        } finally {
            setResolvingId(null);
        }
    };

    const filteredComplaints = complaints.filter(c => {
        const matchesFilter = filter === 'all' || c.status === filter;
        const matchesSearch = c.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             c.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             c.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-8 pb-10">
            <header>
                <h1 className="text-3xl font-black text-slate-800">Support & Complaints</h1>
                <p className="text-slate-500 font-medium italic">Manage user reports and system grievances.</p>
            </header>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <FaSearch className="text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search complaints, users, or subjects..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    {['all', 'Pending', 'In Progress', 'Resolved', 'Rejected'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${filter === f ? 'bg-primary text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <Loader message="Fetching reports..." />
            ) : filteredComplaints.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    <AnimatePresence>
                        {filteredComplaints.map((complaint) => (
                            <motion.div
                                key={complaint._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group"
                            >
                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-shrink-0">
                                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-xl font-black
                                            ${complaint.status === 'resolved' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                            <FaFlag />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                                {complaint.type}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg
                                                ${complaint.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' : complaint.status === 'In Progress' ? 'bg-indigo-50 text-indigo-600' : complaint.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-orange-50 text-orange-600'}`}>
                                                {complaint.status}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-auto">
                                                <FaClock className="inline mr-1" /> {new Date(complaint.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 mb-2">{complaint.subject}</h3>
                                        <p className="text-slate-600 font-medium text-sm leading-relaxed mb-6">
                                            {complaint.description}
                                        </p>
                                        {complaint.adminResponse && (
                                            <div className="mb-6 bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Admin Response</p>
                                                <p className="text-sm text-indigo-700 font-medium">{complaint.adminResponse}</p>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">
                                                    <FaUser />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Reported by</p>
                                                    <p className="text-xs font-bold text-slate-800 leading-none">{complaint.user?.name || 'Deleted User'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {complaint.status !== 'Resolved' && (
                                                    <button
                                                        onClick={() => handleResolve(complaint._id)}
                                                        disabled={resolvingId === complaint._id}
                                                        className="px-5 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-100 hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {resolvingId === complaint._id ? 'Resolving...' : (
                                                            <>
                                                                <FaCheck /> Mark Resolved
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => startEdit(complaint)}
                                                    className="px-5 py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                                                >
                                                    Update Status
                                                </button>
                                            </div>
                                        </div>

                                        {editingId === complaint._id && (
                                            <div className="mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Status</label>
                                                        <select
                                                            value={statusDraft}
                                                            onChange={(e) => setStatusDraft(e.target.value)}
                                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-slate-900"
                                                        >
                                                            {['Pending', 'In Progress', 'Resolved', 'Rejected'].map((status) => (
                                                                <option key={status} value={status}>{status}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Admin Response</label>
                                                        <input
                                                            type="text"
                                                            value={responseDraft}
                                                            onChange={(e) => setResponseDraft(e.target.value)}
                                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-slate-900"
                                                            placeholder="Optional response shown to the user..."
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleUpdate(complaint._id)}
                                                        disabled={resolvingId === complaint._id}
                                                        className="px-5 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-600 transition-all disabled:opacity-60"
                                                    >
                                                        Save Update
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="px-5 py-3 bg-white border border-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-sm">
                        <FaCheck size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Clean Slate!</h3>
                    <p className="text-slate-400 font-medium italic">No complaints found matching your criteria.</p>
                </div>
            )}
        </div>
    );
};

export default AdminComplaints;
