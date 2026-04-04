import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { fetchMyRides } from '../../store/slices/rideSlice';
import PassengerLiveMap from '../../components/maps/PassengerLiveMap';

const TrackRide = () => {
    const { rideId } = useParams();
    const dispatch = useDispatch();
    const { myRides, loading, error } = useSelector((state) => state.rides);
    const { user } = useSelector((state) => state.auth);
    const currentUserId = user?.id || user?._id;

    useEffect(() => {
        dispatch(fetchMyRides());
    }, [dispatch]);

    const ride = useMemo(() => {
        if (!rideId) return null;
        return (myRides || []).find((r) => {
            if (!r) return false;
            const matchesId = String(r._id) === String(rideId);
            if (!matchesId) return false;
            const passenger = (r.passengers || []).find((p) => {
                const pid = p?.user?._id || p?.user;
                return String(pid) === String(currentUserId);
            });
            return Boolean(passenger);
        }) || null;
    }, [currentUserId, myRides, rideId]);

    const rideStatus = (ride?.status || '').toLowerCase();
    const isActive = ['active', 'ongoing'].includes(rideStatus);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Track Ride</h1>
                    <p className="text-sm text-slate-500">Live tracking is available only while the ride is active.</p>
                </div>
                <Link
                    to="/passenger/bookings"
                    className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
                >
                    Back to Bookings
                </Link>
            </div>

            {loading && !ride ? (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 text-sm text-slate-500">
                    Loading ride details...
                </div>
            ) : error ? (
                <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 text-sm text-rose-600">
                    {error}
                </div>
            ) : !ride ? (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 text-sm text-slate-500">
                    We could not find that ride. Try tracking from your bookings list.
                </div>
            ) : !isActive ? (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 text-sm text-slate-500">
                    This ride is not active right now. Live tracking will appear once the rider starts the trip.
                </div>
            ) : (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Route</p>
                            <p className="text-sm font-black text-slate-800">
                                {ride.pickupLocation} → {ride.dropoffLocation}
                            </p>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                            Active
                        </span>
                    </div>
                    <PassengerLiveMap
                        rideId={ride._id}
                        pickupLocation={ride.pickupLocation}
                        dropoffLocation={ride.dropoffLocation}
                    />
                </div>
            )}
        </div>
    );
};

export default TrackRide;
