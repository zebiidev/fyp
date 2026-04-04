import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from '../ui/Loader';

const dashboardByRole = {
    passenger: '/passenger/dashboard',
    rider: '/rider/dashboard',
    admin: '/admin/dashboard',
};

const RootRedirect = () => {
    const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

    // While the auth state is being initialised (token exists, loadUser in flight)
    // show a simple spinner so we don't flash the home page first.
    if (loading) {
        return <Loader fullPage />;
    }

    // Redirect authenticated users to their role-specific dashboard
    if (isAuthenticated && user) {
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
            if (!profileComplete) {
                const destination = isPassenger ? '/passenger/profile/complete' : '/rider/profile/complete';
                return <Navigate to={destination} replace />;
            }
            if (!isPassenger && !vehicleComplete) {
                return <Navigate to="/rider/vehicle/complete" replace />;
            }
        }
        const destination = dashboardByRole[user.role] ?? '/';
        return <Navigate to={destination} replace />;
    }

    // Not authenticated – redirect to login
    return <Navigate to="/login" replace />;
};

export default RootRedirect;
