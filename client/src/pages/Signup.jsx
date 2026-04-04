import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate } from "react-router-dom";
import {
  FaCar,
  FaUser,
  FaEnvelope,
  FaLock,
  FaIdCard,
  FaClipboardCheck,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../store/slices/authSlice";
import { useNavigate } from "react-router-dom";

const dashboardByRole = {
  passenger: "/passenger/dashboard",
  rider: "/rider/dashboard",
  admin: "/admin/dashboard",
};

const Signup = () => {
  const [role, setRole] = useState("passenger");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  // Already logged in – send to the appropriate dashboard
  if (isAuthenticated && user) {
    return <Navigate to={dashboardByRole[user.role] ?? "/"} replace />;
  }

  const onSubmit = async (data) => {
    const normalizedRole = role === "driver" ? "rider" : role;

    // Prepare data based on role
    const userData = {
      name: data.fullName,
      email: data.email,
      password: data.password,
      role: normalizedRole,
      registrationNumber: data.registrationNumber,
      // Add driver specific fields if applicable
      ...(role === "driver" && {
        vehicleDetails: {
          plateNumber: data.plateNumber,
          licenseNumber: data.licenseNumber,
          // other fields if collected
        },
      }),
    };

    const result = await dispatch(registerUser(userData));
    if (registerUser.fulfilled.match(result)) {
      toast.success(result.payload?.message || "Account created! Please wait for admin approval.");
      navigate("/pending-approval");
    } else {
      toast.error(result.payload || "Registration failed");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-surface flex flex-col justify-center overflow-y-hidden py-12 sm:px-6 lg:px-8 font-sans"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-primary mb-4 transition-transform hover:scale-110 duration-300">
          <FaCar size={48} />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Your Account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Join the university ride-sharing network
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200">
          {/* Role Selector */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
            <button
              type="button"
              onClick={() => setRole("passenger")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${role === "passenger" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <FaUser size={14} /> Passenger
            </button>
            <button
              type="button"
              onClick={() => setRole("driver")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${role === "driver" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <FaCar size={14} /> Driver
            </button>
          </div>

          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Basic Info */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <div className="mt-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <FaUser />
                </span>
                <input
                  {...register("fullName", { required: "Name is required" })}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all ${errors.fullName ? "border-warning" : "border-slate-300 text-slate-900"}`}
                  placeholder="John Doe"
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-xs text-warning">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <FaEnvelope />
                </span>
                <input
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: "Invalid format" },
                  })}
                  type="email"
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all ${errors.email ? "border-warning" : "border-slate-300 text-slate-900"}`}
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-warning">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Registration Number
              </label>
              <div className="mt-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <FaIdCard />
                </span>
                <input
                  {...register("registrationNumber", {
                    required: "Registration Number is required",
                  })}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all ${errors.registrationNumber ? "border-warning" : "border-slate-300 text-slate-900"}`}
                  placeholder="e.g. FA19-BCS-001"
                />
              </div>
              {errors.registrationNumber && (
                <p className="mt-1 text-xs text-warning">
                  {errors.registrationNumber.message}
                </p>
              )}
            </div>

            {/* Password Section */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="mt-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <FaLock />
                </span>
                <input
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Min 6 characters" },
                  })}
                  type={showPassword ? "text" : "password"}
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all ${errors.password ? "border-warning" : "border-slate-300 text-slate-900"}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-warning">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <FaLock />
                </span>
                <input
                  {...register("confirmPassword", {
                    validate: (value) =>
                      value === watch("password") || "Passwords do not match",
                  })}
                  type={showConfirmPassword ? "text" : "password"}
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all ${errors.confirmPassword ? "border-warning" : "border-slate-300 text-slate-900"}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-primary transition-colors"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-warning">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Driver Specific Fields */}
            {role === "driver" && (
              <>
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700">
                    License Number
                  </label>
                  <div className="mt-1 relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <FaIdCard />
                    </span>
                    <input
                      {...register("licenseNumber", {
                        required: "License is required",
                      })}
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 text-slate-900 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      placeholder="ABC-12345678"
                    />
                  </div>
                  {errors.licenseNumber && (
                    <p className="mt-1 text-xs text-warning">
                      {errors.licenseNumber.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700">
                    Plate Number
                  </label>
                  <div className="mt-1 relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <FaCar />
                    </span>
                    <input
                      {...register("plateNumber", {
                        required: "Plate number is required",
                      })}
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 text-slate-900 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      placeholder="LED-1234"
                    />
                  </div>
                  {errors.plateNumber && (
                    <p className="mt-1 text-xs text-warning">
                      {errors.plateNumber.message}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? "Creating Account..." : "Get Started"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-primary hover:text-primary-dark transition-colors underline decoration-indigo-200 underline-offset-4 decoration-2"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Signup;
