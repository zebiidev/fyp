import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { FaCar, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'react-toastify';

import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const dashboardByRole = {
    passenger: '/passenger/dashboard',
    rider: '/rider/dashboard',
    admin: '/admin/dashboard',
};

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

    // Already logged in – send to the appropriate dashboard
    if (isAuthenticated && user) {
        return <Navigate to={dashboardByRole[user.role] ?? '/'} replace />;
    }

    const onSubmit = async (data) => {
        const result = await dispatch(loginUser(data));
        if (loginUser.fulfilled.match(result)) {
            toast.success('Login Successful! Welcome back.');
            const user = result.payload.user;
            if (user.role === 'passenger') navigate('/passenger/dashboard');
            else if (user.role === 'rider') navigate('/rider/dashboard');
            else if (user.role === 'admin') navigate('/admin/dashboard');
        } else {
             toast.error(result.payload || 'Login failed');
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans"
        >
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-primary mb-4 transition-transform hover:scale-110 duration-300">
                    <FaCar size={48} />
                </div>
                <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    Welcome Back
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Log in to your Smart Campus account
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
                <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                            <div className="mt-1 relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                    <FaEnvelope />
                                </span>
                                <input
                                    {...register('email', { 
                                        required: 'Email is required',
                                        pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' }
                                    })}
                                    type="email"
                                    className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${errors.email ? 'border-warning' : 'border-slate-300 text-slate-900'}`}
                                    placeholder="your@email.com"
                                />
                            </div>
                            {errors.email && <p className="mt-1 text-xs text-warning font-medium">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700">Password</label>
                            <div className="mt-1 relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                                    <FaLock />
                                </span>
                                <input
                                    {...register('password', { required: 'Password is required' })}
                                    type={showPassword ? 'text' : 'password'}
                                    className={`appearance-none block w-full pl-10 pr-10 py-2 border rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${errors.password ? 'border-warning' : 'border-slate-300 text-slate-900'}`}
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
                            {errors.password && <p className="mt-1 text-xs text-warning font-medium">{errors.password.message}</p>}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <a href="#" className="font-semibold text-primary hover:text-primary-dark transition-colors">
                                    Forgot your password?
                                </a>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-600">
                            Don't have an account?{' '}
                            <Link to="/signup" className="font-bold text-primary hover:text-primary-dark transition-colors underline decoration-indigo-200 underline-offset-4 decoration-2">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Login;
