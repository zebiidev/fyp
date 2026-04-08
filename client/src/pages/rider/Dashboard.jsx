import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
    FaCar, FaUsers, FaStar, 
    FaPlusCircle, FaCheckCircle, FaClock, FaArrowRight, FaIdBadge,
} from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyRides, updatePassengerStatus } from '../../store/slices/rideSlice';
import Loader from '../../components/ui/Loader';
import { toast } from 'react-toastify';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm"
    >
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${color}`}>
                <Icon size={20} />
            </div>
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-2xl font-black text-slate-800">{value}</h3>
    </motion.div>
);

const RiderDashboard = () => {
    const dispatch = useDispatch();
    const { myRides, loading } = useSelector((state) => state.rides);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(fetchMyRides());
    }, [dispatch]);

    const stats = useMemo(() => {
        const completedRides = (myRides || []).filter(r => r.status === 'completed');
        const activeOffers = (myRides || []).filter(r => ['scheduled', 'ongoing', 'active'].includes(r.status)).length;
        const pendingRequests = (myRides || []).reduce((acc, ride) => {
            const pending = (ride.passengers || []).filter(p => p.status === 'pending').length;
            return acc + pending;
        }, 0);
        const totalHappyPassengers = completedRides.reduce((acc, r) => acc + (r.passengers || []).filter(p => p.status === 'accepted').length, 0);
        
        return {
            totalRides: (myRides || []).length,
            happyPassengers: totalHappyPassengers,
            rating: user?.averageRating?.toFixed(1) || 'N/A',
            activeOffers,
            pendingRequests
        };
    }, [myRides, user]);

    const recentRequests = useMemo(() => {
        const requests = [];
        (myRides || []).forEach(ride => {
            if (['scheduled', 'ongoing'].includes(ride.status)) {
                (ride.passengers || []).forEach(p => {
                    if (p.status === 'pending') {
                        requests.push({
                            rideId: ride._id,
                            passengerId: p._id,
                            user: p.user?.name || 'Passenger',
                            from: ride.pickupLocation,
                            to: ride.dropoffLocation,
                            time: ride.time,
                            seats: p.seatsBooked,
                            avatar: (p.user?.name || 'P').charAt(0).toUpperCase()
                        });
                    }
                });
            }
        });
        return requests.slice(0, 3);
    }, [myRides]);

    const activeOffer = useMemo(() => {
        return (myRides || []).find(r => ['scheduled', 'ongoing'].includes(r.status));
    }, [myRides]);

    const handleRequest = async (rideId, passengerId, status) => {
        try {
            await dispatch(updatePassengerStatus({ rideId, passengerId, status })).unwrap();
            toast.success(`Request ${status} successfully`);
            dispatch(fetchMyRides());
        } catch (err) {
            toast.error(err || `Failed to ${status} request`);
        }
    };

    if (loading && (!myRides || myRides.length === 0)) {
        return <Loader fullPage />;
    }

    return (
        <div className="space-y-8">
            {/* Verification Alert */}
            {(!user?.isVerified || user?.accountStatus !== 'approved') && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-50 border border-emerald-100 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6"
                >
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm shadow-emerald-100 flex-shrink-0">
                            <FaIdBadge size={28} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-800 leading-tight">Verification Required</h4>
                            <p className="text-sm text-slate-500 font-medium italic mt-1">Complete your rider profile and vehicle details to start offering rides.</p>
                        </div>
                    </div>
                    <Link 
                        to="/rider/profile/complete"
                        className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-xs font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-3 whitespace-nowrap w-full md:w-auto justify-center"
                    >
                        Start Verification <FaArrowRight />
                    </Link>
                </motion.div>
            )}

            {/* Welcome Banner */}
            <div className="relative bg-emerald-600 rounded-3xl p-8 overflow-hidden shadow-xl shadow-emerald-100 text-white">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black mb-2">Rider Control Panel</h1>
                        <p className="text-emerald-50 text-sm font-medium opacity-90 max-w-md italic">
                            You're helping our campus move! Manage your rides and track your community impact.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <Link to="/rider/offer">
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 w-full md:w-auto justify-center"
                            >
                                <FaPlusCircle /> Post New Ride
                            </motion.button>
                        </Link>
                        <Link to="/rider/manage">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="bg-emerald-500/20 text-white px-8 py-4 rounded-2xl font-black shadow-lg flex items-center gap-3 w-full md:w-auto justify-center border border-emerald-200/30 hover:bg-emerald-500/30 transition-all"
                            >
                                <FaArrowRight /> Manage Rides
                            </motion.button>
                        </Link>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl text-white"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    icon={FaClock} 
                    label="Pending Requests" 
                    value={stats.pendingRequests} 
                    color="bg-emerald-50 text-emerald-600"
                />
                <StatCard 
                    icon={FaCar} 
                    label="Active Offers" 
                    value={stats.activeOffers} 
                    color="bg-indigo-50 text-primary"
                />
                <StatCard 
                    icon={FaUsers} 
                    label="Happy Passengers" 
                    value={stats.happyPassengers} 
                    color="bg-orange-50 text-orange-500"
                />
                <StatCard 
                    icon={FaStar} 
                    label="Rider Rating" 
                    value={stats.rating} 
                    color="bg-rose-50 text-warning"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                {/* Incoming Requests */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Incoming Requests</h2>
                        <Link to="/rider/manage" className="text-primary text-xs font-black uppercase tracking-widest hover:underline">View All</Link>
                    </div>
                    
                    <div className="space-y-4">
                        {recentRequests.length > 0 ? (
                            recentRequests.map((req) => (
                                <motion.div 
                                    key={`${req.rideId}-${req.passengerId}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white p-5 rounded-[28px] border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-lg border-2 border-slate-100">
                                            {req.avatar}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-black text-slate-800 truncate">{req.user}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                                                {req.time} • {req.seats} Seat requested
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-50 pt-4 sm:pt-0 sm:pl-6">
                                        <div className="flex-1 sm:flex-none min-w-0">
                                            <p className="text-[9px] text-slate-300 font-black uppercase mb-1">Route</p>
                                            <p className="text-xs font-bold text-slate-600 break-words">{req.from} → {req.to}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleRequest(req.rideId, req.passengerId, 'accepted')}
                                                className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <FaCheckCircle size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleRequest(req.rideId, req.passengerId, 'rejected')}
                                                className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <FaClock size={16} title="Reject/Hold" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm font-medium">No pending requests</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Offer Snapshot */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Active Offer</h2>
                    {activeOffer ? (
                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                                        <FaCar size={24} />
                                    </div>
                                    <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 uppercase whitespace-nowrap">
                                        {activeOffer.status}
                                    </span>
                                </div>
                            
                            <div className="space-y-4 mb-8">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 break-words">
                                        {activeOffer.vehicle?.model || 'Vehicle'} ({activeOffer.vehicle?.plateNumber || 'N/A'})
                                    </h3>
                                    <p className="text-sm font-bold text-slate-400 italic">Leaves at {activeOffer.time}</p>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                                    <FaUsers className="text-primary" />
                                    <span className="text-sm font-black text-slate-700">
                                        {(activeOffer.passengers || []).filter(p => p.status === 'accepted').length} / {activeOffer.seatsAvailable + (activeOffer.passengers || []).filter(p => p.status === 'accepted').length} Seats Booked
                                    </span>
                                </div>
                            </div>

                            <Link to="/rider/manage" className="block text-center w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                                Manage Passengers <FaArrowRight />
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-[40px] text-center flex flex-col items-center gap-4">
                            <FaCar size={32} className="text-slate-300" />
                            <p className="text-slate-400 text-sm font-black uppercase tracking-widest">No Active Ride</p>
                            <Link to="/rider/offer" className="text-primary text-xs font-black hover:underline">Offer a ride now</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RiderDashboard;
