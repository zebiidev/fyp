import React from 'react';
import { motion } from 'framer-motion';
import { FaCar, FaPlus, FaCheckCircle, FaEdit, FaShieldAlt } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Loader from '../../components/ui/Loader';

const VehicleCard = ({ vehicle }) => (
    <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between group"
    >
        <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-2xl ${vehicle.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'} group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300`}>
                <FaCar size={24} />
            </div>
            <div className="flex gap-2">
                <Link to="/rider/vehicles/edit" className="p-2 text-slate-300 hover:text-primary transition-colors">
                    <FaEdit size={16} />
                </Link>
            </div>
        </div>

        <div>
            <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-black text-slate-800">{vehicle.model || 'Unknown Model'}</h3>
                {vehicle.isVerified && <FaCheckCircle className="text-emerald-500" size={14} title="Verified Vehicle" />}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full inline-block">
                {vehicle.plateNumber || 'No Plate'}
            </p>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <FaShieldAlt className={vehicle.isVerified ? 'text-emerald-500' : 'text-slate-300'} size={12} />
                <span className="text-[10px] font-bold text-slate-500 uppercase">{vehicle.isVerified ? 'Verified' : 'Pending Verification'}</span>
            </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase">Active</span>
        </div>
    </motion.div>
);

const VehicleManagement = () => {
    const { user, loading } = useSelector((state) => state.auth);

    const vehicle = user?.vehicleDetails;

    if (loading && !user) return <Loader fullPage />;

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 mb-2">My Vehicles</h1>
                    <p className="text-slate-500 font-medium italic">Manage the vehicles you use for campus rides.</p>
                </div>
                {vehicle ? (
                    <Link to="/rider/vehicles/edit">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-emerald-600 text-white px-8 py-4 rounded-[24px] font-black shadow-2xl shadow-emerald-100 flex items-center justify-center gap-3"
                        >
                            <FaEdit /> Edit Vehicle
                        </motion.button>
                    </Link>
                ) : (
                    <Link to="/rider/vehicles/edit">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-emerald-600 text-white px-8 py-4 rounded-[24px] font-black shadow-2xl shadow-emerald-100 flex items-center justify-center gap-3"
                        >
                            <FaPlus /> Add Vehicle
                        </motion.button>
                    </Link>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {vehicle ? (
                    <VehicleCard vehicle={vehicle} />
                ) : (
                    <div className="col-span-full">
                        <Link to="/rider/vehicles/edit">
                            <motion.button
                                whileHover={{ y: -5 }}
                                className="w-full bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-[32px] flex flex-col items-center justify-center gap-4 text-slate-400 hover:bg-white hover:border-primary hover:text-primary transition-all group"
                            >
                                <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-all">
                                    <FaPlus size={24} />
                                </div>
                                <span className="text-sm font-black uppercase tracking-widest">Register Your Vehicle</span>
                            </motion.button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleManagement;
