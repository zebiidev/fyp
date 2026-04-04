import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { 
    FaCar, FaIdCard, FaCamera, FaArrowRight, FaInfoCircle, FaIdBadge
} from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../../store/slices/authSlice';
import { uploadImageToImageKit } from '../../utils/imagekitUpload';
import Loader from '../../components/ui/Loader';

const ImageUploadField = ({ label, icon: Icon, id, preview, onChange }) => (
    <div className="space-y-4">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>
        <div className="relative group">
            <div className="w-full h-48 rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-emerald-500/50 group-hover:bg-emerald-50/10">
                {preview ? (
                    <img src={preview} alt={label} className="w-full h-full object-cover" />
                ) : (
                    <>
                        <div className="p-4 bg-white rounded-2xl shadow-sm mb-3">
                            <Icon className="text-slate-300 group-hover:text-emerald-500 transition-colors" size={24} />
                        </div>
                        <p className="text-xs font-bold text-slate-400">Click to upload image</p>
                    </>
                )}
                <input 
                    type="file" 
                    id={id}
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    accept="image/*" 
                    onChange={(e) => onChange(e, id)} 
                />
            </div>
            {preview && (
                <div className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-xl text-emerald-600 shadow-sm pointer-events-none">
                    <FaCamera size={14} />
                </div>
            )}
        </div>
    </div>
);

const VehicleCompletion = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [submitting, setSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            vehicleType: user?.vehicleDetails?.type || '',
            vehicleMake: user?.vehicleDetails?.make || '',
            vehicleModel: user?.vehicleDetails?.model || '',
            regNumber: user?.vehicleDetails?.plateNumber || ''
        }
    });

    const [images, setImages] = useState({
        vehicle: { file: null, preview: '' },
        license: { file: null, preview: '' },
        plate: { file: null, preview: '' }
    });

    const onSubmit = async (data) => {
        setSubmitting(true);
        try {
            const uploadIfPresent = async (file) => {
                if (!file) return null;
                return uploadImageToImageKit(file);
            };

            const [vehicleUrl, plateUrl, licenseUrl] = await Promise.all([
                uploadIfPresent(images.vehicle.file),
                uploadIfPresent(images.plate.file),
                uploadIfPresent(images.license.file)
            ]);

            const vehicleImages = [vehicleUrl, plateUrl].filter(Boolean);
            const verificationDocuments = licenseUrl ? [{ url: licenseUrl, status: 'pending' }] : undefined;

            await dispatch(updateProfile({
                vehicleDetails: {
                    type: data.vehicleType,
                    make: data.vehicleMake,
                    model: data.vehicleModel,
                    plateNumber: data.regNumber,
                    images: vehicleImages.length > 0 ? vehicleImages : undefined,
                    isVerified: false
                },
                verificationDocuments
            })).unwrap();
            toast.success("Vehicle profile submitted for verification!");
            navigate('/rider/dashboard');
        } catch (err) {
            toast.error(err || "Failed to submit vehicle details");
        } finally {
            setSubmitting(false);
        }
    };

    const handleImageChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImages(prev => ({ 
                ...prev, 
                [type]: { file, preview: reader.result }
            }));
            reader.readAsDataURL(file);
        }
    };

    const inputClasses = "w-full bg-slate-50 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-300";
    const labelClasses = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1";
    const iconClasses = "absolute inset-y-0 left-0 pl-4 flex items-center text-slate-300 group-focus-within:text-emerald-500 transition-colors";

    if (submitting) return <Loader fullPage message="Submitting verification request..." />;

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <header className="mb-10">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                        <FaIdBadge size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800">Vehicle Completion</h1>
                        <p className="text-slate-500 font-medium italic">Submit your vehicle and license details for verification.</p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <h3 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-4 mb-8">
                        <FaCar className="text-emerald-500" /> Vehicle Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div className="group relative">
                            <label className={labelClasses}>Vehicle Type</label>
                            <div className="relative">
                                <div className={iconClasses}><FaCar size={14} /></div>
                                <select {...register('vehicleType', { required: true })} className={inputClasses}>
                                    <option value="">Select Type...</option>
                                    <option value="car">Car (Sedan/Hatchback)</option>
                                    <option value="motorbike">Motorbike / Heavy Bike</option>
                                    <option value="scotty">Scooter / Scotty</option>
                                </select>
                            </div>
                            {errors.vehicleType && <p className="mt-1 text-xs text-warning">Vehicle type is required</p>}
                        </div>
                        <div className="group relative">
                            <label className={labelClasses}>Vehicle Make</label>
                            <div className="relative">
                                <div className={iconClasses}><FaCar size={14} /></div>
                                <input 
                                    {...register('vehicleMake', { required: true })}
                                    placeholder="e.g. Honda" 
                                    className={inputClasses} 
                                />
                            </div>
                            {errors.vehicleMake && <p className="mt-1 text-xs text-warning">Vehicle make is required</p>}
                        </div>
                        <div className="group relative">
                            <label className={labelClasses}>Vehicle Model & Year</label>
                            <div className="relative">
                                <div className={iconClasses}><FaIdCard size={14} /></div>
                                <input 
                                    {...register('vehicleModel', { required: true })}
                                    placeholder="e.g. Honda Civic 2022" 
                                    className={inputClasses} 
                                />
                            </div>
                            {errors.vehicleModel && <p className="mt-1 text-xs text-warning">Vehicle model is required</p>}
                        </div>
                        <div className="group relative">
                            <label className={labelClasses}>Vehicle Registration Number</label>
                            <div className="relative">
                                <div className={iconClasses}><FaIdCard size={14} /></div>
                                <input 
                                    {...register('regNumber', { required: true })}
                                    placeholder="e.g. LEA-1234 (vehicle plate)" 
                                    className={inputClasses} 
                                />
                            </div>
                            {errors.regNumber && <p className="mt-1 text-xs text-warning">Plate number is required</p>}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <h3 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-4 mb-8">
                        <FaCamera className="text-emerald-500" /> Document & Asset Photos
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ImageUploadField 
                            label="Vehicle Photo" 
                            icon={FaCar} 
                            id="vehicle" 
                            preview={images.vehicle.preview} 
                            onChange={handleImageChange} 
                        />
                        <ImageUploadField 
                            label="Number Plate Photo" 
                            icon={FaIdCard} 
                            id="plate" 
                            preview={images.plate.preview} 
                            onChange={handleImageChange} 
                        />
                        <ImageUploadField 
                            label="Driving License (Front)" 
                            icon={FaIdCard} 
                            id="license" 
                            preview={images.license.preview} 
                            onChange={handleImageChange} 
                        />
                    </div>

                    <div className="mt-8 flex gap-3 p-4 bg-orange-50 rounded-[28px] border border-orange-100">
                        <FaInfoCircle className="text-orange-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">
                            All uploaded images are encrypted and stored securely. Our admin team will verify these details within 12-24 hours.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <motion.button 
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="bg-emerald-600 text-white px-12 py-5 rounded-[24px] font-black shadow-2xl shadow-emerald-100 flex items-center gap-3"
                    >
                        Submit for Verification <FaArrowRight />
                    </motion.button>
                </div>
            </form>
        </div>
    );
};

export default VehicleCompletion;
