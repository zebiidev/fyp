import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaUserShield, FaSearch, FaUserPlus, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Loader from '../../components/ui/Loader';

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [users, setUsers] = useState([]);
    const [loadingAdmins, setLoadingAdmins] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [creating, setCreating] = useState(false);
    const [promotingId, setPromotingId] = useState(null);
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        registrationNumber: ''
    });

    const fetchAdmins = async () => {
        setLoadingAdmins(true);
        try {
            const res = await api.get('/admin/admins');
            setAdmins(res.data || []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load admins');
        } finally {
            setLoadingAdmins(false);
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await api.get('/admin/users', {
                params: {
                    page: 1,
                    limit: 8,
                    role: 'all',
                    search: searchTerm
                }
            });
            setUsers(res.data?.users || []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load users');
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers();
    };

    const handlePromote = async (userId) => {
        if (!window.confirm('Promote this user to admin?')) return;
        setPromotingId(userId);
        try {
            await api.put(`/admin/admins/${userId}/promote`);
            toast.success('User promoted to admin.');
            setUsers((prev) => prev.filter((u) => u._id !== userId));
            fetchAdmins();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to promote user');
        } finally {
            setPromotingId(null);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) {
            toast.error('Name, email, and password are required.');
            return;
        }
        setCreating(true);
        try {
            await api.post('/admin/admins', form);
            toast.success('Admin created successfully.');
            setForm({ name: '', email: '', password: '', registrationNumber: '' });
            fetchAdmins();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create admin');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <FaUserShield className="text-primary" /> Admin Management
                    </h1>
                    <p className="text-slate-500 font-medium italic mt-1">Create and manage administrator access for the platform.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Existing Admins */}
                <div className="lg:col-span-1 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-6">Current Admins</h3>
                    {loadingAdmins ? (
                        <Loader message="Loading admins..." />
                    ) : admins.length === 0 ? (
                        <p className="text-sm text-slate-400">No admins found.</p>
                    ) : (
                        <div className="space-y-4">
                            {admins.map((admin) => (
                                <div key={admin._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-primary flex items-center justify-center font-black">
                                        {admin.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{admin.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{admin.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Promote Existing User */}
                <div className="lg:col-span-1 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-4">Promote User</h3>
                    <form onSubmit={handleSearch} className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3 mb-4">
                        <FaSearch className="text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by name or email..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit" className="hidden">Search</button>
                    </form>
                    {loadingUsers ? (
                        <Loader message="Searching users..." />
                    ) : users.length === 0 ? (
                        <p className="text-sm text-slate-400">Search to find a user to promote.</p>
                    ) : (
                        <div className="space-y-3">
                            {users.map((user) => (
                                <div key={user._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{user.email}</p>
                                    </div>
                                    <button
                                        onClick={() => handlePromote(user._id)}
                                        disabled={promotingId === user._id}
                                        className="px-3 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-60"
                                    >
                                        {promotingId === user._id ? '...' : 'Promote'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create Admin */}
                <div className="lg:col-span-1 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-4">Create New Admin</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Password</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Registration No (Optional)</label>
                            <input
                                type="text"
                                value={form.registrationNumber}
                                onChange={(e) => setForm((prev) => ({ ...prev, registrationNumber: e.target.value }))}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={creating}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            <FaUserPlus /> {creating ? 'Creating...' : 'Create Admin'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-[28px] p-5 flex items-start gap-3">
                <FaCheckCircle className="text-emerald-500 mt-1" />
                <p className="text-sm text-emerald-700 font-medium">
                    Tip: Promote existing users whenever possible so their profile data stays intact.
                </p>
            </div>
        </div>
    );
};

export default AdminManagement;
