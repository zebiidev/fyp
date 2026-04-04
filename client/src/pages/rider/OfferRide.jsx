import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import {
    FaMapMarkerAlt, FaClock, FaUsers, FaTag,
    FaCarSide, FaInfoCircle, FaMagic
} from 'react-icons/fa';
import { createRide } from '../../store/slices/rideSlice';

const OfferRide = () => {
    const { register, handleSubmit } = useForm();
    const [priceType, setPriceType] = useState('contribution');
    const [isPublishing, setIsPublishing] = useState(false);
    const dispatch = useDispatch();

    const onSubmit = async (data) => {
        setIsPublishing(true);
        const payload = {
            pickupLocation: data.pickup,
            dropoffLocation: data.dropoff,
            date: new Date().toISOString(),
            time: data.time,
            seatsAvailable: Number(data.seats),
            pricePerSeat: priceType === 'free' ? 0 : Number(data.price || 0),
            vehicle: { model: data.vehicle }
        };

        const result = await dispatch(createRide(payload));
        setIsPublishing(false);
        if (createRide.fulfilled.match(result)) {
            toast.success('Ride offered successfully.');
        } else {
            toast.error(result.payload || 'Ride could not be posted.');
        }
    };

    const inputClasses = 'w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300';
    const labelClasses = 'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-2';
    const iconClasses = 'absolute inset-y-0 left-0 pl-4 flex items-center text-slate-300 group-focus-within:text-emerald-500 transition-colors';

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <header className="mb-10">
                <h1 className="text-3xl font-black text-slate-800 mb-2">Offer a New Ride</h1>
                <p className="text-slate-500 font-medium italic">Share your commute and help campus mates save time.</p>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                    <h3 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-4">
                        <FaMapMarkerAlt className="text-emerald-500" /> Journey Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="group relative">
                                <label className={labelClasses}>Pickup Point</label>
                                <div className="relative">
                                    <div className={iconClasses}><FaMapMarkerAlt size={16} /></div>
                                    <input {...register('pickup', { required: true })} placeholder="e.g. Main Gate" className={inputClasses} />
                                </div>
                            </div>
                            <div className="group relative">
                                <label className={labelClasses}>Drop-off Point</label>
                                <div className="relative">
                                    <div className={iconClasses}><FaMapMarkerAlt size={16} /></div>
                                    <input {...register('dropoff', { required: true })} placeholder="e.g. CS Block" className={inputClasses} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="group relative">
                                <label className={labelClasses}>Departure Time</label>
                                <div className="relative">
                                    <div className={iconClasses}><FaClock size={16} /></div>
                                    <input type="time" {...register('time', { required: true })} className={inputClasses} />
                                </div>
                            </div>
                            <div className="group relative">
                                <label className={labelClasses}>Available Seats</label>
                                <div className="relative">
                                    <div className={iconClasses}><FaUsers size={16} /></div>
                                    <select {...register('seats', { required: true })} className={inputClasses}>
                                        {[1, 2, 3, 4, 5, 6].map((s) => <option key={s} value={s}>{s} Seats available</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                    <h3 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-4">
                        <FaTag className="text-orange-500" /> Cost & Vehicle
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div className="flex gap-4 p-1 bg-slate-50 rounded-2xl">
                                <button type="button" onClick={() => setPriceType('contribution')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${priceType === 'contribution' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>
                                    Contribution
                                </button>
                                <button type="button" onClick={() => setPriceType('free')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${priceType === 'free' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400'}`}>
                                    Free Ride
                                </button>
                            </div>

                            {priceType === 'contribution' && (
                                <div className="group relative">
                                    <label className={labelClasses}>Fair Contribution (Rs.)</label>
                                    <div className="relative">
                                        <div className={iconClasses}><FaTag size={16} /></div>
                                        <input type="number" {...register('price')} placeholder="e.g. 50" className={inputClasses} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="group relative">
                                <label className={labelClasses}>Vehicle (Model & Number)</label>
                                <div className="relative">
                                    <div className={iconClasses}><FaCarSide size={16} /></div>
                                    <input {...register('vehicle', { required: true })} placeholder="e.g. Honda Civic (LEA-123)" className={inputClasses} />
                                </div>
                            </div>
                            <div className="flex gap-3 p-4 bg-orange-50 rounded-[28px] border border-orange-100">
                                <FaInfoCircle className="text-orange-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[11px] text-slate-600 font-medium">Please ensure your vehicle information is accurate. This is visible to passengers for safety.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <motion.button 
                        whileHover={{ scale: 1.02, x: 5 }} 
                        whileTap={{ scale: 0.98 }} 
                        type="submit" 
                        disabled={isPublishing}
                        className="bg-emerald-600 text-white px-12 py-5 rounded-[24px] font-black shadow-2xl shadow-emerald-100 flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isPublishing ? 'Publishing...' : 'Publish Journey'} <FaMagic />
                    </motion.button>
                </div>
            </form>
        </div>
    );
};

export default OfferRide;
