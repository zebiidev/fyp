import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaMapMarkerAlt, FaMotorcycle, FaStar, FaComments, FaSyncAlt, FaIdCard, FaUserGraduate } from 'react-icons/fa';
import { fetchAreaRiders } from '../../store/slices/areaRiderSlice';
import Loader from '../../components/ui/Loader';

const RiderCard = ({ rider }) => {
    const vehicleLabel = `${rider.vehicleDetails?.make || ''} ${rider.vehicleDetails?.model || ''}`.trim();
    const sharedAreaLabel = rider.areaMatch?.sharedTokens?.length
        ? rider.areaMatch.sharedTokens.map((token) => token.charAt(0).toUpperCase() + token.slice(1)).join(', ')
        : 'Same area match';

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    <img
                        src={rider.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(rider.name || 'Rider')}`}
                        alt={rider.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-indigo-100"
                    />
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-800 truncate">{rider.name}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            {rider.registrationNumber || 'Student Rider'}
                        </p>
                    </div>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Area Match</p>
                    <p className="text-lg font-bold text-emerald-800">{rider.areaMatch?.score || 0}%</p>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{rider.department || 'Not added yet'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Programme / Semester</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                        {[rider.programme, rider.semester].filter(Boolean).join(' • ') || 'Not added yet'}
                    </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vehicle</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{vehicleLabel || 'Vehicle details pending'}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rating</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <FaStar className="text-warning" />
                        {Number(rider.averageRating || 0).toFixed(1)} ({Number(rider.totalRatings || 0)} ratings)
                    </p>
                </div>
            </div>

            <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Shared Area Keywords</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{sharedAreaLabel}</p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-white/80 px-3 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rider Area</p>
                        <p className="mt-1 font-medium text-slate-700">{rider.areaMatch?.riderArea || rider.address}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 px-3 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saved Address</p>
                        <p className="mt-1 font-medium text-slate-700">{rider.address}</p>
                    </div>
                </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Link
                    to={`/passenger/messages?userId=${encodeURIComponent(rider._id)}&name=${encodeURIComponent(rider.name)}`}
                    className="flex-1 rounded-2xl bg-primary px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-white hover:bg-primary-dark transition-all"
                >
                    <span className="inline-flex items-center gap-2">
                        <FaComments />
                        Message Rider
                    </span>
                </Link>
                <div className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-center text-xs font-black uppercase tracking-widest text-slate-500">
                    <span className="inline-flex items-center gap-2">
                        <FaMapMarkerAlt />
                        {rider.gender || 'Rider'} from your area
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

const AreaRiders = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { riders, passengerArea, passengerAddress, loading, error } = useSelector((state) => state.areaRiders);

    useEffect(() => {
        if (user?.address?.trim()) {
            dispatch(fetchAreaRiders());
        }
    }, [dispatch, user?.address]);

    const handleRefresh = () => {
        dispatch(fetchAreaRiders());
    };

    if (!user?.address?.trim()) {
        return (
            <div className="space-y-6">
                <header>
                    <h1 className="text-2xl font-bold text-slate-800">Riders from my area</h1>
                    <p className="text-sm text-slate-500">Add your address first so we can find rider students from the same place.</p>
                </header>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center">
                        <FaMapMarkerAlt size={24} />
                    </div>
                    <h2 className="mt-5 text-xl font-bold text-slate-800">Address needed</h2>
                    <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
                        This feature works by matching the place name in your saved address with approved rider students.
                    </p>
                    <Link
                        to="/passenger/settings"
                        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-primary-dark transition-all"
                    >
                        <FaIdCard />
                        Update Address
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Riders from my area</h1>
                    <p className="text-sm text-slate-500">See rider students whose saved address matches the same place as yours.</p>
                </div>
                <button
                    type="button"
                    onClick={handleRefresh}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
                >
                    <FaSyncAlt />
                    Refresh List
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your saved address</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{passengerAddress || user.address}</p>
                </div>
                <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detected area</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{passengerArea || 'Area not detected yet'}</p>
                </div>
                <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Matched riders</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{riders.length} rider student{riders.length === 1 ? '' : 's'} found</p>
                </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-r from-indigo-50 via-white to-emerald-50 border border-slate-100 p-5">
                <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-2xl bg-white p-3 text-primary shadow-sm">
                        <FaUserGraduate />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">How this match works</p>
                        <p className="mt-1 text-sm text-slate-500">
                            The system ignores house numbers and compares the place words in addresses, so entries like
                            ` 197/W Block Farid Town ` and ` Farid Town ` can still match.
                        </p>
                    </div>
                </div>
            </div>

            {loading ? <Loader message="Finding rider students from your area..." /> : null}

            {!loading && error ? (
                <div className="rounded-3xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-600">
                    {error}
                </div>
            ) : null}

            {!loading && !error && riders.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-white text-slate-400 flex items-center justify-center border border-slate-200">
                        <FaMotorcycle size={24} />
                    </div>
                    <h2 className="mt-5 text-xl font-bold text-slate-800">No riders found for this area yet</h2>
                    <p className="mt-2 text-sm text-slate-500 max-w-2xl mx-auto">
                        We checked approved rider students against your saved area name but did not find a close match right now.
                    </p>
                </div>
            ) : null}

            {!loading && !error && riders.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {riders.map((rider) => (
                        <RiderCard key={rider._id} rider={rider} />
                    ))}
                </div>
            ) : null}
        </div>
    );
};

export default AreaRiders;
