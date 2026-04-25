import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaFilter, FaStar, FaClock } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { joinRide, searchRides } from '../../store/slices/rideSlice';
import Loader from '../../components/ui/Loader';
import { toast } from 'react-toastify';

const RideCard = ({ ride, onJoin, isJoining }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group ${
            ride.isPast ? 'opacity-70' : ''
        }`}
    >
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <img src={ride.driverImage} alt={ride.driverName} className="w-10 h-10 rounded-full border border-indigo-100" />
                <div>
                    <h4 className="text-sm font-bold text-slate-800">{ride.driverName}</h4>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-warning">
                        <FaStar size={10} />
                        {ride.ratingsCount > 0 ? (
                            <span>{ride.rating.toFixed(1)} | {ride.ratingsCount} ratings</span>
                        ) : (
                            <span>No ratings yet</span>
                        )}
                    </div>
                </div>
            </div>
            <div className="text-right">
                <p className="text-lg font-bold text-primary">Rs. {ride.price}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">per seat</p>
            </div>
        </div>

        <div className="space-y-3 mb-5">
            <div className="flex gap-3">
                <div className="flex flex-col items-center pt-1">
                    <div className="w-2 h-2 rounded-full border border-primary bg-white"></div>
                    <div className="w-0.5 flex-1 bg-slate-100 my-0.5"></div>
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <div className="flex-1 space-y-2">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">From</p>
                        <p className="text-xs font-bold text-slate-700 break-words leading-snug">{ride.from}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">To</p>
                        <p className="text-xs font-bold text-slate-700 break-words leading-snug">{ride.to}</p>
                    </div>
                </div>
            </div>
        </div>

        {ride.matchScore > 0 ? (
            <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                    Route Match {ride.matchScore}%
                </p>
                <p className="mt-1 text-xs font-medium text-emerald-800 leading-snug break-words">
                    {ride.matchReasons?.length ? ride.matchReasons.join(' • ') : 'This ride overlaps with your route.'}
                </p>
            </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-50">
            <div className="flex flex-1 min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex items-center gap-1.5 text-slate-500">
                    <FaCalendarAlt size={12} />
                    <span className="text-[10px] font-bold">{ride.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                    <FaClock size={12} />
                    <span className="text-[10px] font-bold">{ride.time}</span>
                </div>
                {ride.isPast ? (
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        Time Passed
                    </span>
                ) : null}
                <div className="flex items-center gap-1.5 text-slate-500">
                    <FaUsers size={12} />
                    <span className="text-[10px] font-bold">{ride.seatsAvailable} seats left</span>
                </div>
            </div>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onJoin(ride.id)}
                disabled={isJoining || ride.isPast}
                className="shrink-0 bg-indigo-50 text-primary px-4 py-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isJoining ? (
                    <span>Requesting...</span>
                ) : ride.isPast ? (
                    <span>Time Passed</span>
                ) : (
                    <span>Send Request</span>
                )}
            </motion.button>
        </div>
    </motion.div>
);


const FindRide = () => {
    const dispatch = useDispatch();
    const { rides, loading } = useSelector((state) => state.rides);
    const { user } = useSelector((state) => state.auth);

    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [date, setDate] = useState('');
    const [joiningRideId, setJoiningRideId] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [usedProfileArea, setUsedProfileArea] = useState(false);
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        minRating: '',
        seatsNeeded: '',
        timeFrom: '',
        timeTo: '',
        gender: 'any'
    });

    const parseTimeToMinutes = (value) => {
        if (!value) return null;
        const trimmed = value.trim();
        const match12h = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
        if (match12h) {
            let hours = Number(match12h[1]);
            const minutes = Number(match12h[2] || 0);
            const meridiem = match12h[3].toLowerCase();
            if (meridiem === 'pm' && hours < 12) hours += 12;
            if (meridiem === 'am' && hours === 12) hours = 0;
            return hours * 60 + minutes;
        }
        const match24h = trimmed.match(/^(\d{1,2}):(\d{2})$/);
        if (match24h) {
            const hours = Number(match24h[1]);
            const minutes = Number(match24h[2]);
            return hours * 60 + minutes;
        }
        return null;
    };

    const getRideDateTime = (rideDate, rideTime) => {
        if (!rideDate) return null;
        const dateObj = new Date(rideDate);
        if (Number.isNaN(dateObj.getTime())) return null;
        const minutes = parseTimeToMinutes(rideTime);
        if (minutes === null) return dateObj;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        dateObj.setHours(hours, mins, 0, 0);
        return dateObj;
    };

    const mappedApiRides = useMemo(() => {
        return (rides || []).map((ride) => {
            const rideDateTime = getRideDateTime(ride.date, ride.time);
            const isPast = rideDateTime ? rideDateTime.getTime() < Date.now() : false;
            return {
                id: ride._id,
                driverName: ride.driver?.name || 'Driver',
                driverImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(ride.driver?.name || 'Driver')}`,
                rating: Number(ride.driver?.averageRating || 0),
                ratingsCount: Number(ride.driver?.totalRatings || 0),
                price: ride.pricePerSeat,
                from: ride.pickupLocation,
                to: ride.dropoffLocation,
                date: ride.date ? new Date(ride.date).toLocaleDateString() : 'Today',
                time: ride.time || 'Time TBD',
                seatsAvailable: ride.seatsAvailable,
                driverGender: ride.driver?.gender || 'unknown',
                matchScore: Number(ride.matchScore || 0),
                matchReasons: ride.matchReasons || [],
                isPast
            };
        });
    }, [rides]);

    const displayedRides = useMemo(() => {
        const minPrice = Number(filters.minPrice);
        const maxPrice = Number(filters.maxPrice);
        const minRating = Number(filters.minRating);
        const seatsNeeded = Number(filters.seatsNeeded);
        const timeFromMinutes = parseTimeToMinutes(filters.timeFrom);
        const timeToMinutes = parseTimeToMinutes(filters.timeTo);
        const gender = filters.gender;

        return mappedApiRides.filter((ride) => {
            if (Number.isFinite(minPrice) && minPrice > 0 && ride.price < minPrice) return false;
            if (Number.isFinite(maxPrice) && maxPrice > 0 && ride.price > maxPrice) return false;
            if (Number.isFinite(minRating) && minRating > 0 && Number(ride.rating || 0) < minRating) return false;
            if (Number.isFinite(seatsNeeded) && seatsNeeded > 0 && ride.seatsAvailable < seatsNeeded) return false;
            if (gender !== 'any' && ride.driverGender !== gender) return false;

            if (timeFromMinutes !== null || timeToMinutes !== null) {
                const rideMinutes = parseTimeToMinutes(ride.time);
                if (rideMinutes === null) return false;
                if (timeFromMinutes !== null && rideMinutes < timeFromMinutes) return false;
                if (timeToMinutes !== null && rideMinutes > timeToMinutes) return false;
            }

            return true;
        });
    }, [mappedApiRides, filters]);

    const suggestedRides = useMemo(() => {
        return mappedApiRides
            .filter((ride) => !ride.isPast)
            .slice()
            .sort((a, b) => {
                const aTime = getRideDateTime(a.date, a.time)?.getTime() || 0;
                const bTime = getRideDateTime(b.date, b.time)?.getTime() || 0;
                return aTime - bTime;
            })
            .slice(0, 3);
    }, [mappedApiRides]);

    const handleSearch = async () => {
        const fromValue = typeof from === 'string' ? from.trim() : '';
        const toValue = typeof to === 'string' ? to.trim() : '';
        const dateValue = typeof date === 'string' ? date.trim() : '';
        const canUseProfileArea = Boolean(user?.address?.trim());
        if (!fromValue && !toValue && !dateValue && !usedProfileArea) {
            toast.info(canUseProfileArea ? 'Enter search details or use your saved area.' : 'Enter at least one search field before searching.');
            return;
        }
        const result = await dispatch(searchRides({ from, to, date, useProfileArea: usedProfileArea && !fromValue }));
        if (searchRides.rejected.match(result)) {
            toast.error(result.payload || 'Could not fetch rides.');
        } else if (result.payload?.length === 0) {
            toast.info('No rides found. Try adjusting your search.');
        }
    };

    const handleUseMyArea = () => {
        const address = user?.address?.trim();
        if (!address) {
            toast.info('Add your address in profile settings first to use area matching.');
            return;
        }

        setFrom(address);
        setUsedProfileArea(true);
        toast.success('Your saved area has been added as the pickup location.');
    };

    const handleJoin = async (rideId) => {
        setJoiningRideId(rideId);
        const result = await dispatch(joinRide({ rideId }));
        setJoiningRideId(null);
        if (joinRide.fulfilled.match(result)) {
            toast.success('Ride request sent successfully.');
        } else {
            toast.error(result.payload || 'Failed to request this ride.');
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Find a Ride</h1>
                    <p className="text-sm text-slate-500">Discover riders from your area and along your route</p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleUseMyArea}
                        className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition-all"
                    >
                        <FaMapMarkerAlt size={12} /> Use My Area
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowFilters((prev) => !prev)}
                        className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                        <FaFilter size={12} /> Filters
                    </button>
                    <button
                        onClick={handleSearch}
                        className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all hover:bg-primary-dark"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </header>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-primary pointer-events-none">
                            <FaMapMarkerAlt size={14} />
                        </span>
                        <input
                            type="text"
                            value={from}
                            onChange={(e) => {
                                const nextValue = e.target.value;
                                setFrom(nextValue);
                                setUsedProfileArea(Boolean(user?.address?.trim()) && nextValue.trim() === user.address.trim());
                            }}
                            placeholder="Starting point..."
                            className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                        />
                    </div>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-primary pointer-events-none">
                            <FaMapMarkerAlt size={14} />
                        </span>
                        <input
                            type="text"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="Where to?"
                            className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                        />
                    </div>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-primary pointer-events-none">
                            <FaCalendarAlt size={14} />
                        </span>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                        />
                    </div>
                </div>
                {user?.address ? (
                    <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saved Area</p>
                        <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm font-medium text-slate-700">{user.address}</p>
                            <button
                                type="button"
                                onClick={handleUseMyArea}
                                className="text-xs font-black uppercase tracking-widest text-primary"
                            >
                                Match Riders Near Me
                            </button>
                        </div>
                    </div>
                ) : null}
                {showFilters && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                        <div className="relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Min Price</label>
                            <input
                                type="number"
                                min="0"
                                value={filters.minPrice}
                                onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                                placeholder="e.g. 50"
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                            />
                        </div>
                        <div className="relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Max Price</label>
                            <input
                                type="number"
                                min="0"
                                value={filters.maxPrice}
                                onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                                placeholder="e.g. 200"
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                            />
                        </div>
                        <div className="relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Seats Needed</label>
                            <input
                                type="number"
                                min="1"
                                value={filters.seatsNeeded}
                                onChange={(e) => setFilters((prev) => ({ ...prev, seatsNeeded: e.target.value }))}
                                placeholder="e.g. 2"
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                            />
                        </div>
                        <div className="relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Min Rating</label>
                            <select
                                value={filters.minRating}
                                onChange={(e) => setFilters((prev) => ({ ...prev, minRating: e.target.value }))}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                            >
                                <option value="">Any</option>
                                <option value="3">3+</option>
                                <option value="3.5">3.5+</option>
                                <option value="4">4+</option>
                                <option value="4.5">4.5+</option>
                            </select>
                        </div>
                        <div className="relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Departure From</label>
                            <input
                                type="time"
                                value={filters.timeFrom}
                                onChange={(e) => setFilters((prev) => ({ ...prev, timeFrom: e.target.value }))}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                            />
                        </div>
                        <div className="relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Departure To</label>
                            <input
                                type="time"
                                value={filters.timeTo}
                                onChange={(e) => setFilters((prev) => ({ ...prev, timeTo: e.target.value }))}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                            />
                        </div>
                        <div className="relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Rider Gender</label>
                            <select
                                value={filters.gender}
                                onChange={(e) => setFilters((prev) => ({ ...prev, gender: e.target.value }))}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                            >
                                <option value="any">Any</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="col-span-full">
                    <Loader message="Searching rides..." />
                </div>
            ) : displayedRides.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {displayedRides.map((ride) => (
                        <RideCard 
                            key={ride.id} 
                            ride={ride} 
                            onJoin={handleJoin} 
                            isJoining={joiningRideId === ride.id}
                        />
                    ))}
                </div>
            ) : mappedApiRides.length > 0 ? (
                <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-700">No exact matches</p>
                            <p className="text-xs text-slate-400">Here are some rides currently available.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFilters({
                                minPrice: '',
                                maxPrice: '',
                                minRating: '',
                                seatsNeeded: '',
                                timeFrom: '',
                                timeTo: '',
                                gender: 'any'
                            })}
                            className="text-xs font-black uppercase tracking-widest text-primary"
                        >
                            Clear Filters
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {(suggestedRides.length > 0 ? suggestedRides : mappedApiRides.slice(0, 3)).map((ride) => (
                            <RideCard 
                                key={ride.id} 
                                ride={ride} 
                                onJoin={handleJoin} 
                                isJoining={joiningRideId === ride.id}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="col-span-full text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <FaFilter size={32} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-400 text-sm font-medium">No rides available</p>
                    <p className="text-xs text-slate-300 mt-1">Try adjusting your search filters or check back later.</p>
                </div>
            )}
        </div>
    );
};

export default FindRide;

