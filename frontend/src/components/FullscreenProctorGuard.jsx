import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Monitor, XCircle, Play } from 'lucide-react';

const FullscreenProctorGuard = ({ children, title, onExit }) => {
    const [hasAttemptConfirmed, setHasAttemptConfirmed] = useState(false);
    const [isFullscreenActive, setIsFullscreenActive] = useState(false);
    const [violations, setViolations] = useState(0);
    const [showViolationWarning, setShowViolationWarning] = useState(false);

    // Track fullscreen status
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFS = !!document.fullscreenElement;
            setIsFullscreenActive(isFS);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    // Track tab switching / window blur
    useEffect(() => {
        if (!hasAttemptConfirmed) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setViolations(v => v + 1);
                setShowViolationWarning(true);
            }
        };

        const handleBlur = () => {
            // Ignore blur event if focus shifted to an embedded iframe (e.g. YouTube player interaction)
            if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
                return;
            }
            setViolations(v => v + 1);
            setShowViolationWarning(true);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [hasAttemptConfirmed]);

    const enterFullscreen = async () => {
        try {
            const docEl = document.documentElement;
            if (docEl.requestFullscreen) {
                await docEl.requestFullscreen();
            } else if (docEl.webkitRequestFullscreen) { /* Safari */
                await docEl.webkitRequestFullscreen();
            } else if (docEl.msRequestFullscreen) { /* IE11 */
                await docEl.msRequestFullscreen();
            }
            setIsFullscreenActive(true);
            setHasAttemptConfirmed(true);
        } catch (err) {
            console.error("Failed to enter fullscreen mode:", err);
            alert("Please allow fullscreen mode to start the assessment.");
        }
    };

    const handleAcknowledgeViolation = async () => {
        setShowViolationWarning(false);
        // Ensure we are still in fullscreen
        if (!document.fullscreenElement) {
            await enterFullscreen();
        }
    };

    // Exit fullscreen on component unmount
    useEffect(() => {
        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.log(err));
            }
        };
    }, []);

    // 1. Initial Attempt Confirmation Modal
    if (!hasAttemptConfirmed) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 flex flex-col text-center"
                >
                    <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center text-primary-600 mx-auto mb-8 border border-primary-100 shadow-sm animate-pulse">
                        <Monitor size={38} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Attempt Task?</h2>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed mb-8">
                        You are about to start the assessment for <span className="text-primary-600 font-bold">"{title || 'Practice Session'}"</span>. 
                        This task will run in <span className="font-bold text-gray-900">Fullscreen Mode</span>. 
                        To maintain test integrity, switching tabs or leaving the browser window is strictly prohibited.
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={onExit}
                            className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-gray-200 transition active:scale-95 border border-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={enterFullscreen}
                            className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-primary-500 transition active:scale-95 shadow-xl shadow-primary-500/25 flex items-center justify-center gap-2"
                        >
                            <Play size={16} className="fill-current" /> Start Attempt
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // 2. Fullscreen Lost Blocker
    if (!isFullscreenActive) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 flex flex-col text-center"
                >
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-600 mx-auto mb-8 border border-rose-100 shadow-sm animate-bounce">
                        <AlertTriangle size={38} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Fullscreen Required</h2>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed mb-8">
                        Exiting fullscreen is not allowed during this assessment. Please return to fullscreen mode to resume your test.
                    </p>

                    <button
                        onClick={enterFullscreen}
                        className="py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-black transition active:scale-95 shadow-xl shadow-gray-900/20"
                    >
                        Return to Fullscreen
                    </button>
                </motion.div>
            </div>
        );
    }

    // 3. Tab Switching / Blur Violation Warning Blocker
    if (showViolationWarning) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-rose-950/95 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-2xl p-10 border border-rose-100 flex flex-col text-center"
                >
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-600 mx-auto mb-8 border border-rose-100 shadow-sm">
                        <XCircle size={38} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Violation Warning!</h2>
                    <div className="text-rose-600 bg-rose-50 px-4 py-2.5 rounded-2xl font-black text-sm uppercase tracking-wider border border-rose-100 w-max mx-auto mb-6">
                        Violations Recorded: {violations}
                    </div>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed mb-8">
                        You left the test window or switched tabs. Tab switching is strictly prohibited during the assessment to ensure a fair environment.
                    </p>

                    <button
                        onClick={handleAcknowledgeViolation}
                        className="py-4 bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-rose-500 transition active:scale-95 shadow-xl shadow-rose-600/25"
                    >
                        Acknowledge & Resume
                    </button>
                </motion.div>
            </div>
        );
    }

    // 4. Normal Render (fullscreen is active, confirmed, no warnings)
    return <>{children}</>;
};

export default FullscreenProctorGuard;
