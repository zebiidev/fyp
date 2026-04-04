import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaBroadcastTower } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const EmergencySOS = () => {
    const [sending, setSending] = useState(false);

    const handleSos = async () => {
        if (sending) return;
        setSending(true);

        const payload = { message: 'Emergency SOS triggered', location: null };

        const sendRequest = async () => {
            try {
                await api.post('/sos', payload);
                toast.success('SOS sent. Admins have been notified.');
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to send SOS.');
            } finally {
                setSending(false);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    payload.location = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy
                    };
                    sendRequest();
                },
                () => {
                    sendRequest();
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        } else {
            sendRequest();
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center p-4 bg-rose-50 text-warning rounded-full mb-2 animate-pulse">
                    <FaShieldAlt size={32} />
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Security & Safety</h1>
                <p className="text-lg text-slate-500 max-w-xl mx-auto">
                    Your safety is our top priority. Use these tools in case of any emergency or suspicious activity.
                </p>
            </div>

            <div className="bg-rose-600 rounded-[40px] p-10 text-center shadow-2xl shadow-rose-200 relative overflow-hidden group">
                <div className="relative z-10 space-y-6">
                    <h2 className="text-5xl font-black text-white">S.O.S</h2>
                    <p className="text-rose-100 font-bold tracking-widest uppercase">One-Tap Emergency Alert</p>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSos}
                        disabled={sending}
                        className="w-40 h-40 rounded-full bg-white text-rose-600 shadow-2xl flex flex-col items-center justify-center gap-3 mx-auto border-[10px] border-rose-500/50 hover:border-rose-400 group-hover:shadow-rose-400/50 transition-all"
                    >
                        <FaBroadcastTower size={40} className="animate-bounce" />
                        <span className="font-black text-xl">{sending ? 'SENDING...' : 'ACTIVATE'}</span>
                    </motion.button>
                    <p className="text-rose-200 text-sm font-medium">Sends your live location to Admin & Emergency Contacts</p>
                </div>
                {/* Decorative background shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 rounded-full -mr-20 -mt-20 opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-700 rounded-full -ml-20 -mb-20 opacity-50 blur-3xl"></div>
            </div>

            <div className="pb-20" />
        </div>
    );
};

export default EmergencySOS;
