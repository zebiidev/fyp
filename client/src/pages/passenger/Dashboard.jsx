import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    FaCar,
    FaCalendarCheck,
    FaStar,
    FaArrowRight,
    FaClock,
    FaCheckCircle,
    FaInfoCircle,
    FaExclamationCircle,
    FaPhone
} from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyRides, rateRide } from '../../store/slices/rideSlice';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const toLower = (value) => (value || '').toString().toLowerCase();
const normalizeId = (value) => (value ? value.toString() : '');

const parseRideDateTime = (ride) => {
    if (!ride?.date) return null;
    const dateObj = new Date(ride.date);
    if (!ride?.time) return dateObj;
    const [timePart, meridiemRaw] = ride.time.trim().split(' ');
    const [hoursRaw, minutesRaw] = (timePart || '').split(':');
    let hours = Number(hoursRaw);
    const minutes = Number(minutesRaw || 0);
    const meridiem = toLower(meridiemRaw);
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
        if (meridiem === 'pm' && hours < 12) hours += 12;
        if (meridiem === 'am' && hours === 12) hours = 0;
        dateObj.setHours(hours, minutes, 0, 0);
    }
    return dateObj;
};

const getEtaLabel = (rideDateTime, status, isExpired) => {
    const normalizedStatus = toLower(status);
    if (normalizedStatus === 'completed') return 'Ride completed';
    if (normalizedStatus === 'cancelled') return 'Ride cancelled';
    if (!rideDateTime) return 'ETA unavailable';
    if (isExpired) return 'Ride date has passed';
    const diffMs = rideDateTime.getTime() - Date.now();
    if (diffMs <= 0) return 'Arriving soon';
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `ETA: ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    return remainingMinutes > 0
        ? `ETA: ${diffHours}h ${remainingMinutes}m`
        : `ETA: ${diffHours}h`;
};

const formatDateTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Just now';
    return date.toLocaleString([], {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const StatCard = ({ icon: Icon, label, value, trend, trendUp }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
    >
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 text-primary rounded-xl">
                <Icon size={20} />
            </div>
            {trend ? (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {trend}
                </span>
            ) : null}
        </div>
        <div>
            <p className="text-slate-400 text-sm font-medium">{label}</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
        </div>
    </motion.div>
);

const ActivityItem = ({ type, title, subtitle, time, status }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors px-2 rounded-xl">
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${type === 'ride' ? 'bg-indigo-50 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                {type === 'ride' ? <FaCar /> : <FaCheckCircle />}
            </div>
            <div>
                <h4 className="text-sm font-bold text-slate-800">{title}</h4>
                <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-xs font-bold text-slate-800">{time}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${status === 'completed' ? 'text-emerald-500' : 'text-primary'}`}>
                {status}
            </p>
        </div>
    </div>
);

const PassengerDashboard = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { myRides, loading, error } = useSelector((state) => state.rides);
    const [ratingDraft, setRatingDraft] = useState(0);
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [activityPage, setActivityPage] = useState(1);
    const activityPageSize = 4;
    const currentUserId = user?.id || user?._id;

    useEffect(() => {
        dispatch(fetchMyRides());
    }, [dispatch]);

    const dashboardData = useMemo(() => {
        const mappedRides = (myRides || []).map((ride) => {
            const passengerEntry = (ride.passengers || []).find((p) => {
                const passengerId = p?.user?._id || p?.user;
                return normalizeId(passengerId) === normalizeId(currentUserId);
            });
            const passengerStatus = toLower(passengerEntry?.status);
            const rideStatus = toLower(ride.status);
            const rideDateTime = parseRideDateTime(ride);
            const requestedAtValue = passengerEntry?.requestedAt || ride?.createdAt || null;
            const requestedAtCandidateMs = requestedAtValue ? new Date(requestedAtValue).getTime() : 0;
            const requestedAtMs = Number.isFinite(requestedAtCandidateMs) ? requestedAtCandidateMs : 0;
            // A ride is expired if its date+time is more than 2 hours past
            // and was never marked completed/cancelled.
            const TWO_HOURS = 2 * 60 * 60 * 1000;
            const isExpired = !['completed', 'cancelled'].includes(rideStatus)
                && rideDateTime
                && (Date.now() - rideDateTime.getTime() > TWO_HOURS);
            const effectiveStatus = ['completed', 'cancelled'].includes(rideStatus)
                ? rideStatus
                : isExpired
                    ? 'expired'
                    : (passengerStatus || rideStatus || 'pending');
            const driverVehicle = ride.driver?.vehicleDetails || ride.vehicle || {};
            return {
                id: ride._id,
                pickup: ride.pickupLocation,
                dropoff: ride.dropoffLocation,
                time: ride.time,
                date: ride.date,
                dateTime: rideDateTime,
                requestedAtMs,
                status: effectiveStatus,
                rideStatus,
                isExpired: Boolean(isExpired),
                price: ride.pricePerSeat,
                passengerRating: passengerEntry?.rating,
                driver: {
                    id: normalizeId(ride.driver?._id || ride.driver),
                    name: ride.driver?.name || 'Assigned driver',
                    rating: Number(ride.driver?.averageRating || 0),
                    avatar: ride.driver?.avatar || '',
                    vehicleName: `${driverVehicle?.make || ''} ${driverVehicle?.model || ''}`.trim() || 'Vehicle pending',
                    plateNumber: driverVehicle?.plateNumber || 'N/A'
                }
            };
        });

        const upcomingStatuses = ['pending', 'accepted', 'scheduled', 'active', 'ongoing'];
        const completedStatuses = ['completed'];
        const nowMs = Date.now();
        const upcoming = mappedRides
            .filter((ride) => upcomingStatuses.includes(toLower(ride.status)) && !ride.isExpired)
            .sort((a, b) => {
                const aTime = a.dateTime?.getTime();
                const bTime = b.dateTime?.getTime();
                const aHasTime = Number.isFinite(aTime);
                const bHasTime = Number.isFinite(bTime);
                if (aHasTime && bHasTime) return aTime - bTime;
                if (aHasTime) return -1;
                if (bHasTime) return 1;
                return 0;
            });
        const completed = mappedRides.filter((ride) => completedStatuses.includes(toLower(ride.status)) || ride.isExpired);
        const lastUnrated = completed
            .filter((ride) => !ride.passengerRating && !ride.isExpired)
            .sort((a, b) => (b.dateTime?.getTime() || 0) - (a.dateTime?.getTime() || 0))[0] || null;
        const activeRide = mappedRides
            .filter((ride) => ['active', 'ongoing'].includes(toLower(ride.rideStatus)) && !ride.isExpired)
            .sort((a, b) => (b.dateTime?.getTime() || 0) - (a.dateTime?.getTime() || 0))[0] || null;
        const latestUpcomingBooking = upcoming
            .slice()
            .sort((a, b) => {
                if ((b.requestedAtMs || 0) !== (a.requestedAtMs || 0)) return (b.requestedAtMs || 0) - (a.requestedAtMs || 0);
                return (b.dateTime?.getTime() || 0) - (a.dateTime?.getTime() || 0);
            })[0] || null;
        const latestBookingOverall = mappedRides
            .slice()
            .sort((a, b) => {
                if ((b.requestedAtMs || 0) !== (a.requestedAtMs || 0)) return (b.requestedAtMs || 0) - (a.requestedAtMs || 0);
                return (b.dateTime?.getTime() || 0) - (a.dateTime?.getTime() || 0);
            })[0] || null;
        // Prefer an active/ongoing ride for tracking; otherwise show the latest booking request.
        const currentBooking = activeRide || latestUpcomingBooking || latestBookingOverall;
        const avgRating = completed.length > 0
            ? (completed.reduce((sum, ride) => sum + (ride.driver.rating || 0), 0) / completed.length).toFixed(1)
            : 'N/A';

        const rideActivities = mappedRides
            .slice()
            .sort((a, b) => (b.dateTime?.getTime() || 0) - (a.dateTime?.getTime() || 0))
            .slice(0, 5)
            .map((ride) => ({
                id: `ride-${ride.id}`,
                type: 'ride',
                title: `${ride.pickup} -> ${ride.dropoff}`,
                subtitle: `${ride.driver.vehicleName} (${ride.driver.plateNumber})`,
                time: ride.dateTime ? formatDateTime(ride.dateTime) : ride.time || 'Unknown',
                status: toLower(ride.status) || 'scheduled'
            }));

        const activities = rideActivities;

        return {
            totalRides: mappedRides.length,
            upcomingCount: upcoming.length,
            completedCount: completed.length,
            avgRating,
            currentBooking,
            activities,
            activityTotal: rideActivities.length,
            lastUnrated
        };
    }, [currentUserId, myRides]);

    const name = user?.name || 'Passenger';
    const isProfileIncomplete = !(user?.phoneNumber && user?.registrationNumber);
    const lastUnratedRide = dashboardData.lastUnrated;

    useEffect(() => {
        setRatingDraft(0);
    }, [lastUnratedRide?.id]);

    useEffect(() => {
        setActivityPage(1);
    }, [dashboardData.activityTotal]);

    const handleSubmitRating = async () => {
        if (!lastUnratedRide) return;
        if (!ratingDraft) {
            toast.error('Please select a rating first');
            return;
        }
        setRatingSubmitting(true);
        try {
            await dispatch(rateRide({ rideId: lastUnratedRide.id, rating: ratingDraft })).unwrap();
            toast.success('Thanks for rating your rider!');
            setRatingDraft(0);
        } catch (err) {
            toast.error(err || 'Failed to submit rating');
        } finally {
            setRatingSubmitting(false);
        }
    };

    const handleCallDriver = async () => {
        if (!dashboardData.currentBooking?.id) return;
        try {
            const res = await api.get(`/rides/${dashboardData.currentBooking.id}/contact`);
            const phoneRaw = res?.data?.phoneNumber;
            const phone = String(phoneRaw || '').replace(/[^\d+]/g, '');
            if (!phone) {
                toast.error('Phone number not available');
                return;
            }
            window.location.href = `tel:${phone}`;
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Unable to open dialer');
        }
    };

    return (
        <div className="space-y-8">
            {isProfileIncomplete ? (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-xl text-orange-500 shadow-sm">
                            <FaInfoCircle size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">Your profile is incomplete</p>
                            <p className="text-xs text-slate-500 font-medium italic">Add your phone number and profile details to unlock all passenger features.</p>
                        </div>
                    </div>
                    <Link
                        to="/passenger/profile/complete"
                        className="bg-orange-500 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all flex items-center gap-2"
                    >
                        Complete Now <FaArrowRight />
                    </Link>
                </motion.div>
            ) : null}

            <div className="relative bg-primary rounded-3xl p-8 overflow-hidden shadow-xl shadow-indigo-100">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Hello, {name}</h1>
                        <p className="text-indigo-100 text-lg">Ready for your next campus ride?</p>
                        <Link
                            to="/passenger/find"
                            className="mt-6 inline-flex bg-white text-primary px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all items-center gap-2 group shadow-lg"
                        >
                            Find a Ride <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="hidden lg:block opacity-20">
                        <FaCar size={160} className="text-white" />
                    </div>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-48 h-48 bg-indigo-400 rounded-full opacity-20 blur-2xl"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={FaCar} label="Total Rides" value={dashboardData.totalRides} />
                <StatCard icon={FaCalendarCheck} label="Upcoming" value={dashboardData.upcomingCount} />
                <StatCard icon={FaStar} label="Avg. Driver Rating" value={dashboardData.avgRating} />
                <StatCard icon={FaCheckCircle} label="Completed" value={dashboardData.completedCount} />
                <Link to="/passenger/complaints" className="sm:col-span-2 lg:col-span-4">
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between h-full group cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-rose-50 text-rose-500 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                <FaExclamationCircle size={20} />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm font-medium">Need Help?</p>
                                <h3 className="text-lg font-bold text-slate-800 mt-1">Support & Issues</h3>
                            </div>
                        </div>
                    </motion.div>
                </Link>
            </div>

            {lastUnratedRide ? (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Rate Your Last Ride</h3>
                            <p className="text-xs text-slate-400 font-medium">
                                {lastUnratedRide.pickup} → {lastUnratedRide.dropoff} with {lastUnratedRide.driver.name}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setRatingDraft(value)}
                                    className="text-lg"
                                >
                                    <FaStar className={value <= ratingDraft ? 'text-warning' : 'text-slate-300'} />
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={handleSubmitRating}
                                disabled={ratingSubmitting || ratingDraft === 0}
                                className="ml-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-primary text-white disabled:opacity-50"
                            >
                                {ratingSubmitting ? 'Saving' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-slate-800">Current Booking</h2>
                            {dashboardData.currentBooking ? (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    dashboardData.currentBooking.isExpired
                                        ? 'bg-slate-100 text-slate-500'
                                        : 'bg-indigo-50 text-primary animate-pulse'
                                }`}>
                                    {dashboardData.currentBooking.isExpired ? 'Expired' : dashboardData.currentBooking.status}
                                </span>
                            ) : null}
                        </div>

                        {loading ? (
                            <div className="text-sm text-slate-500">Loading booking data...</div>
                        ) : error ? (
                            <div className="text-sm text-rose-500">{error}</div>
                        ) : dashboardData.currentBooking ? (
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-3 h-3 rounded-full border-2 border-primary bg-white z-10"></div>
                                                <div className="w-0.5 flex-1 bg-slate-100 my-1"></div>
                                                <div className="w-3 h-3 bg-primary rounded-full z-10"></div>
                                            </div>
                                            <div className="space-y-6">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pickup</p>
                                                    <p className="text-sm font-bold text-slate-700 break-words">{dashboardData.currentBooking.pickup}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dropoff</p>
                                                    <p className="text-sm font-bold text-slate-700 break-words">{dashboardData.currentBooking.dropoff}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-4 p-4 rounded-2xl ${dashboardData.currentBooking.isExpired ? 'bg-rose-50' : 'bg-slate-50'}`}>
                                        <FaClock className={dashboardData.currentBooking.isExpired ? 'text-rose-400' : 'text-primary'} />
                                        <div>
                                            <p className={`text-xs font-bold ${dashboardData.currentBooking.isExpired ? 'text-rose-600' : 'text-slate-800'}`}>{getEtaLabel(dashboardData.currentBooking.dateTime, dashboardData.currentBooking.status, dashboardData.currentBooking.isExpired)}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">{formatDateTime(dashboardData.currentBooking.dateTime || dashboardData.currentBooking.date)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full md:w-64 space-y-4 pt-4 border-t md:border-t-0 md:pt-0 md:pl-8 md:border-l border-slate-100">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 text-center md:text-left">Your Driver</p>
                                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                        <div className="flex items-center gap-3 mb-4">
                                            <img
                                                src={dashboardData.currentBooking.driver.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(dashboardData.currentBooking.driver.name)}`}
                                                alt="Driver"
                                                className="w-12 h-12 rounded-full border-2 border-indigo-100 shadow-sm"
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 leading-tight">{dashboardData.currentBooking.driver.name}</p>
                                                <div className="flex items-center gap-1 text-xs font-bold text-warning mt-1">
                                                    <FaStar size={10} /> {dashboardData.currentBooking.driver.rating.toFixed(1)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full space-y-3">
                                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{dashboardData.currentBooking.driver.vehicleName}</span>
                                                <span className="text-[10px] font-bold text-primary bg-indigo-50 px-2 py-0.5 rounded">{dashboardData.currentBooking.driver.plateNumber}</span>
                                            </div>
                                            {['active', 'ongoing'].includes(toLower(dashboardData.currentBooking.rideStatus)) && !dashboardData.currentBooking.isExpired ? (
                                                <Link
                                                    to={`/passenger/track/${dashboardData.currentBooking.id}`}
                                                    className="block text-center w-full bg-emerald-50 text-emerald-700 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all uppercase tracking-widest"
                                                >
                                                    Track Ride
                                                </Link>
                                            ) : dashboardData.currentBooking.isExpired ? (
                                                <span className="block text-center w-full bg-slate-100 text-slate-400 py-2 rounded-xl text-xs font-bold uppercase tracking-widest cursor-not-allowed">
                                                    Tracking Unavailable
                                                </span>
                                            ) : null}
                                            <Link
                                                to={`/passenger/messages?userId=${encodeURIComponent(dashboardData.currentBooking.driver.id)}&name=${encodeURIComponent(dashboardData.currentBooking.driver.name)}&rideId=${encodeURIComponent(dashboardData.currentBooking.id)}`}
                                                className="block text-center w-full bg-indigo-50 text-primary py-2 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all"
                                            >
                                                Open Chat
                                            </Link>
                                            {['active', 'ongoing', 'accepted'].includes(toLower(dashboardData.currentBooking.status)) || ['active', 'ongoing'].includes(toLower(dashboardData.currentBooking.rideStatus)) ? (
                                                <button
                                                    type="button"
                                                    onClick={handleCallDriver}
                                                    className="flex items-center justify-center gap-2 w-full bg-emerald-50 text-emerald-700 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all"
                                                >
                                                    <FaPhone size={12} /> Call
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500">No active booking right now. Search and book a ride to see live trip details here.</div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-full">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-slate-800">Recent Activity</h2>
                        <Link to="/passenger/bookings" className="text-primary text-xs font-bold hover:underline">
                            View All
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {dashboardData.activities.length > 0 ? (
                            dashboardData.activities
                                .slice(0, activityPage * activityPageSize)
                                .map((activity) => (
                                <ActivityItem
                                    key={activity.id}
                                    type={activity.type}
                                    title={activity.title}
                                    subtitle={activity.subtitle}
                                    time={activity.time}
                                    status={activity.status}
                                />
                            ))
                        ) : (
                            <div className="text-sm text-slate-500">No activity yet. Your rides will appear here.</div>
                        )}
                    </div>
                    {dashboardData.activityTotal > activityPage * activityPageSize && (
                        <button
                            type="button"
                            onClick={() => setActivityPage((prev) => prev + 1)}
                            className="mt-4 w-full py-2.5 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                        >
                            Load More Activity
                        </button>
                    )}
                    {activityPage > 1 && dashboardData.activityTotal <= activityPage * activityPageSize && (
                        <button
                            type="button"
                            onClick={() => setActivityPage(1)}
                            className="mt-3 w-full py-2.5 rounded-xl bg-white border border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                        >
                            Show Less
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PassengerDashboard;
