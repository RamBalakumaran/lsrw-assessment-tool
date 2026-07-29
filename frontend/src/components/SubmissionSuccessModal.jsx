import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles, Star } from 'lucide-react';

/**
 * SubmissionSuccessModal Component
 * Premium Skillrack-like celebratory popup upon successful task submission.
 *
 * @param {boolean} isOpen - Whether the modal is active
 * @param {function} onComplete - Callback executed after celebration timer (~3s) finishes
 */
const SubmissionSuccessModal = ({ isOpen, onComplete }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Generate randomized confetti & firecracker particles
      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#6366f1'];
      const generated = Array.from({ length: 45 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 600, // burst spread width
        y: (Math.random() - 0.6) * 500, // burst height upward/downward
        size: Math.random() * 12 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 720 - 360,
        shape: Math.random() > 0.4 ? 'circle' : Math.random() > 0.5 ? 'square' : 'star',
        delay: Math.random() * 0.3
      }));
      setParticles(generated);

      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 2800);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onComplete]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Dark transparent blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
          />

          {/* Burst Particles Container */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0.2, 1.2, 1, 0.4],
                  x: p.x,
                  y: [0, p.y, p.y + 120], // slight gravity drop
                  rotate: p.rotation
                }}
                transition={{
                  duration: 2.2,
                  delay: p.delay,
                  ease: [0.25, 1, 0.5, 1]
                }}
                style={{
                  position: 'absolute',
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '4px' : '0%',
                  clipPath: p.shape === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : undefined,
                  boxShadow: `0 0 12px ${p.color}`
                }}
              />
            ))}

            {/* Top Confetti Rain Streams */}
            {Array.from({ length: 25 }).map((_, i) => {
              const xPos = (i / 25) * 100;
              const delay = Math.random() * 0.4;
              const color = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'][i % 5];
              return (
                <motion.div
                  key={`rain-${i}`}
                  initial={{ opacity: 0, y: '-10vh', x: `${xPos}vw`, rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    y: ['-10vh', '110vh'],
                    rotate: 360 + Math.random() * 360
                  }}
                  transition={{
                    duration: 2.6,
                    delay: delay,
                    ease: 'easeOut'
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: Math.random() * 8 + 6,
                    height: Math.random() * 16 + 10,
                    backgroundColor: color,
                    borderRadius: '2px'
                  }}
                />
              );
            })}
          </div>

          {/* Main Glassmorphism Celebration Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.75, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -20 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25
            }}
            className="relative z-10 w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-center overflow-hidden"
          >
            {/* Ambient Background Glow inside modal */}
            <div className="absolute -top-20 -left-20 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Glowing Success Badge */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.25, 1] }}
                transition={{ delay: 0.15, duration: 0.5, type: 'spring' }}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 shadow-lg shadow-emerald-500/30 flex items-center justify-center"
              >
                <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
              </motion.div>

              {/* Sparkle Icons around check */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 pointer-events-none"
              >
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-pulse" />
                <Star className="absolute -bottom-1 -left-2 w-5 h-5 text-indigo-400 animate-pulse" />
              </motion.div>
            </div>

            {/* Title & Description */}
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-2xl md:text-3xl font-black bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent mb-3"
            >
              🎉 Task Submitted Successfully!
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-sm md:text-base font-semibold text-slate-600 dark:text-slate-300 leading-relaxed mb-6"
            >
              Your submission has been recorded successfully.<br />
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">Preparing your performance report...</span>
            </motion.p>

            {/* Subtle Progress Bar Loader */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.7, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 rounded-full"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubmissionSuccessModal;
