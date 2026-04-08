import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaSearch, FaTimes, FaTrashAlt, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import Loader from '../../components/ui/Loader';

const StatusPill = ({ status }) => {
    const styles = {
        valid: 'bg-emerald-50 text-emerald-600',
        used: 'bg-indigo-50 text-indigo-600',
        revoked: 'bg-rose-50 text-rose-500'
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status] || 'bg-slate-100 text-slate-500'}`}>
            {status || 'unknown'}
        </span>
    );
};

const RegistrationDirectory = () => {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [newNumbers, setNewNumbers] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const trimmedSearch = search.trim();
            const isSearchActive = trimmedSearch.length > 0;
            const res = await api.get('/admin/registrations', {
                params: {
                    search: trimmedSearch || undefined,
                    status: statusFilter || undefined,
                    limit: isSearchActive ? undefined : 5
                }
            });
            setRecords(res.data || []);
        } catch {
            toast.error('Failed to load registration numbers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchRecords();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, statusFilter]);

    const filteredRecords = useMemo(() => records, [records]);

    const handleAdd = async () => {
        const list = newNumbers
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean);
        if (list.length === 0) {
            toast.info('Add at least one registration number.');
            return;
        }
        setSaving(true);
        try {
            const res = await api.post('/admin/registrations', { numbers: list });
            toast.success(`Added ${res.data.inserted} new numbers. Skipped ${res.data.skipped}.`);
            setNewNumbers('');
            setShowAdd(false);
            fetchRecords();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add numbers');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await api.patch(`/admin/registrations/${id}`, { status });
            toast.success(`Marked as ${status}.`);
            fetchRecords();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Registration Directory</h1>
                    <p className="text-slate-500 font-medium italic">Verify, search, and manage registration numbers.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setShowAdd(true)}
                        className="px-5 py-3 bg-primary text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-100 flex items-center gap-2"
                    >
                        <FaPlus /> Add Numbers
                    </button>
                </div>
            </header>

            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                            <FaSearch size={14} />
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search registration number..."
                            className="w-full bg-slate-50 border-none rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600"
                    >
                        <option value="">All Status</option>
                        <option value="valid">Valid</option>
                        <option value="used">Used</option>
                        <option value="revoked">Revoked</option>
                    </select>
                    <button
                        type="button"
                        onClick={fetchRecords}
                        className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-lg"
                    >
                        Search
                    </button>
                </div>
            </div>

            {loading ? (
                <Loader message="Loading registry..." />
            ) : (
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 gap-1">
                        {filteredRecords.length > 0 ? (
                            filteredRecords.map((record) => (
                                <motion.div
                                    key={record._id}
                                    whileHover={{ x: 4 }}
                                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border-b border-slate-100 last:border-0"
                                >
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Registration Number</p>
                                        <p className="text-lg font-black text-slate-800">{record.number}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="text-xs text-slate-500 font-medium">
                                            {record.usedBy
                                                ? `Used by ${record.usedBy.name || 'User'}`
                                                : record.addedBy
                                                    ? `Added by ${record.addedBy.name || 'Admin'}`
                                                    : 'Unassigned'}
                                        </div>
                                        <StatusPill status={record.status} />
                                        {record.status !== 'used' && (
                                            record.status === 'valid' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusChange(record._id, 'revoked')}
                                                    className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 rounded-xl"
                                                >
                                                    <FaTrashAlt className="inline mr-1" /> Revoke
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusChange(record._id, 'valid')}
                                                    className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 rounded-xl"
                                                >
                                                    <FaCheckCircle className="inline mr-1" /> Reactivate
                                                </button>
                                            )
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="p-10 text-center text-slate-400 text-sm font-medium">
                                No registration numbers found.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
                    <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-slate-800">Add Registration Numbers</h3>
                            <button
                                type="button"
                                onClick={() => setShowAdd(false)}
                                className="w-9 h-9 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mb-3">
                            Add one registration number per line. Duplicates will be skipped automatically.
                        </p>
                        <textarea
                            rows={6}
                            value={newNumbers}
                            onChange={(e) => setNewNumbers(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary"
                            placeholder="FA19-BCS-001&#10;SP20-BCS-004&#10;..."
                        />
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowAdd(false)}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAdd}
                                disabled={saving}
                                className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-lg disabled:opacity-60"
                            >
                                {saving ? 'Saving...' : 'Add Numbers'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistrationDirectory;
