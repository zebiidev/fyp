import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "./components/ui/Loader";

const Home = React.lazy(() => import("./pages/Home"));
const Login = React.lazy(() => import("./pages/Login"));
const Signup = React.lazy(() => import("./pages/Signup"));
const PendingApproval = React.lazy(() => import("./pages/PendingApproval"));
const PassengerDashboard = React.lazy(() => import("./pages/passenger/Dashboard"));
const AreaRiders = React.lazy(() => import("./pages/passenger/AreaRiders"));
const FindRide = React.lazy(() => import("./pages/passenger/FindRide"));
const MyBookings = React.lazy(() => import("./pages/passenger/MyBookings"));
const TrackRide = React.lazy(() => import("./pages/passenger/TrackRide"));
const Messages = React.lazy(() => import("./pages/passenger/Messages"));
const RideHistory = React.lazy(() => import("./pages/passenger/RideHistory"));
const EmergencySOS = React.lazy(() => import("./pages/passenger/EmergencySOS"));
const Settings = React.lazy(() => import("./pages/passenger/Settings"));
const Complaint = React.lazy(() => import("./pages/passenger/Complaint"));
const CompleteProfile = React.lazy(() => import("./pages/passenger/CompleteProfile"));
const RiderDashboard = React.lazy(() => import("./pages/rider/Dashboard"));
const OfferRide = React.lazy(() => import("./pages/rider/OfferRide"));
const ManageRides = React.lazy(() => import("./pages/rider/ManageRides"));
const VehicleManagement = React.lazy(() => import("./pages/rider/VehicleManagement"));
const EditVehicle = React.lazy(() => import("./pages/rider/EditVehicle"));
const CompleteRiderProfile = React.lazy(() => import("./pages/rider/CompleteRiderProfile"));
const VehicleCompletion = React.lazy(() => import("./pages/rider/VehicleCompletion"));
const AdminDashboard = React.lazy(() => import("./pages/admin/Dashboard"));
const UserApprovals = React.lazy(() => import("./pages/admin/UserApprovals"));
const UserDirectory = React.lazy(() => import("./pages/admin/UserDirectory"));
const VerificationPortal = React.lazy(() => import("./pages/admin/VerificationPortal"));
const SystemAnalytics = React.lazy(() => import("./pages/admin/SystemAnalytics"));
const AdminSettings = React.lazy(() => import("./pages/admin/Settings"));
const AdminComplaints = React.lazy(() => import("./pages/admin/Complaints"));
const AdminManagement = React.lazy(() => import("./pages/admin/AdminManagement"));
const RegistrationDirectory = React.lazy(() => import("./pages/admin/RegistrationDirectory"));
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RootRedirect from "./components/auth/RootRedirect";
import { loadUser } from "./store/slices/authSlice";
import api from "./utils/api";

function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  // Fire health ping after initial render, non-blocking
  useEffect(() => {
    const id = setTimeout(() => api.get("/health", { timeout: 8000 }).catch(() => {}), 3000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (token && !user) {
      dispatch(loadUser());
    }
  }, [dispatch, token, user]);

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
        <React.Suspense fallback={<Loader fullPage message="Loading page..." />}>
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
            path="/passenger/area-riders"
            element={
              <ProtectedRoute allowedRoles={["passenger"]}>
                {wrapWithLayout(<AreaRiders />)}
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
          <Route
            path="/admin/registrations"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                {wrapWithLayout(<RegistrationDirectory />)}
              </ProtectedRoute>
            }
          />
        </Routes>
        </React.Suspense>
      </Router>
    </>
  );
}

export default App;
