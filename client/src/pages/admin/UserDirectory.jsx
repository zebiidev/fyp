import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaSearch, FaTrash, FaEye, FaFilter, FaChevronDown, FaBan, FaUnlock } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Loader from '../../components/ui/Loader';

const UserDirectory = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [deletingId, setDeletingId] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [blockingId, setBlockingId] = useState(null);

    useEffect(() => {
        fetchUsers(1, true);
    }, [roleFilter]);

    const fetchUsers = async (pageNum, reset = false) => {
        if (reset) setLoading(true);
        else setFetchingMore(true);

        try {
            const res = await api.get('/admin/users', {
                params: {
                    page: pageNum,
                    limit: 9,
                    role: roleFilter,
                    search: searchTerm
                }
            });

            if (reset) {
                setUsers(res.data.users);
            } else {
                setUsers(prev => [...prev, ...res.data.users]);
            }
            setTotalPages(res.data.pages);
            setPage(pageNum);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
            setFetchingMore(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers(1, true);
    };

    const loadMore = () => {
        if (page < totalPages) {
            fetchUsers(page + 1);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this account? This action is permanent.')) return;
        
        setDeletingId(userId);
        try {
            await api.delete(`/admin/users/${userId}`);
            toast.success('User deleted successfully');
            setUsers(users.filter(u => u._id !== userId));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete user');
        } finally {
            setDeletingId(null);
        }
    };

    const confirmBlock = (user) => {
        const toastId = toast(
            ({ closeToast }) => (
                <div className="space-y-3">
                    <p className="text-sm font-bold text-slate-800">Block this user?</p>
                    <p className="text-xs text-slate-500">
                        {user.name} will be unable to access the app until unblocked.
                    </p>
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => toast.dismiss(toastId)}
                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                toast.dismiss(toastId);
                                handleBlockToggle(user);
                            }}
                            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white"
                        >
                            Yes, Block
                        </button>
                    </div>
                </div>
            ),
            {
                autoClose: false,
                closeOnClick: false,
                draggable: false
            }
        );
    };

    const handleBlockToggle = async (user) => {
        const shouldBlock = !user.isBlocked;
        const reason = shouldBlock ? 'Blocked by admin' : '';

        setBlockingId(user._id);
        try {
            const res = await api.patch(`/admin/users/${user._id}/block`, { blocked: shouldBlock, reason });
            toast.success(res.data?.message || (shouldBlock ? 'User blocked' : 'User unblocked'));
            setUsers((prev) => prev.map((u) => (u._id === user._id ? res.data.user : u)));
            if (selectedUser && selectedUser._id === user._id) {
                setSelectedUser(res.data.user);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update user status');
        } finally {
            setBlockingId(null);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <FaUsers className="text-primary" /> User Management
                    </h1>
                    <p className="text-slate-500 font-medium italic mt-1">Directory of all registered riders and passengers.</p>
                </div>
                
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    {['all', 'rider', 'passenger'].map((role) => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${roleFilter === role ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            {role}s
                        </button>
                    ))}
                </div>
            </header>

            <form onSubmit={handleSearch} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                <FaSearch className="text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search by name, email, or registration number..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 font-medium outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="hidden">Search</button>
            </form>

            {loading ? (
                <Loader message="Accessing records..." />
            ) : users.length > 0 ? (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {users.map((user) => (
                                <motion.div
                                    key={user._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative"
                                >
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black
                                            ${user.role === 'rider' ? 'bg-indigo-50 text-primary' : 'bg-emerald-50 text-emerald-500'}`}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-black text-slate-800 truncate">{user.name}</h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg
                                                    ${user.role === 'rider' ? 'bg-indigo-50 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {user.role}
                                                </span>
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg
                                                    ${user.accountStatus === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                                    {user.accountStatus}
                                                </span>
                                                {user.isBlocked && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-rose-50 text-rose-600">
                                                        blocked
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400 font-bold uppercase tracking-tighter">Email</span>
                                            <span className="text-slate-700 font-medium truncate max-w-[150px]">{user.email}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400 font-bold uppercase tracking-tighter">Reg No</span>
                                            <span className="text-slate-700 font-medium">{user.registrationNumber || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400 font-bold uppercase tracking-tighter">Member Since</span>
                                            <span className="text-slate-700 font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-slate-50">
                                        <button 
                                            onClick={() => setSelectedUser(user)}
                                            className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <FaEye /> Details
                                        </button>
                                        <button 
                                            onClick={() => (user.isBlocked ? handleBlockToggle(user) : confirmBlock(user))}
                                            disabled={blockingId === user._id}
                                            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                                                user.isBlocked
                                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                                    : 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white'
                                            }`}
                                        >
                                            {user.isBlocked ? <FaUnlock /> : <FaBan />} {blockingId === user._id ? '...' : (user.isBlocked ? 'Unblock' : 'Block')}
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(user._id)}
                                            disabled={deletingId === user._id}
                                            className="flex-1 py-3 bg-rose-50 text-rose-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <FaTrash /> {deletingId === user._id ? '...' : 'Delete'}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {page < totalPages && (
                        <div className="flex justify-center pt-6">
                            <button
                                onClick={loadMore}
                                disabled={fetchingMore}
                                className="px-10 py-4 bg-white border border-slate-200 text-slate-800 rounded-full font-black text-xs uppercase tracking-widest shadow-sm hover:shadow-md hover:border-primary hover:text-primary transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                {fetchingMore ? 'Loading More...' : (
                                    <>
                                        View More <FaChevronDown className="animate-bounce" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-sm">
                        <FaUsers size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">No Users Found</h3>
                    <p className="text-slate-400 font-medium italic">Adjust your search or filter to find who you're looking for.</p>
                </div>
            )}

            {/* User Details Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedUser(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-white/20"
                        >
                            <div className={`p-8 ${selectedUser.role === 'rider' ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black shadow-lg
                                            ${selectedUser.role === 'rider' ? 'bg-primary text-white' : 'bg-emerald-500 text-white'}`}>
                                            {selectedUser.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-800">{selectedUser.name}</h2>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                                                    ${selectedUser.role === 'rider' ? 'bg-indigo-200 text-primary' : 'bg-emerald-200 text-emerald-800'}`}>
                                                    {selectedUser.role}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                                                    ${selectedUser.accountStatus === 'approved' ? 'bg-emerald-200 text-emerald-800' : 'bg-orange-200 text-orange-800'}`}>
                                                    {selectedUser.accountStatus}
                                                </span>
                                                {selectedUser.isBlocked && (
                                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-200 text-rose-800">
                                                        Blocked
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedUser(null)}
                                        className="p-3 hover:bg-white/50 rounded-2xl text-slate-400 transition-colors"
                                    >
                                        <FaChevronDown />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                            <p className="font-bold text-slate-800 break-all">{selectedUser.email}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration No</p>
                                            <p className="font-bold text-slate-800">{selectedUser.registrationNumber || 'Not Provided'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6 pt-2">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification</p>
                                            <p className={`font-bold ${selectedUser.isVerified ? 'text-emerald-500' : 'text-orange-500'}`}>
                                                {selectedUser.isVerified ? 'Verified Account' : 'Pending Verification'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Created</p>
                                            <p className="font-bold text-slate-800">{new Date(selectedUser.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                        </div>
                                    </div>
                                </div>

                                    <div className="pt-6 border-t border-slate-100 flex gap-4">
                                        <button 
                                            onClick={() => {
                                                handleDelete(selectedUser._id);
                                                setSelectedUser(null);
                                            }}
                                            className="px-6 py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <FaTrash /> Delete Account
                                        </button>
                                        <button 
                                            onClick={() => (selectedUser.isBlocked ? handleBlockToggle(selectedUser) : confirmBlock(selectedUser))}
                                            disabled={blockingId === selectedUser._id}
                                            className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                                                selectedUser.isBlocked
                                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                                    : 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white'
                                            }`}
                                        >
                                            {selectedUser.isBlocked ? <FaUnlock /> : <FaBan />} {blockingId === selectedUser._id ? '...' : (selectedUser.isBlocked ? 'Unblock' : 'Block')}
                                        </button>
                                        <button 
                                            onClick={() => setSelectedUser(null)}
                                            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all"
                                        >
                                            Close Details
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserDirectory;
