import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaHistory, FaCar, FaMapMarkerAlt, FaCalendarAlt, FaStar, FaChevronRight, FaFileInvoiceDollar } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyRides, rateRide } from '../../store/slices/rideSlice';
import Loader from '../../components/ui/Loader';
import { toast } from 'react-toastify';

const normalizeId = (value) => (value ? value.toString() : '');

const HistoryCard = ({ ride, ratingDraft, onRate, onSubmit, isSubmitting }) => (
    <motion.div 
        whileHover={{ bg: 'rgb(248 250 252)' }}
        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-6 group cursor-pointer"
    >
        <div className="flex items-center gap-6 flex-1">
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-primary transition-all">
                <FaCar size={20} />
            </div>
            
            <div className="flex-1 space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                    <p className="text-sm font-bold text-slate-800">{ride.from} ➔ {ride.to}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 uppercase">
                        Completed
                    </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 font-medium font-sans">
                    <div className="flex items-center gap-1.5">
                        <FaCalendarAlt size={10} /> {ride.date}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <FaMapMarkerAlt size={10} /> {ride.driver}
                    </div>
                </div>
            </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-10 md:pl-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0">
            <div className="text-right">
                <p className="text-sm font-bold text-slate-800">Rs. {ride.price}</p>
                {ride.passengerRating ? (
                    <div className="flex items-center gap-1 text-xs text-warning font-bold mt-1">
                        <FaStar size={10} /> Your rating: {ride.passengerRating}
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-bold mt-1">
                        <FaStar size={10} /> Driver rating: {ride.driverRating}
                    </div>
                )}
                {!ride.passengerRating && (
                    <div className="mt-3 flex items-center gap-2 justify-end">
                        {[1, 2, 3, 4, 5].map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => onRate(ride.id, value)}
                                className="text-sm"
                            >
                                <FaStar className={value <= ratingDraft ? 'text-warning' : 'text-slate-300'} />
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => onSubmit(ride.id)}
                            disabled={isSubmitting || ratingDraft === 0}
                            className="ml-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary text-white disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving' : 'Submit'}
                        </button>
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all">
                    <FaFileInvoiceDollar size={14} />
                </button>
                <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all">
                    <FaChevronRight size={14} />
                </button>
            </div>
        </div>
    </motion.div>
);

const RideHistory = () => {
    const dispatch = useDispatch();
    const { myRides, loading } = useSelector((state) => state.rides);
    const { user } = useSelector((state) => state.auth);
    const currentUserId = user?.id || user?._id;
    const [ratingDrafts, setRatingDrafts] = useState({});
    const [submittingId, setSubmittingId] = useState(null);

    useEffect(() => {
        dispatch(fetchMyRides());
    }, [dispatch]);

    const history = useMemo(() => {
        return (myRides || [])
            .filter((ride) => {
                const passengerEntry = (ride.passengers || []).find((p) => {
                    const pid = p?.user?._id || p?.user;
                    return normalizeId(pid) === normalizeId(currentUserId);
                });
                if (!passengerEntry) return false;
                const rideStatus = (ride.status || '').toLowerCase();
                const passengerStatus = (passengerEntry?.status || '').toLowerCase();
                return rideStatus === 'completed' && passengerStatus !== 'rejected';
            })
            .map((ride) => ({
                id: ride._id,
                from: ride.pickupLocation,
                to: ride.dropoffLocation,
                date: ride.date ? new Date(ride.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
                driver: ride.driver?.name || 'Unknown',
                price: ride.pricePerSeat || 0,
                driverRating: ride.driver?.averageRating?.toFixed(1) || 'N/A',
                passengerRating: (ride.passengers || []).find((p) => {
                    const pid = p?.user?._id || p?.user;
                    return normalizeId(pid) === normalizeId(currentUserId);
                })?.rating
            }));
    }, [myRides, currentUserId]);

    const handleRate = (rideId, value) => {
        setRatingDrafts((prev) => ({ ...prev, [rideId]: value }));
    };

    const handleSubmit = async (rideId) => {
        const rating = ratingDrafts[rideId] || 0;
        if (!rating) {
            toast.error('Please select a rating first');
            return;
        }
        setSubmittingId(rideId);
        try {
            await dispatch(rateRide({ rideId, rating })).unwrap();
            toast.success('Thanks for your feedback!');
        } catch (err) {
            toast.error(err || 'Failed to submit rating');
        } finally {
            setSubmittingId(null);
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Ride History</h1>
                    <p className="text-sm text-slate-500">Your past activity and contributions</p>
                </div>
            </header>

            {loading ? (
                <Loader message="Loading ride history..." />
            ) : history.length > 0 ? (
                <div className="space-y-4">
                    {history.map(ride => (
                        <HistoryCard
                            key={ride.id}
                            ride={ride}
                            ratingDraft={ratingDrafts[ride.id] || 0}
                            onRate={handleRate}
                            onSubmit={handleSubmit}
                            isSubmitting={submittingId === ride.id}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <FaHistory size={32} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-400 text-sm font-medium">No completed rides yet</p>
                    <p className="text-xs text-slate-300 mt-1">Your ride history will appear here once you complete a trip.</p>
                </div>
            )}
        </div>
    );
};

export default RideHistory;
