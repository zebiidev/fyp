import React from 'react';
import { motion } from 'framer-motion';
import { FaCar } from 'react-icons/fa';

/**
 * Modern full-area loader with animated car icon & pulsing rings.
 *
 * Props:
 *   message  – optional text shown below the icon (default: "Loading…")
 *   fullPage – if true, centres on the whole viewport; otherwise fills its parent
 *   size     – "sm" | "md" | "lg" (default "md")
 */
const sizeMap = {
    sm: { icon: 16, ring: 'w-12 h-12', outerRing: 'w-16 h-16', text: 'text-xs' },
    md: { icon: 22, ring: 'w-16 h-16', outerRing: 'w-24 h-24', text: 'text-sm' },
    lg: { icon: 32, ring: 'w-20 h-20', outerRing: 'w-32 h-32', text: 'text-base' },
};

const Loader = ({ message = '', fullPage = false, size = 'md' }) => {
    const s = sizeMap[size] || sizeMap.md;

    return (
        <div className={`flex flex-col items-center justify-center ${fullPage ? 'min-h-screen bg-surface' : 'py-16'}`}>
            {/* Animated rings + icon */}
            <div className="relative flex items-center justify-center">
                {/* Outer pulsing ring */}
                <motion.div
                    className={`absolute ${s.outerRing} rounded-full border-2 border-primary/20`}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Middle spinning ring */}
                <motion.div
                    className={`absolute ${s.ring} rounded-full`}
                    style={{
                        background: 'conic-gradient(from 0deg, transparent 0%, transparent 60%, var(--color-primary, #6366f1) 100%)',
                        WebkitMask: 'radial-gradient(circle, transparent 55%, black 57%)',
                        mask: 'radial-gradient(circle, transparent 55%, black 57%)',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                />

                {/* Centre icon */}
                <motion.div
                    className="relative z-10 text-primary"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <FaCar size={s.icon} />
                </motion.div>
            </div>

            {/* Animated dots text */}
            {message && (
                <motion.p
                    className={`mt-6 ${s.text} font-semibold text-slate-400 tracking-wide`}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                    {message}
                </motion.p>
            )}
        </div>
    );
};

export default Loader;
