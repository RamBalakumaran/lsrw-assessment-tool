import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import {
    Lock,
    Eye,
    EyeOff,
    CheckCircle,
    AlertCircle,
    Loader2,
    ShieldAlert,
} from 'lucide-react';
import { motion } from 'framer-motion';

const readStoredUser = () => {
    try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
        return null;
    }
};

const PasswordReset = () => {
    const [user] = useState(readStoredUser);
    const navigate = useNavigate();
    const isForced = Boolean(user?.forcePasswordReset);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // Validation
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setError('All fields are required.');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('New password must be at least 6 characters.');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        if (formData.currentPassword === formData.newPassword) {
            setError('New password must be different from current password.');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/reset-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            });

            setSuccess(true);
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });

            // Update local user state: clear forcePasswordReset flag
            try {
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                storedUser.forcePasswordReset = false;
                localStorage.setItem('user', JSON.stringify(storedUser));
            } catch (_) {}

            if (isForced) {
                // Redirect to role dashboard after short delay
                setTimeout(() => {
                    const role = user?.role;
                    if (role === 'ADMIN') navigate('/admin/dashboard');
                    else if (role === 'TEACHER') navigate('/teacher/dashboard');
                    else navigate('/dashboard');
                }, 1800);
            } else {
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Password reset failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar role="STUDENT" />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm max-w-lg text-center">
                        <h1 className="text-3xl font-black text-gray-900 mb-3">Session Expired</h1>
                        <p className="text-gray-500 font-medium">Please log in again to reset your password.</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role={user.role} />

            <main className="flex-1 p-10 overflow-y-auto">
                <header className="mb-10">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                        {isForced ? 'Set Your Password' : 'Reset Password'}
                    </h1>
                    <p className="text-gray-500 font-medium">
                        {isForced ? 'Your account requires a new password before you can continue.' : 'Change your account password securely.'}
                    </p>
                </header>

                {isForced && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3"
                    >
                        <ShieldAlert size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="font-black text-amber-900 text-sm">First Login — Password Setup Required</div>
                            <div className="text-xs text-amber-700 mt-0.5">Your account was created with a temporary password. Please set a new secure password to access the platform.</div>
                        </div>
                    </motion.div>
                )}

                <div className="max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 p-10"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                                <Lock size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">Secure Password Update</h2>
                                <p className="text-gray-500 font-medium text-sm">Keep your account safe with a strong password</p>
                            </div>
                        </div>

                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3"
                            >
                                <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
                                <div>
                                    <div className="font-black text-emerald-900">Password Updated!</div>
                                    <div className="text-sm text-emerald-700">
                                        {isForced
                                            ? 'Your password has been set. Redirecting to your dashboard…'
                                            : 'Your password has been changed successfully.'}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3"
                            >
                                <AlertCircle size={20} className="text-rose-600 flex-shrink-0" />
                                <div>
                                    <div className="font-black text-rose-900">Error</div>
                                    <div className="text-sm text-rose-700">{error}</div>
                                </div>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Current Password */}
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold pr-14 disabled:opacity-60"
                                        placeholder="Enter your current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords((prev) => ({
                                            ...prev,
                                            current: !prev.current,
                                        }))}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                    >
                                        {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold pr-14 disabled:opacity-60"
                                        placeholder="Enter a new password (min 6 characters)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords((prev) => ({
                                            ...prev,
                                            new: !prev.new,
                                        }))}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                    >
                                        {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="w-full px-5 py-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold pr-14 disabled:opacity-60"
                                        placeholder="Confirm your new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords((prev) => ({
                                            ...prev,
                                            confirm: !prev.confirm,
                                        }))}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                    >
                                        {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                                className="w-full inline-flex items-center justify-center gap-2 px-6 py-5 bg-primary-600 text-white rounded-[2rem] font-black text-lg hover:bg-primary-700 transition disabled:opacity-60 disabled:cursor-not-allowed mt-8"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Updating Password...</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock size={20} />
                                        <span>Reset Password</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                            <h3 className="font-black text-gray-900 mb-4">Password Guidelines</h3>
                            <ul className="space-y-2 text-sm text-gray-600 font-medium">
                                <li>✓ Use at least 6 characters</li>
                                <li>✓ Mix uppercase and lowercase letters</li>
                                <li>✓ Include numbers and special characters</li>
                                <li>✓ Avoid using your name or email</li>
                            </ul>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default PasswordReset;
