import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCar, FaPlus } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loadUser, updateProfile } from '../../store/slices/authSlice';
import { uploadImageToImageKit } from '../../utils/imagekitUpload';
import { toast } from 'react-toastify';
import Loader from '../../components/ui/Loader';

const EditVehicle = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading } = useSelector((state) => state.auth);
    const vehicle = user?.vehicleDetails || {};

    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        type: '',
        make: '',
        model: '',
        plateNumber: ''
    });
    const [imageSlots, setImageSlots] = useState([
        { file: null, preview: '', existingUrl: '' },
        { file: null, preview: '', existingUrl: '' },
        { file: null, preview: '', existingUrl: '' }
    ]);

    useEffect(() => {
        if (!user && !loading) {
            dispatch(loadUser());
        }
    }, [dispatch, user, loading]);

    useEffect(() => {
        setFormData({
            type: vehicle.type || '',
            make: vehicle.make || '',
            model: vehicle.model || '',
            plateNumber: vehicle.plateNumber || ''
        });

        const existingImages = Array.isArray(vehicle.images) ? vehicle.images : [];
        const licenseImage = user?.verificationDocuments?.[0]?.url || '';
        const mergedImages = [existingImages[0], existingImages[1], licenseImage].filter(Boolean);
        setImageSlots((prev) => prev.map((slot, index) => ({
            file: null,
            preview: mergedImages[index] || '',
            existingUrl: mergedImages[index] || ''
        })));
    }, [vehicle, user]);

    const handleImageChange = (e, index) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageSlots((prev) => prev.map((slot, i) => (
                i === index ? { file, preview: reader.result, existingUrl: slot.existingUrl } : slot
            )));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const uploadIfPresent = async (file) => {
                if (!file) return null;
                return uploadImageToImageKit(file);
            };

            const uploadedUrls = await Promise.all(
                imageSlots.map((slot) => uploadIfPresent(slot.file))
            );

            const finalImages = imageSlots
                .map((slot, index) => uploadedUrls[index] || slot.existingUrl || '')
                .filter(Boolean);

            const licenseUrl = finalImages[2] || user?.verificationDocuments?.[0]?.url || '';

            await dispatch(updateProfile({
                vehicleDetails: {
                    ...formData,
                    images: finalImages.slice(0, 2)
                },
                verificationDocuments: licenseUrl
                    ? [{ url: licenseUrl, status: user?.verificationDocuments?.[0]?.status || 'pending' }]
                    : user?.verificationDocuments
            })).unwrap();

            toast.success('Vehicle details updated successfully');
            navigate('/rider/vehicles');
        } catch (err) {
            toast.error(err || 'Failed to update vehicle');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !user) return <Loader fullPage />;
    if (submitting) return <Loader fullPage message="Saving vehicle details..." />;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <header className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link to="/rider/vehicles" className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-primary transition-colors">
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800">Edit Vehicle</h1>
                        <p className="text-slate-500 font-medium italic">Update your vehicle details and images.</p>
                    </div>
                </div>
            </header>

            <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSave}
                className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6"
            >
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Vehicle Type</label>
                    <select
                        required
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                        <option value="">Select Type...</option>
                        <option value="car">Car (Sedan/Hatchback)</option>
                        <option value="motorbike">Motorbike / Heavy Bike</option>
                        <option value="scotty">Scooter / Scotty</option>
                    </select>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Vehicle Make</label>
                    <input
                        type="text"
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary"
                        value={formData.make}
                        onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                        placeholder="e.g. Honda"
                    />
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Vehicle Model & Year</label>
                    <input 
                        type="text"
                        required
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="e.g. Honda Civic 2022"
                    />
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Registration Number</label>
                    <input 
                        type="text"
                        required
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary"
                        value={formData.plateNumber}
                        onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                        placeholder="e.g. LEA-1234"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Vehicle Photos</label>
                    <div className="grid grid-cols-3 gap-3">
                        {imageSlots.map((slot, index) => (
                            <label key={index} className="relative cursor-pointer">
                                <div className="w-full h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden hover:border-primary transition-all">
                                    {slot.preview ? (
                                        <img src={slot.preview} alt={`Vehicle ${index + 1}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <FaPlus className="text-slate-300" />
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageChange(e, index)}
                                />
                            </label>
                        ))}
                    </div>
                    <p className="text-[11px] text-slate-400">Upload up to 3 images. Existing images stay if you don’t replace them.</p>
                </div>

                <div className="flex justify-end">
                    <button type="submit" className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">
                        <FaCar /> Save Vehicle
                    </button>
                </div>
            </motion.form>
        </div>
    );
};

export default EditVehicle;
