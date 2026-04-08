import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { 
    FaChartPie, FaSearch, FaClipboardList, FaComments, 
    FaHistory, FaExclamationTriangle, FaUserCog, 
    FaSignOutAlt, FaBars, FaTimes, FaBell, FaCar,
    FaPlusCircle, FaHandsHelping, FaMoneyBillWave, FaEdit,
    FaShieldAlt, FaUsers, FaIdBadge, FaChartLine, FaExclamationCircle, FaUserShield
} from 'react-icons/fa';
import { logout } from '../../store/slices/authSlice';
import { fetchNotifications, addNotification, resetNotifications } from '../../store/slices/notificationSlice';
import { getSocket, disconnectSocket } from '../../utils/socket';
import NotificationDropdown from '../ui/NotificationDropdown';
import { useEffect } from 'react';

const SidebarItem = ({ icon: Icon, label, path, active, isSidebarOpen, onClick }) => (
    <Link to={path} onClick={onClick}>
        <motion.div
            whileHover={{ x: 5 }}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer mb-2
                ${active 
                    ? 'bg-primary text-white shadow-lg shadow-indigo-100' 
                    : 'text-slate-500 hover:bg-indigo-50 hover:text-primary'}`}
        >
            <div className="text-lg flex-shrink-0">
                <Icon />
            </div>
            {!isSidebarOpen && (
                <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-semibold text-sm whitespace-nowrap"
                >
                    {label}
                </motion.span>
            )}
        </motion.div>
    </Link>
);

const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // actually isCollapsed
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, token } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!token) return;

        dispatch(fetchNotifications());

        const socket = getSocket(token);
        if (!socket) return;

        const handleConnect = () => {
            socket.emit('join_chat'); // Join personal room for notifications
        };
        const handleReceiveNotification = (notification) => {
            dispatch(addNotification(notification));
        };

        socket.on('connect', handleConnect);
        socket.on('receive_notification', handleReceiveNotification);

        // If already connected when handler is attached, join immediately.
        if (socket.connected) {
            handleConnect();
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('receive_notification', handleReceiveNotification);
        };
    }, [dispatch, token]);

    useEffect(() => {
        if (!token) return;

        // Fallback polling so notifications still update if websocket is unavailable.
        const intervalId = setInterval(() => {
            dispatch(fetchNotifications());
        }, 15000);

        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                dispatch(fetchNotifications());
            }
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [dispatch, token]);

    const pathRole = location.pathname.split('/')[1];
    const userRole = user?.role || (['passenger', 'rider', 'admin'].includes(pathRole) ? pathRole : 'passenger');

    const passengerMenuItems = [
        { icon: FaChartPie, label: 'Overview', path: '/passenger/dashboard' },
        { icon: FaSearch, label: 'Find Ride', path: '/passenger/find' },
        { icon: FaClipboardList, label: 'My Bookings', path: '/passenger/bookings' },
        { icon: FaComments, label: 'Messages', path: '/passenger/messages' },
        { icon: FaHistory, label: 'Ride History', path: '/passenger/history' },
        { icon: FaExclamationTriangle, label: 'Emergency SOS', path: '/passenger/sos', danger: true },
        { icon: FaExclamationCircle, label: 'Complaints', path: '/passenger/complaints' },
        { icon: FaUserCog, label: 'Settings', path: '/passenger/settings' },
    ];

    const riderMenuItems = [
        { icon: FaChartPie, label: 'Rider Insights', path: '/rider/dashboard' },
        { icon: FaPlusCircle, label: 'Create Route', path: '/rider/offer' },
        { icon: FaHandsHelping, label: 'Manage Rides', path: '/rider/manage' },
        { icon: FaCar, label: 'My Vehicles', path: '/rider/vehicles' },
        { icon: FaEdit, label: 'Edit Vehicle', path: '/rider/vehicles/edit' },
        { icon: FaComments, label: 'Passenger Chat', path: '/rider/messages' },
        { icon: FaExclamationTriangle, label: 'Safety Protocol', path: '/rider/sos', danger: true },
        { icon: FaExclamationCircle, label: 'Complaints', path: '/rider/complaints' },
        { icon: FaUserCog, label: 'Rider Profile', path: '/rider/settings' },
    ];

    const adminMenuItems = [
        { icon: FaChartPie, label: 'Admin Overlook', path: '/admin/dashboard' },
        { icon: FaUsers, label: 'User Directory', path: '/admin/users' },
        { icon: FaIdBadge, label: 'User Approvals', path: '/admin/approvals' },
        { icon: FaShieldAlt, label: 'Verification Hub', path: '/admin/verify' },
        { icon: FaChartLine, label: 'Statistics', path: '/admin/analytics' },
        { icon: FaComments, label: 'System Chat', path: '/admin/messages' },
        { icon: FaUserShield, label: 'Admin Management', path: '/admin/admins' },
        { icon: FaIdBadge, label: 'Registration Directory', path: '/admin/registrations' },
        { icon: FaUserCog, label: 'Admin Settings', path: '/admin/settings' },
    ];

    const menuItems = userRole === 'admin' 
        ? adminMenuItems 
        : (userRole === 'rider' ? riderMenuItems : passengerMenuItems);

    const handleLogout = () => {
        disconnectSocket();
        dispatch(resetNotifications());
        dispatch(logout());
        navigate('/login');
    };

    const getRoleColor = () => {
        if (userRole === 'admin') return 'bg-slate-900 border-slate-700 text-white';
        if (userRole === 'rider') return 'bg-emerald-50 text-emerald-600';
        return 'bg-indigo-50 text-primary';
    };

    const getRoleLabel = () => {
        if (userRole === 'admin') return 'System Administrator';
        if (userRole === 'rider') {
            if (user?.accountStatus === 'approved') return 'Verified Rider';
            return 'Verification Pending';
        }
        return 'Student Passenger';
    };

    const getSearchPlaceholder = () => {
        if (userRole === 'admin') return "Search users, rides, logs...";
        if (userRole === 'rider') return "Search passengers...";
        return "Find a ride...";
    };

    const getThemeColor = () => {
        if (userRole === 'admin') return 'ring-slate-800';
        if (userRole === 'rider') return 'ring-emerald-500';
        return 'ring-primary';
    };

    return (
        <div className="flex h-screen bg-surface font-sans overflow-hidden">
            {/* Sidebar - Desktop */}
            <motion.aside
                animate={{ width: isSidebarOpen ? '80px' : '280px' }}
                className="hidden md:flex flex-col bg-white border-r border-slate-100 p-4 transition-all duration-300 shadow-sm"
            >
                <div className="flex items-center justify-between mb-10 px-4 mt-2 h-10">
                    {!isSidebarOpen && (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 text-primary font-black text-2xl tracking-tighter"
                        >
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <FaCar size={20} />
                            </div>
                            <span className="truncate">RideShare</span>
                        </motion.div>
                    )}
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all duration-300 ${isSidebarOpen ? 'mx-auto' : ''}`}
                    >
                        {isSidebarOpen ? <FaBars /> : <FaTimes />}
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto no-scrollbar">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            {...item}
                            active={location.pathname === item.path}
                            isSidebarOpen={isSidebarOpen}
                        />
                    ))}
                </nav>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                    <div
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
                            ${getRoleColor()}`}
                    >
                        <div className="text-lg flex-shrink-0">
                            <FaIdBadge />
                        </div>
                        {!isSidebarOpen && (
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">Mode</p>
                                <p className="font-bold text-xs uppercase tracking-wider">{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:bg-indigo-50 hover:text-primary transition-all duration-200"
                    >
                        <div className="text-lg flex-shrink-0">
                            <FaSignOutAlt />
                        </div>
                        {!isSidebarOpen && (
                            <span className="font-semibold text-sm whitespace-nowrap">Logout</span>
                        )}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setShowMobileSidebar(true)}
                            className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                            <FaBars />
                        </button>
                        <div className={`relative hidden sm:block group bg-slate-50 rounded-xl transition-all border border-transparent focus-within:border-transparent focus-within:ring-2 ${getThemeColor()}`}>
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none group-focus-within:text-slate-600 transition-colors">
                                <FaSearch size={14} />
                            </span>
                            <input 
                                type="text" 
                                placeholder={getSearchPlaceholder()} 
                                className="bg-transparent border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-0 w-64 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6">
                        <NotificationDropdown />
                        
                        <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-slate-100 cursor-pointer group">
                            <div className="text-right hidden sm:block">
                                <p className={`text-sm font-bold leading-none transition-colors 
                                    ${userRole === 'rider' ? 'text-emerald-600 group-hover:text-emerald-700' : (userRole === 'admin' ? 'text-slate-900 group-hover:text-black' : 'text-slate-700 group-hover:text-primary')}`}>
                                    {user?.name || 'Campus User'}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1.5 uppercase tracking-widest font-black">
                                    {getRoleLabel()}
                                </p>
                            </div>
                            <div className={`w-10 h-10 rounded-full p-0.5 shadow-md
                                ${userRole === 'rider' ? 'bg-gradient-to-tr from-emerald-400 to-teal-500' : (userRole === 'admin' ? 'bg-slate-800' : 'bg-gradient-to-tr from-primary to-indigo-400')}`}>
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-primary font-bold border-2 border-white overflow-hidden">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className={userRole === 'rider' ? 'text-emerald-600' : (userRole === 'admin' ? 'text-slate-800' : 'text-primary')}>
                                            {(user?.name || 'CU').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {showMobileSidebar && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMobileSidebar(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 bg-white z-50 p-4 shadow-2xl md:hidden"
                        >
                            <div className="flex items-center justify-between mb-8 px-2">
                                <div className="flex items-center gap-2 text-primary font-bold text-xl">
                                    <FaCar size={24} />
                                    <span>RideShare</span>
                                </div>
                                <button 
                                    onClick={() => setShowMobileSidebar(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <nav>
                                {menuItems.map((item) => (
                                    <SidebarItem
                                        key={item.path}
                                        {...item}
                                        active={location.pathname === item.path}
                                        isSidebarOpen={false}
                                        onClick={() => setShowMobileSidebar(false)}
                                    />
                                ))}
                                <div className="pt-4 mt-4 border-t border-slate-100">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:bg-indigo-50 hover:text-primary transition-all duration-200"
                                    >
                                        <div className="text-lg flex-shrink-0">
                                            <FaSignOutAlt />
                                        </div>
                                        <span className="font-semibold text-sm whitespace-nowrap">Logout</span>
                                    </button>
                                </div>
                            </nav>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardLayout;
