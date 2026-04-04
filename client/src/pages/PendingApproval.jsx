import React from 'react';
import { Link } from 'react-router-dom';
import { FaHourglassHalf } from 'react-icons/fa';

const PendingApproval = () => (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-10 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center mb-6">
                <FaHourglassHalf size={28} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-3">Approval Pending</h1>
            <p className="text-slate-500 font-medium mb-8">
                Your account is created, but access to the dashboard is locked until an admin approves it.
                Please check back later.
            </p>
            <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
            >
                Back to Login
            </Link>
        </div>
    </div>
);

export default PendingApproval;
