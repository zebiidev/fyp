import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { uploadImageToImageKit } from '../../utils/imagekitUpload';
import { loadUser } from '../../store/slices/authSlice';
import { 
    FaUser, FaUniversity, FaGraduationCap, FaLayerGroup, 
    FaPhone, FaEnvelope, FaCamera, FaArrowRight,
    FaIdCard, FaMapMarkerAlt, FaVenusMars
} from 'react-icons/fa';

const CompleteRiderProfile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        defaultValues: {
            department: '',
            programme: '',
            semester: '',
            mobile: '',
            emergencyName: '',
            emergencyContact: '',
            cnic: '',
            address: '',
            gender: ''
        }
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        if (user && !saving) {
            reset({
                department: user.department || '',
                programme: user.programme || '',
                semester: user.semester || '',
                mobile: user.phoneNumber || '',
                emergencyName: user.emergencyName || '',
                emergencyContact: user.emergencyContact || '',
                cnic: user.cnic || '',
                address: user.address || '',
                gender: user.gender || ''
            });
            setAvatarUrl(user.avatar || '');
            if (user.avatar) {
                setPreviewImage(user.avatar);
            }
        }
    }, [user, reset, saving]);

    const onSubmit = async (data) => {
        setSaving(true);
        try {
            await api.put('/auth/profile', {
                department: data.department,
                programme: data.programme,
                semester: data.semester,
                phoneNumber: data.mobile,
                emergencyName: data.emergencyName,
                emergencyContact: data.emergencyContact,
                cnic: data.cnic,
                address: data.address,
                gender: data.gender,
                avatar: avatarUrl || user?.avatar || ''
            });
            await dispatch(loadUser());
            toast.success('Profile updated successfully!');
            navigate('/rider/vehicle/complete');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            e.target.value = '';
            return;
        }

        try {
            setUploadingAvatar(true);
            const uploadedUrl = await uploadImageToImageKit(file);
            setAvatarUrl(uploadedUrl);
            setPreviewImage(uploadedUrl);
            toast.success('Profile image uploaded');
        } catch (err) {
            toast.error(err.message || 'Failed to upload image');
        } finally {
            setUploadingAvatar(false);
            e.target.value = '';
        }
    };

    const inputClasses = "w-full bg-slate-50 border-none rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all";
    const labelClasses = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1";
    const iconClasses = "absolute inset-y-0 left-0 pl-4 flex items-center text-slate-300 group-focus-within:text-emerald-500 transition-colors";

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-black text-slate-800 mb-2">Complete Rider Profile</h1>
                <p className="text-slate-500 font-medium italic">This information helps us verify rider safety and campus eligibility.</p>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-20">
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-10">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full bg-emerald-50 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                            {previewImage ? (
                                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <FaUser className="text-emerald-200 text-5xl" />
                            )}
                        </div>
                        <label className="absolute bottom-2 right-2 p-3 bg-emerald-600 text-white rounded-full border-4 border-white shadow-lg cursor-pointer hover:bg-emerald-700 transition-all">
                            <FaCamera size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={uploadingAvatar} />
                        </label>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Display Picture</h3>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm">
                            Upload a clear portrait so passengers can identify you easily.
                        </p>
                        {uploadingAvatar && (
                            <p className="text-xs text-slate-500 font-bold mt-2">Uploading image...</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                        <h3 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-4">
                            <FaUniversity className="text-emerald-500" /> Academic Details
                        </h3>
                        <div className="space-y-5">
                            <div className="group relative">
                                <label className={labelClasses}>Department</label>
                                <div className="relative">
                                    <div className={iconClasses}><FaUniversity size={14} /></div>
                                    <select {...register('department', { required: true })} className={inputClasses}>
                                        <option value="">Select Department</option>
                                        <option value="CS">Computer Science</option>
                                        <option value="EE">Electrical Engineering</option>
                                        <option value="BA">Business Administration</option>
                                        <option value="SS">Social Sciences</option>
                                    </select>
                                </div>
                                {errors.department && <p className="mt-1 text-xs text-warning">Department is required</p>}
                            </div>
                            <div className="group relative">
                                <label className={labelClasses}>Programme / Degree</label>
                                <div className="relative">
                                    <div className={iconClasses}><FaGraduationCap size={14} /></div>
                                    <input 
                                        {...register('programme', { required: true })}
                                        placeholder="e.g. BS Software Engineering" 
                                        className={inputClasses} 
                                    />
                                </div>
                                {errors.programme && <p className="mt-1 text-xs text-warning">Programme is required</p>}
                            </div>
                            <div className="group relative">
                                <label className={labelClasses}>Current Semester</label>
                                <div className="relative">
                                    <div className={iconClasses}><FaLayerGroup size={14} /></div>
                                    <select {...register('semester', { required: true })} className={inputClasses}>
                                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                    </select>
                                </div>
                                {errors.semester && <p className="mt-1 text-xs text-warning">Semester is required</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                        <h3 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-4">
                            <FaPhone className="text-emerald-500" /> Contact Details
                        </h3>
                        <div className="space-y-5">
                            <div className="group relative">
                                <label className={labelClasses}>Mobile Number</label>
                                <div className="relative">
                                    <div className={iconClasses}><FaPhone size={14} /></div>
                                    <input 
                                        {...register('mobile', { required: true })}
                                        placeholder="+92 3XX XXXXXXX" 
                                        className={inputClasses} 
                                    />
                                </div>
                                {errors.mobile && <p className="mt-1 text-xs text-warning">Mobile number is required</p>}
                            </div>
                            <div className="group relative">
                                <label className={labelClasses}>Guardian / Emergency Contact Name</label>
                                <div className="relative">
                                    <div className={iconClasses}><FaUser size={14} /></div>
                                    <input 
                                        {...register('emergencyName', { required: true })}
                                        placeholder="Full Name" 
                                        className={inputClasses} 
                                    />
                                </div>
                                {errors.emergencyName && <p className="mt-1 text-xs text-warning">Emergency contact name is required</p>}
                            </div>
                            <div className="group relative">
                                <label className={labelClasses}>Emergency Mobile / Email</label>
                                <div className="relative">
                                    <div className={iconClasses}><FaEnvelope size={14} /></div>
                                    <input 
                                        {...register('emergencyContact', { required: true })}
                                        placeholder="Phone or Email" 
                                        className={inputClasses} 
                                    />
                                </div>
                                {errors.emergencyContact && <p className="mt-1 text-xs text-warning">Emergency contact is required</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                    <h3 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-4">
                        <FaIdCard className="text-emerald-500" /> Verification Info
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group relative">
                            <label className={labelClasses}>CNIC Number (Mandatory)</label>
                            <div className="relative">
                                <div className={iconClasses}><FaIdCard size={14} /></div>
                                <input 
                                    {...register('cnic', { required: true })}
                                    placeholder="XXXXX-XXXXXXX-X" 
                                    className={inputClasses} 
                                />
                            </div>
                            {errors.cnic && <p className="mt-1 text-xs text-warning">CNIC is required</p>}
                        </div>
                        <div className="group relative">
                            <label className={labelClasses}>Permanent Address (Optional)</label>
                            <div className="relative">
                                <div className={iconClasses}><FaMapMarkerAlt size={14} /></div>
                                <input 
                                    {...register('address')}
                                    placeholder="Your home address" 
                                    className={inputClasses} 
                                />
                            </div>
                        </div>
                        <div className="group relative">
                            <label className={labelClasses}>Gender</label>
                            <div className="relative">
                                <div className={iconClasses}><FaVenusMars size={14} /></div>
                                <select {...register('gender', { required: true })} className={inputClasses}>
                                    <option value="">Choose gender...</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            {errors.gender && <p className="mt-1 text-xs text-warning">Gender is required</p>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <motion.button 
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={saving}
                        className="bg-emerald-600 text-white px-10 py-4 rounded-[20px] font-black shadow-2xl shadow-emerald-100 flex items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : <>Save & Continue <FaArrowRight /></>}
                    </motion.button>
                </div>
            </form>
        </div>
    );
};

export default CompleteRiderProfile;
