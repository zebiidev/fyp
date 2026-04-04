import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUserCheck, FaUserTimes, FaCheck, FaTimes, FaSearch } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Loader from '../../components/ui/Loader';

const UserApprovals = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({ id: null, type: null }); // { id, type: 'approved' | 'rejected' }
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const res = await api.get('/admin/users/pending');
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to fetch pending users');
            setLoading(false);
        }
    };

    const handleAction = async (userId, status) => {
        setActionLoading({ id: userId, type: status });
        try {
            await api.put(`/admin/users/${userId}/status`, { status });
            toast.success(`User ${status} successfully`);
            setUsers(users.filter(user => user._id !== userId));
        } catch (err) {
             toast.error(err.response?.data?.message || `Failed to ${status} user`);
        } finally {
            setActionLoading({ id: null, type: null });
        }
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.registrationNumber && user.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">User Approvals</h1>
                    <p className="text-slate-500 mt-1">Review and approve new account requests</p>
                </div>
            </header>

            <div className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent`}>
                <FaSearch className="text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search by name, email, or Reg No..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 font-medium outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <Loader message="Loading requests..." />
            ) : filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => (
                        <motion.div 
                            key={user._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl font-bold text-slate-500 uppercase">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{user.name}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${user.role === 'rider' ? 'bg-indigo-100 text-primary' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-2 mb-6 text-sm">
                                <p className="flex justify-between">
                                    <span className="text-slate-500 font-bold">Email:</span>
                                    <span className="font-medium text-slate-800">{user.email}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-slate-500 font-bold">Reg No:</span>
                                    <span className="font-medium text-slate-800">{user.registrationNumber || 'N/A'}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-slate-500 font-bold">Applied:</span>
                                    <span className="font-medium text-slate-800">{new Date(user.createdAt).toLocaleDateString()}</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => handleAction(user._id, 'approved')}
                                    disabled={actionLoading.id === user._id}
                                    className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-2 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading.id === user._id && actionLoading.type === 'approved' ? (
                                        <>Approving...</>
                                    ) : (
                                        <>
                                            <FaCheck /> Approve
                                        </>
                                    )}
                                </button>
                                <button 
                                    onClick={() => handleAction(user._id, 'rejected')}
                                    disabled={actionLoading.id === user._id}
                                    className="flex items-center justify-center gap-2 bg-rose-500 text-white py-2 rounded-xl font-bold text-sm hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading.id === user._id && actionLoading.type === 'rejected' ? (
                                        <>Rejecting...</>
                                    ) : (
                                        <>
                                            <FaTimes /> Reject
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <FaUserCheck size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">No Pending Requests</h3>
                    <p className="text-slate-500">All caught up! No new users to approve.</p>
                </div>
            )}
        </div>
    );
};

export default UserApprovals;
