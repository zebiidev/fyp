import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from '../ui/Loader';

const rolePathPrefix = {
    passenger: '/passenger',
    rider: '/rider',
    admin: '/admin'
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    // Temporary development bypass:
    // set VITE_DISABLE_ROUTE_GUARDS=true to disable route protection.
    const guardsDisabled = import.meta.env.VITE_DISABLE_ROUTE_GUARDS === 'true';

    const location = useLocation();
    const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

    if (guardsDisabled) {
        return children;
    }

    if (loading) {
        return <Loader fullPage />;
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user.role !== 'admin' && user.accountStatus !== 'approved') {
        return <Navigate to="/pending-approval" replace />;
    }

    if (user.role === 'passenger' || user.role === 'rider') {
        const isPassenger = user.role === 'passenger';
        const profileComplete = isPassenger
            ? Boolean(
                user.phoneNumber &&
                user.registrationNumber &&
                user.department &&
                user.programme &&
                user.semester &&
                user.emergencyName &&
                user.emergencyContact &&
                user.cnic
            )
            : Boolean(
                user.phoneNumber &&
                user.registrationNumber &&
                user.department &&
                user.programme &&
                user.semester &&
                user.emergencyName &&
                user.emergencyContact &&
                user.cnic &&
                user.gender
            );

        const vehicleComplete = isPassenger
            ? true
            : Boolean(
                user.vehicleDetails?.make &&
                user.vehicleDetails?.model &&
                user.vehicleDetails?.plateNumber
            );

        const allowedIncompletePaths = isPassenger
            ? ['/passenger/dashboard', '/passenger/profile/complete']
            : ['/rider/dashboard', '/rider/profile/complete', '/rider/vehicle/complete'];

        if (!profileComplete && !allowedIncompletePaths.includes(location.pathname)) {
            const destination = isPassenger ? '/passenger/profile/complete' : '/rider/profile/complete';
            return <Navigate to={destination} replace />;
        }

        if (!isPassenger && profileComplete && !vehicleComplete && !allowedIncompletePaths.includes(location.pathname)) {
            return <Navigate to="/rider/vehicle/complete" replace />;
        }
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        const fallback = rolePathPrefix[user.role] ? `${rolePathPrefix[user.role]}/dashboard` : '/';
        return <Navigate to={fallback} replace />;
    }

    return children;
};

export default ProtectedRoute;
