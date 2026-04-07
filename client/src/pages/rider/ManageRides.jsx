import React, { useEffect, useMemo ,useRef, useState} from 'react';
import { FaCar, FaUsers, FaCheck, FaTimes, FaComments, FaHistory } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyRides, updatePassengerStatus, updateRideStatus } from '../../store/slices/rideSlice';
import Loader from '../../components/ui/Loader';
import { toast } from 'react-toastify';
import { getSocket } from '../../utils/socket';

const RideCard = ({ ride, onAction, onStatusChange, onToggleTracking, isTracking, processingRequestId, processingRideId, processingStatusId }) => {
    const acceptedCount = (ride.passengers || []).filter(p => p.status === 'accepted').length;
    const totalSeats = ride.seatsAvailable + acceptedCount;
    const canStart = ride.status === 'scheduled' && acceptedCount > 0;
    const canComplete = ride.status === 'active';
    const canTrack = ride.status === 'active';

    return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden group">
        <div className="p-8 border-b border-slate-50">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <FaCar size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800">
                            {ride.vehicle?.model || 'Vehicle'} ({ride.vehicle?.plateNumber || 'N/A'})
                        </h3>
                        <p className="text-xs font-bold text-slate-400 italic">Leaves at {ride.time}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {canTrack && (
                        <button
                            type="button"
                            onClick={() => onToggleTracking(ride._id, !isTracking)}
                            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                isTracking
                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'
                                    : 'bg-indigo-50 text-primary hover:bg-primary hover:text-white'
                            }`}
                        >
                            {isTracking ? 'Stop Tracking' : 'Share Live Location'}
                        </button>
                    )}
                    {canStart && (
                        <button
                            type="button"
                            onClick={() => onStatusChange(ride._id, 'active')}
                            disabled={processingStatusId === ride._id}
                            className="px-4 py-2 bg-indigo-50 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                        >
                            {processingStatusId === ride._id ? 'Starting...' : 'Start Ride'}
                        </button>
                    )}
                    {canComplete && (
                        <button
                            type="button"
                            onClick={() => onStatusChange(ride._id, 'completed')}
                            disabled={processingStatusId === ride._id}
                            className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                        >
                            {processingStatusId === ride._id ? 'Completing...' : 'Complete Ride'}
                        </button>
                    )}
                    <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                        ride.status === 'completed' ? 'bg-slate-100 text-slate-500' : 
                        ride.status === 'active' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white shadow-emerald-100'
                    }`}>
                        {ride.status}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-8 mb-8">
                <div className="flex-1">
                    <p className="text-[9px] text-slate-300 font-black uppercase mb-1">Route</p>
                    <p className="text-sm font-bold text-slate-700">{ride.pickupLocation} → {ride.dropoffLocation}</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl">
                    <FaUsers className="text-primary" />
                    <span className="text-xs font-black text-slate-600">
                        {acceptedCount} / {totalSeats} Filled
                    </span>
                </div>
            </div>
        </div>

        <div className="p-8 bg-slate-50/50">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1">
                Passenger Requests ({(ride.passengers || []).length})
            </h4>
            <div className="space-y-4">
                {(ride.passengers || []).length > 0 ? (
                    (ride.passengers || []).map((req) => (
                        <div key={req._id} className="bg-white p-4 rounded-3xl flex items-center justify-between border border-white group-hover:border-slate-100 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-primary font-bold text-xs">
                                    {(req.user?.name || 'P').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-700 leading-none">{req.user?.name || 'Passenger'}</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 italic">
                                        {req.status} • {req.seatsBooked} seat
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {req.status === 'accepted' ? (
                                    <Link
                                        to={`/rider/messages?userId=${req.user?._id}&name=${encodeURIComponent(req.user?.name)}`}
                                        className="p-2.5 bg-indigo-50 text-primary rounded-xl hover:bg-primary hover:text-white transition-all"
                                        title="Chat"
                                    >
                                        <FaComments size={14} />
                                    </Link>
                                ) : req.status === 'pending' ? (
                                    <>
                                        <button 
                                            onClick={() => onAction(ride._id, req._id, 'accepted')}
                                            disabled={processingRideId === ride._id && processingRequestId === req._id}
                                            className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                                        >
                                            {processingRideId === ride._id && processingRequestId === req._id ? 'Accepting...' : <><FaCheck size={14} className="inline mr-1" /> Accept</>}
                                        </button>
                                        <button 
                                            onClick={() => onAction(ride._id, req._id, 'rejected')}
                                            disabled={processingRideId === ride._id && processingRequestId === req._id}
                                            className="px-4 py-2 bg-rose-50 text-rose-500 rounded-xl font-black text-[10px] hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                                        >
                                            {processingRideId === ride._id && processingRequestId === req._id ? 'Rejecting...' : <><FaTimes size={14} className="inline mr-1" /> Reject</>}
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-[10px] font-black text-slate-300 uppercase px-3 py-1 bg-slate-50 rounded-lg">
                                        {req.status}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center py-4 text-xs font-bold text-slate-300 italic">No passengers yet</p>
                )}
            </div>
        </div>
    </div>
    );
};

const ManageRides = () => {
    const dispatch = useDispatch();
    const { myRides, loading } = useSelector((state) => state.rides);
    const { token } = useSelector((state) => state.auth);
    const [processingRequestId, setProcessingRequestId] = useState(null);
    const [processingRideId, setProcessingRideId] = useState(null);
    const [processingStatusId, setProcessingStatusId] = useState(null);
    const [trackingRideIds, setTrackingRideIds] = useState(new Set());
    const watchIdsRef = useRef(new Map());

    useEffect(() => {
        dispatch(fetchMyRides());
    }, [dispatch]);

    useEffect(() => {
        return () => {
            watchIdsRef.current.forEach((watchId) => {
                navigator.geolocation?.clearWatch(watchId);
            });
            watchIdsRef.current.clear();
        };
    }, []);

    const activeRides = useMemo(() => {
        return (myRides || []).filter(r => ['scheduled', 'active'].includes(r.status));
    }, [myRides]);

    const handleAction = async (rideId, passengerId, status) => {
        setProcessingRequestId(passengerId);
        setProcessingRideId(rideId);
        try {
            await dispatch(updatePassengerStatus({ rideId, passengerId, status })).unwrap();
            toast.success(`Request ${status} successfully`);
            dispatch(fetchMyRides());
        } catch (err) {
            toast.error(err || 'Failed to update request');
        } finally {
            setProcessingRequestId(null);
            setProcessingRideId(null);
        }
    };

    const handleStatusChange = async (rideId, status) => {
        setProcessingStatusId(rideId);
        try {
            await dispatch(updateRideStatus({ rideId, status })).unwrap();
            toast.success(`Ride marked as ${status}`);
            dispatch(fetchMyRides());
        } catch (err) {
            toast.error(err || 'Failed to update ride status');
        } finally {
            setProcessingStatusId(null);
        }
    };

    const handleToggleTracking = (rideId, shouldStart) => {
        if (!token) {
            toast.error('Login required to share live location.');
            return;
        }
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported on this device.');
            return;
        }

        const socket = getSocket(token);
        if (!socket) {
            toast.error('Live tracking is unavailable right now.');
            return;
        }

        if (shouldStart) {
            if (watchIdsRef.current.has(rideId)) return;

            // Helper that actually starts the geolocation watcher
            const startWatch = () => {
                // Avoid duplicate watchers if connect fires multiple times
                if (watchIdsRef.current.has(rideId)) return;
                const watchId = navigator.geolocation.watchPosition(
                    (pos) => {
                        const { latitude, longitude } = pos.coords;
                        socket.emit('ride_location_update', {
                            rideId,
                            lat: latitude,
                            lng: longitude
                        });
                    },
                    () => {
                        toast.error('Unable to access your location.');
                        handleToggleTracking(rideId, false);
                    },
                    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
                );
                watchIdsRef.current.set(rideId, watchId);
                setTrackingRideIds((prev) => new Set(prev).add(rideId));
                toast.success('Live location sharing enabled.');
            };

            // Wait for socket to be connected before starting geo watch
            if (socket.connected) {
                startWatch();
            } else {
                const onConnect = () => {
                    socket.off('connect', onConnect);
                    startWatch();
                };
                socket.on('connect', onConnect);
            }
        } else {
            const watchId = watchIdsRef.current.get(rideId);
            if (watchId != null) {
                navigator.geolocation.clearWatch(watchId);
                watchIdsRef.current.delete(rideId);
            }
            setTrackingRideIds((prev) => {
                const next = new Set(prev);
                next.delete(rideId);
                return next;
            });
            toast.info('Live location sharing stopped.');
        }
    };

    if (loading && (!myRides || myRides.length === 0)) {
        return <Loader fullPage />;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 mb-2">Manage Your Rides</h1>
                    <p className="text-slate-500 font-medium italic">Track your active offers and passenger requests.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-8">
                {activeRides.length > 0 ? (
                    activeRides.map((ride) => (
                        <RideCard 
                            key={ride._id} 
                            ride={ride} 
                            onAction={handleAction} 
                            onStatusChange={handleStatusChange}
                            onToggleTracking={handleToggleTracking}
                            isTracking={trackingRideIds.has(ride._id)}
                            processingRequestId={processingRequestId}
                            processingRideId={processingRideId}
                            processingStatusId={processingStatusId}
                        />
                    ))
                ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                        <FaHistory size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-lg font-black text-slate-400">No Active Rides</h3>
                        <p className="text-sm text-slate-300 font-medium italic mt-1">Offers you post will appear here for management.</p>
                        <Link to="/rider/offer" className="inline-block mt-6 text-primary font-black uppercase text-xs tracking-widest hover:underline">
                            Offer a Ride
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageRides;
