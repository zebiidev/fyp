import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaCheckDouble, FaCircle, FaInfoCircle, FaCar, FaInbox } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { markRead, markAllRead } from '../../store/slices/notificationSlice';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items, unreadCount, loading } = useSelector((state) => state.notifications);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'ride_request': return <FaCar className="text-primary" />;
            case 'ride_accepted': return <FaCar className="text-emerald-500" />;
            case 'ride_rejected': return <FaCar className="text-rose-500" />;
            default: return <FaInfoCircle className="text-slate-400" />;
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            dispatch(markRead(notification._id));
        }
        if (notification.link) {
            navigate(notification.link);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-primary transition-colors"
            >
                <FaBell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white ring-1 ring-orange-200">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-80 md:w-96 bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden z-[60]"
                    >
                        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Notifications</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={() => dispatch(markAllRead())}
                                    className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity"
                                >
                                    <FaCheckDouble size={10} /> Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                            {loading ? (
                                <div className="p-6 text-center">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading...</p>
                                </div>
                            ) : items.length > 0 ? (
                                items.map((notification) => (
                                    <button
                                        type="button"
                                        key={notification._id}
                                        className={`p-5 border-b border-slate-50 transition-all hover:bg-slate-50 cursor-pointer relative group
                                            ${!notification.read ? 'bg-indigo-50/30' : ''} w-full text-left`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm
                                                ${!notification.read ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <h4 className={`text-xs font-black truncate ${!notification.read ? 'text-slate-800' : 'text-slate-500'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.read && <FaCircle size={6} className="text-orange-500 mt-1 flex-shrink-0 shadow-sm shadow-orange-200" />}
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-2 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-10 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                                        <FaInbox size={24} />
                                    </div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">No notifications yet</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;
