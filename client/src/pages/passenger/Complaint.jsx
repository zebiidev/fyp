import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaExclamationCircle, FaPlus, FaHistory, FaCheckCircle,
    FaClock, FaTimesCircle, FaPaperPlane, FaSpinner
} from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';


const ComplaintItem = ({ subject, status, date, type, description, adminResponse, ticketId }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
    >
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                    status === 'Resolved' ? 'bg-emerald-50 text-emerald-500' :
                    status === 'In Progress' ? 'bg-indigo-50 text-indigo-500' :
                    status === 'Pending' ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'
                }`}>
                    {status === 'Resolved' ? <FaCheckCircle /> :
                        status === 'Pending' ? <FaClock /> : <FaTimesCircle />}
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-sm">{subject}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{type} • {date}</p>
                </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' :
                status === 'In Progress' ? 'bg-indigo-50 text-indigo-600' :
                status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
            }`}>
                {status}
            </span>
        </div>
        {ticketId && (
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">
                Ticket {ticketId}
            </p>
        )}
        <p className="text-slate-500 text-xs leading-relaxed bg-slate-50 p-3 rounded-xl">
            {description}
        </p>
        {adminResponse && (
            <div className="mt-3 bg-indigo-50/70 border border-indigo-100 rounded-xl p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Admin Response</p>
                <p className="text-xs text-indigo-700 font-medium">{adminResponse}</p>
            </div>
        )}
    </motion.div>
);

const Complaint = () => {
    const { user } = useSelector((state) => state.auth);
    const isRider = user?.role === 'rider';
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [complaints, setComplaints] = useState([]);
    const issueTypes = isRider
        ? ['Passenger Behavior', 'Route Issue', 'Vehicle Issue', 'Safety', 'App Bug', 'Other']
        : ['Ride Issue', 'Driver Behavior', 'App Bug', 'Payment', 'Other'];

    const [formData, setFormData] = useState({
        type: issueTypes[0],
        subject: issueTypes[0],
        description: ''
    });

    const loadComplaints = async () => {
        try {
            const res = await api.get('/complaints/my');
            if (Array.isArray(res.data)) {
                setComplaints(res.data.map((item) => ({
                    id: item._id,
                    type: item.type,
                    subject: item.subject,
                    description: item.description,
                    status: item.status,
                    adminResponse: item.adminResponse,
                    ticketId: item.ticketId,
                    date: new Date(item.createdAt).toISOString().split('T')[0]
                })));
            }
        } catch {
            // API unavailable – keep empty list
        }
    };

    useEffect(() => {
        loadComplaints();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await api.post('/complaints', formData);
            const newComplaint = {
                id: res.data._id,
                ...formData,
                status: res.data.status || 'Pending',
                adminResponse: res.data.adminResponse,
                ticketId: res.data.ticketId,
                date: new Date(res.data.createdAt || Date.now()).toISOString().split('T')[0]
            };
            setComplaints((prev) => [newComplaint, ...prev]);
            toast.success('Complaint submitted.');
        } catch {
            const newComplaint = {
                id: Date.now(),
                ...formData,
                status: 'Pending',
                date: new Date().toISOString().split('T')[0]
            };
            setComplaints((prev) => [newComplaint, ...prev]);
            toast.info('Backend unavailable, complaint saved locally.');
        } finally {
            setIsSubmitting(false);
            setShowForm(false);
            setFormData({ type: issueTypes[0], subject: issueTypes[0], description: '' });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <FaExclamationCircle className="text-rose-500" /> Support & Complaints
                    </h1>
                    <p className="text-slate-500 font-medium italic mt-2">
                        We're here to help. Report issues or share your feedback.
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3 bg-slate-800 text-white rounded-2xl font-black text-xs shadow-xl shadow-slate-200 flex items-center gap-2"
                >
                    <FaPlus /> File New Complaint
                </motion.button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-200">
                        <div className="relative z-10">
                            <h3 className="text-xl font-black mb-2">Help Center</h3>
                            <p className="text-indigo-100 text-xs font-medium leading-relaxed mb-6">
                                Before filing a complaint, check our FAQ section for quick solutions to common problems.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-widest">Your Statistics</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                <span className="text-xs font-bold text-slate-500">Total Reports</span>
                                <span className="text-lg font-black text-slate-800">{complaints.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                <span className="text-xs font-bold text-slate-500">Resolved</span>
                                <span className="text-lg font-black text-emerald-500">
                                    {complaints.filter((c) => c.status === 'Resolved').length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <FaHistory className="text-slate-400" />
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">History</h3>
                    </div>

                    <div className="space-y-4">
                        {complaints.length > 0 ? (
                            complaints.map((complaint) => (
                                <ComplaintItem key={complaint.id} {...complaint} />
                            ))
                        ) : (
                            <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <FaHistory className="mx-auto text-slate-300 mb-4" size={32} />
                                <p className="text-slate-400 text-sm font-medium">No complaints filed yet</p>
                                <p className="text-xs text-slate-300 mt-1">Any complaints you file will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowForm(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30 }}
                            className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden p-8 md:p-10"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-slate-800">New Complaint</h2>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"
                                >
                                    <FaTimesCircle size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Issue Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {issueTypes.map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData((prev) => ({ ...prev, type, subject: type }))}
                                                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all text-left ${
                                                    formData.type === type
                                                        ? 'bg-primary text-white shadow-lg shadow-indigo-100'
                                                        : 'bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-primary'
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-medium">
                                        Please add details about "{formData.type}" below.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary placeholder:font-medium placeholder:text-slate-300"
                                        placeholder="Brief title of the issue..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Description</label>
                                    <textarea
                                        required
                                        rows="4"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary placeholder:font-medium placeholder:text-slate-300 resize-none"
                                        placeholder="Please provide specific details..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-slate-800 text-white rounded-[24px] font-black text-sm shadow-xl shadow-slate-200 hover:bg-slate-900 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FaSpinner className="animate-spin" /> Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <FaPaperPlane /> Submit Report
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Complaint;
