import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PendingApproval from "./pages/PendingApproval";
import PassengerDashboard from "./pages/passenger/Dashboard";
import FindRide from "./pages/passenger/FindRide";
import MyBookings from "./pages/passenger/MyBookings";
import TrackRide from "./pages/passenger/TrackRide";
import Messages from "./pages/passenger/Messages";
import RideHistory from "./pages/passenger/RideHistory";
import EmergencySOS from "./pages/passenger/EmergencySOS";
import Settings from "./pages/passenger/Settings";
import Complaint from "./pages/passenger/Complaint";
import CompleteProfile from "./pages/passenger/CompleteProfile";
import RiderDashboard from "./pages/rider/Dashboard";
import OfferRide from "./pages/rider/OfferRide";
import ManageRides from "./pages/rider/ManageRides";
import VehicleManagement from "./pages/rider/VehicleManagement";
import EditVehicle from "./pages/rider/EditVehicle";
import CompleteRiderProfile from "./pages/rider/CompleteRiderProfile";
import VehicleCompletion from "./pages/rider/VehicleCompletion";
import AdminDashboard from "./pages/admin/Dashboard";
import UserApprovals from "./pages/admin/UserApprovals";
import UserDirectory from "./pages/admin/UserDirectory";
import VerificationPortal from "./pages/admin/VerificationPortal";
import SystemAnalytics from "./pages/admin/SystemAnalytics";
import AdminSettings from "./pages/admin/Settings";
import AdminComplaints from "./pages/admin/Complaints";
import AdminManagement from "./pages/admin/AdminManagement";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RootRedirect from "./components/auth/RootRedirect";
import { loadUser } from "./store/slices/authSlice";

function App() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(loadUser());
    }
  }, [dispatch, token]);

  const wrapWithLayout = (component) => (
    <DashboardLayout>{component}</DashboardLayout>
  );

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Router>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* Passenger Dashboard Routes */}
            <Route
              path="/passenger/dashboard"
              element={
                <ProtectedRoute allowedRoles={["passenger"]}>
                  {wrapWithLayout(<PassengerDashboard />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/passenger/find"
              element={
                <ProtectedRoute allowedRoles={["passenger"]}>
                  {wrapWithLayout(<FindRide />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/passenger/bookings"
              element={
                <ProtectedRoute allowedRoles={["passenger"]}>
                  {wrapWithLayout(<MyBookings />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/passenger/track/:rideId"
              element={
                <ProtectedRoute allowedRoles={["passenger"]}>
                  {wrapWithLayout(<TrackRide />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/passenger/messages"
              element={
                <ProtectedRoute allowedRoles={["passenger"]}>
                  {wrapWithLayout(<Messages />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/passenger/history"
              element={
                <ProtectedRoute allowedRoles={["passenger"]}>
                  {wrapWithLayout(<RideHistory />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/passenger/sos"
              element={
                <ProtectedRoute allowedRoles={["passenger"]}>
                  {wrapWithLayout(<EmergencySOS />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/passenger/complaints"
              element={
                <ProtectedRoute allowedRoles={["passenger"]}>
                  {wrapWithLayout(<Complaint />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/passenger/settings"
              element={
                <ProtectedRoute allowedRoles={["passenger"]}>
                  {wrapWithLayout(<Settings />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/passenger/profile/complete"
              element={
                <ProtectedRoute allowedRoles={["passenger"]}>
                  {wrapWithLayout(<CompleteProfile />)}
                </ProtectedRoute>
              }
            />

            {/* Rider Dashboard Routes */}
            <Route
              path="/rider/dashboard"
              element={
                <ProtectedRoute allowedRoles={["rider"]}>
                  {wrapWithLayout(<RiderDashboard />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/offer"
              element={
                <ProtectedRoute allowedRoles={["rider"]}>
                  {wrapWithLayout(<OfferRide />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/manage"
              element={
                <ProtectedRoute allowedRoles={["rider"]}>
                  {wrapWithLayout(<ManageRides />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/vehicles"
              element={
                <ProtectedRoute allowedRoles={["rider"]}>
                  {wrapWithLayout(<VehicleManagement />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/vehicles/edit"
              element={
                <ProtectedRoute allowedRoles={["rider"]}>
                  {wrapWithLayout(<EditVehicle />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/profile/complete"
              element={
                <ProtectedRoute allowedRoles={["rider"]}>
                  {wrapWithLayout(<CompleteRiderProfile />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/vehicle/complete"
              element={
                <ProtectedRoute allowedRoles={["rider"]}>
                  {wrapWithLayout(<VehicleCompletion />)}
                </ProtectedRoute>
              }
            />

            {/* Rider Prefixed Shared Features */}
            <Route
              path="/rider/messages"
              element={
                <ProtectedRoute allowedRoles={["rider"]}>
                  {wrapWithLayout(<Messages />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/sos"
              element={
                <ProtectedRoute allowedRoles={["rider"]}>
                  {wrapWithLayout(<EmergencySOS />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/complaints"
              element={
                <ProtectedRoute allowedRoles={["rider"]}>
                  {wrapWithLayout(<Complaint />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/settings"
              element={
                <ProtectedRoute allowedRoles={["rider"]}>
                  {wrapWithLayout(<Settings />)}
                </ProtectedRoute>
              }
            />

            {/* Super Admin Dashboard Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  {wrapWithLayout(<AdminDashboard />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  {wrapWithLayout(<UserDirectory />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/approvals"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  {wrapWithLayout(<UserApprovals />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/verify"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  {wrapWithLayout(<VerificationPortal />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  {wrapWithLayout(<SystemAnalytics />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/complaints"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  {wrapWithLayout(<AdminComplaints />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  {wrapWithLayout(<Messages />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  {wrapWithLayout(<AdminSettings />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/admins"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  {wrapWithLayout(<AdminManagement />)}
                </ProtectedRoute>
              }
            />
          </Routes>
      </Router>
    </>
  );
}

export default App;
