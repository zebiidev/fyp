import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaCar, FaClock, FaMapMarkerAlt, FaChevronRight, FaComments } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyRides } from '../../store/slices/rideSlice';

const BookingCard = ({ booking }) => {
    const statusColors = {
        pending: 'bg-primary/10 text-primary',
        accepted: 'bg-emerald-50 text-emerald-600',
        ongoing: 'bg-indigo-600 text-white animate-pulse',
        completed: 'bg-slate-100 text-slate-500',
        cancelled: 'bg-rose-50 text-rose-600'
    };
    const canTrack = ['active', 'ongoing'].includes((booking.rideStatus || '').toLowerCase());

    return (
        <motion.div
            whileHover={{ x: 5 }}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 group cursor-pointer"
        >
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-primary transition-colors">
                <FaCar size={24} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{booking.to}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColors[booking.status] || statusColors.pending}`}>
                        {booking.status}
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5">
                        <FaClock size={10} /> {booking.time}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <FaMapMarkerAlt size={10} /> {booking.from}
                    </div>
                </div>
            </div>

            <div className="text-left sm:text-right sm:ml-auto">
                <p className="text-sm font-bold text-slate-800">Rs. {booking.price}</p>
                <p className="text-[10px] text-slate-400 font-bold">Payment: Cash</p>
                <div className="mt-2 flex flex-wrap gap-3 justify-start sm:justify-end">
                    {canTrack ? (
                        <Link
                            to={`/passenger/track/${booking.id}`}
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-600 hover:text-white transition-all"
                        >
                            Track Ride
                        </Link>
                    ) : null}
                    {booking.chatUserId ? (
                        <Link
                            to={`/passenger/messages?userId=${encodeURIComponent(booking.chatUserId)}&name=${encodeURIComponent(booking.chatUserName || 'Rider')}`}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-primary"
                        >
                            <FaComments size={10} /> Chat
                        </Link>
                    ) : null}
                </div>
            </div>

            <FaChevronRight className="hidden sm:block text-slate-200 group-hover:text-primary transition-colors" />
        </motion.div>
    );
};


const MyBookings = () => {
    const dispatch = useDispatch();
    const { myRides } = useSelector((state) => state.rides);
    const { user } = useSelector((state) => state.auth);
    const currentUserId = user?.id || user?._id;
    const normalizeId = (value) => (value ? value.toString() : '');

    useEffect(() => {
        dispatch(fetchMyRides());
    }, [dispatch]);

    const mapped = useMemo(() => {
        return (myRides || []).map((ride) => {
            const passengerEntry = (ride.passengers || []).find((p) => {
                const passengerId = p?.user?._id || p?.user;
                return normalizeId(passengerId) === normalizeId(currentUserId);
            });
            const passengerStatus = (passengerEntry?.status || '').toLowerCase();
            const rideStatus = (ride.status || '').toLowerCase();
            const canChat = ['accepted', 'pending'].includes(passengerStatus) || ['active', 'ongoing'].includes(rideStatus);
            return {
                id: ride._id,
                to: ride.dropoffLocation,
                from: ride.pickupLocation,
                time: ride.time,
                status: passengerStatus || rideStatus || 'pending',
                price: ride.pricePerSeat,
                chatUserId: canChat ? normalizeId(ride.driver?._id || ride.driver) : null,
                chatUserName: ride.driver?.name || 'Rider',
                rideStatus,
                passengerStatus
            };
        });
    }, [currentUserId, myRides]);

    const activeBookings = mapped.filter((b) => ['pending', 'accepted', 'ongoing', 'active', 'scheduled'].includes((b.status || '').toLowerCase()));
    const activeTrackingRide = activeBookings.find((b) => ['active', 'ongoing'].includes((b.status || '').toLowerCase()));

    const pastBookings = mapped.filter((b) => ['completed', 'cancelled', 'rejected'].includes((b.status || '').toLowerCase()));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">My Bookings</h1>
                <p className="text-sm text-slate-500">Manage your active and past ride requests</p>
            </div>

            <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Active & Upcoming</h3>
                {activeTrackingRide ? (
                    <div className="mb-6 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h4 className="text-sm font-black text-slate-800">Live Ride Tracking</h4>
                            <p className="text-xs text-slate-400 font-medium italic">
                                Track your rider in real time for this trip.
                            </p>
                        </div>
                        <Link
                            to={`/passenger/track/${activeTrackingRide.id}`}
                            className="inline-flex items-center justify-center px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all"
                        >
                            Track Ride
                        </Link>
                    </div>
                ) : null}
                <div className="space-y-4">
                    {activeBookings.length > 0 ? (
                        activeBookings.map((b) => <BookingCard key={b.id} booking={b} />)
                    ) : (
                        <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 text-sm font-medium">No active bookings found</p>
                        </div>
                    )}
                </div>
            </section>

            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent History</h3>
                </div>
                <div className="space-y-3">
                    {pastBookings.length > 0 ? (
                        pastBookings.map((b) => <BookingCard key={b.id} booking={b} />)
                    ) : (
                        <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 text-sm font-medium">No past bookings yet</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default MyBookings;
