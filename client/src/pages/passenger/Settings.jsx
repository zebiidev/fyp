import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
    FaBell, FaShieldAlt, 
    FaQuestionCircle, FaChevronRight, FaCamera, 
    FaEdit, FaCheck, FaTimes, FaUniversity, FaGraduationCap, FaLayerGroup, FaPhone
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, loadUser } from '../../store/slices/authSlice';
import { fetchMyRides } from '../../store/slices/rideSlice';
import api from '../../utils/api';
import { uploadImageToImageKit } from '../../utils/imagekitUpload';

const SettingsItem = ({ icon: Icon, label, value, color, isEditing, name, onChange }) => (
    <div className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all rounded-2xl group text-left">
        <div className="flex items-center gap-4 flex-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                {isEditing ? (
                    <input 
                        type="text"
                        name={name}
                        defaultValue={value}
                        onChange={onChange}
                        className="w-full bg-slate-100 border-none rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:ring-1 focus:ring-primary transition-all"
                    />
                ) : (
                    <p className="text-sm font-bold text-slate-800 truncate">{value || '—'}</p>
                )}
            </div>
        </div>
        {!isEditing && <FaChevronRight size={14} className="text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />}
    </div>
);

const Settings = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { myRides } = useSelector((state) => state.rides);

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        regNo: '',
        department: '',
        programme: '',
        semester: '',
        mobile: '',
        emergencyContact: '',
        avatar: ''
    });
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef(null);

    // Sync profile state from Redux user
    useEffect(() => {
        if (user && !isEditing && !saving && !uploadingAvatar) {
            setProfile({
                name: user.name || '',
                regNo: user.registrationNumber || '',
                department: user.department || '',
                programme: user.programme || '',
                semester: user.semester || '',
                mobile: user.phoneNumber || '',
                emergencyContact: user.emergencyContact || '',
                avatar: user.avatar || ''
            });
        }
    }, [user, isEditing, saving, uploadingAvatar]);

    useEffect(() => {
        dispatch(fetchMyRides());
    }, [dispatch]);

    const stats = useMemo(() => {
        const totalRides = (myRides || []).length;
        const rating = user?.averageRating ? Number(user.averageRating).toFixed(1) : 'N/A';
        return { totalRides, rating };
    }, [myRides, user]);

    const initials = (user?.name || 'U')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const roleLabel = user?.role === 'rider' ? 'Rider' : 'Passenger';

    const handleChange = (e) => {
        setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/auth/profile', {
                name: profile.name,
                phoneNumber: profile.mobile,
                department: profile.department,
                programme: profile.programme,
                semester: profile.semester,
                emergencyContact: profile.emergencyContact,
                avatar: profile.avatar
            });
            dispatch(loadUser()); // Refresh Redux state
            toast.success('Settings saved successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
            setIsEditing(false);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const handleAvatarClick = () => {
        if (!isEditing || uploadingAvatar) return;
        avatarInputRef.current?.click();
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            e.target.value = '';
            return;
        }

        try {
            setUploadingAvatar(true);
            const uploadedUrl = await uploadImageToImageKit(file);
            setProfile((prev) => ({ ...prev, avatar: uploadedUrl }));
            toast.success('Profile image uploaded');
        } catch (err) {
            toast.error(err.message || 'Failed to upload image');
        } finally {
            setUploadingAvatar(false);
            e.target.value = '';
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-10">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>
                    <p className="text-sm text-slate-500 font-medium">Manage your profile and platform preferences</p>
                </div>
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    disabled={saving}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all
                        ${isEditing ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-primary text-white shadow-indigo-100'}`}
                >
                    {isEditing ? (
                        <>{saving ? 'Saving...' : <><FaCheck /> Save Changes</>}</>
                    ) : (
                        <><FaEdit /> Edit Profile</>
                    )}
                </motion.button>
            </header>

            {/* Profile Header */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-primary font-bold text-3xl border-4 border-white shadow-xl overflow-hidden">
                        {profile.avatar ? (
                            <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            initials
                        )}
                    </div>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={handleAvatarClick}
                            className="absolute bottom-0 right-0 p-2.5 bg-primary text-white rounded-full border-4 border-white shadow-lg hover:bg-primary-dark transition-all disabled:opacity-60"
                            disabled={uploadingAvatar}
                        >
                            <FaCamera size={14} />
                        </button>
                    )}
                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                        disabled={uploadingAvatar}
                    />
                </div>
                <div className="flex-1 text-center sm:text-left z-10 transition-all">
                    {isEditing ? (
                        <div className="space-y-3 max-w-xs mx-auto sm:mx-0">
                            <input 
                                type="text" 
                                name="name"
                                defaultValue={profile.name}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xl font-black text-slate-800 focus:ring-2 focus:ring-primary"
                            />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{profile.regNo} • {roleLabel}</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-black text-slate-800 mb-1">{profile.name || 'Unnamed'}</h2>
                            <p className="text-sm text-slate-400 font-bold mb-4">{profile.regNo || 'No Reg #'} • {roleLabel}</p>
                        </>
                    )}
                </div>
                {!isEditing && (
                    <div className="flex gap-4 z-10">
                        <div className="text-center p-4 bg-slate-50 rounded-2xl min-w-[80px]">
                            <p className="text-lg font-black text-slate-800">{stats.totalRides}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Rides</p>
                        </div>
                        <div className="text-center p-4 bg-indigo-50 rounded-2xl min-w-[80px]">
                            <p className="text-lg font-black text-primary">{stats.rating}</p>
                            <p className="text-[10px] text-primary font-bold uppercase opacity-60">Score</p>
                        </div>
                    </div>
                )}
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
            </div>

            {/* Settings Sections */}
            <div className="space-y-6">
                <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4 pl-4">Academic Information</h3>
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden p-2">
                        <SettingsItem 
                            icon={FaUniversity} 
                            label="Department" 
                            value={profile.department} 
                            name="department"
                            color="bg-indigo-50 text-primary"
                            isEditing={isEditing}
                            onChange={handleChange}
                        />
                        <SettingsItem 
                            icon={FaGraduationCap} 
                            label="Programme" 
                            value={profile.programme} 
                            name="programme"
                            color="bg-indigo-50 text-primary"
                            isEditing={isEditing}
                            onChange={handleChange}
                        />
                        <SettingsItem 
                            icon={FaLayerGroup} 
                            label="Current Semester" 
                            value={profile.semester} 
                            name="semester"
                            color="bg-indigo-50 text-primary"
                            isEditing={isEditing}
                            onChange={handleChange}
                        />
                    </div>
                </section>

                <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4 pl-4">Contact & Safety</h3>
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden p-2">
                        <SettingsItem 
                            icon={FaPhone} 
                            label="Mobile Number" 
                            value={profile.mobile} 
                            name="mobile"
                            color="bg-emerald-50 text-emerald-600"
                            isEditing={isEditing}
                            onChange={handleChange}
                        />
                        <SettingsItem 
                            icon={FaShieldAlt} 
                            label="Emergency Contact" 
                            value={profile.emergencyContact} 
                            name="emergencyContact"
                            color="bg-rose-50 text-warning"
                            isEditing={isEditing}
                            onChange={handleChange}
                        />
                        <SettingsItem 
                            icon={FaBell} 
                            label="Push Notifications" 
                            value="Enabled" 
                            color="bg-orange-50 text-orange-500"
                            isEditing={false}
                        />
                    </div>
                </section>

                <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4 pl-4">Application & Account</h3>
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden p-2">
                        <SettingsItem icon={FaShieldAlt} label="Login & Security" value="Password, 2FA Enabled" color="bg-slate-50 text-slate-600" />
                        <SettingsItem icon={FaQuestionCircle} label="Help & Support" value="FAQs, Contact Admin" color="bg-slate-50 text-slate-600" />
                    </div>
                </section>
            </div>

            <div className="flex flex-col items-center pt-10 pb-20">
                {isEditing && (
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="text-slate-400 text-xs font-bold hover:text-rose-500 mb-6 flex items-center gap-2 transition-colors underline decoration-2 underline-offset-4"
                    >
                        <FaTimes /> Cancel Editing
                    </button>
                )}
                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mb-4">Version 1.0.0 (Alpha)</p>
                <button 
                    onClick={handleLogout}
                    className="bg-rose-50 text-warning px-10 py-3 rounded-2xl text-xs font-bold hover:bg-rose-600 hover:text-white transition-all"
                >
                    Sign Out Account
                </button>
            </div>
        </div>
    );
};

export default Settings;

