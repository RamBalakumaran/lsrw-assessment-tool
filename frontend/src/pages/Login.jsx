import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
                    else if (user.role === 'DEPT_ADMIN') navigate('/admin/users', { replace: true });
                    else if (user.role === 'TEACHER') navigate('/teacher/dashboard', { replace: true });
                    else navigate('/dashboard', { replace: true });
                } catch (e) {
                    navigate('/dashboard', { replace: true });
                }
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/login', { email, password });
            const { token, user } = res.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            if (user.organizationId) {
                localStorage.setItem('organizationId', user.organizationId);
            } else {
                localStorage.removeItem('organizationId');
            }

            // Redirect based on role
            if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') navigate('/admin/dashboard');
            else if (user.role === 'DEPT_ADMIN') navigate('/admin/users');
            else if (user.role === 'TEACHER') navigate('/teacher/dashboard');
            else navigate('/dashboard');

        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed. Please verify your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
            <Link to="/" className="absolute top-10 left-10 flex items-center text-gray-400 hover:text-primary-600 transition font-black text-xs uppercase tracking-widest">
                <ArrowLeft className="mr-2 h-4 w-4" /> Exit Portal
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 p-12 border border-gray-100 relative overflow-hidden"
            >
                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>

                <div className="text-center mb-10 relative z-10">
                    <div className="text-4xl font-black gradient-text tracking-tighter mb-2">FluentPro</div>
                    <p className="text-gray-400 font-bold text-sm tracking-tight uppercase">Intelligence Assessment Portal</p>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8 p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-start space-x-3 text-sm font-bold"
                        >
                            <AlertCircle size={18} className="flex-shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Authorized Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all font-bold text-gray-700"
                                placeholder="name@institution.edu"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end px-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Security Pin</label>
                            <a href="#" className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline">Reset Pass</a>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all font-bold text-gray-700"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 px-4 py-2">
                        <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-gray-200 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer" />
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Persist Session</span>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-xl hover:bg-black transition transform active:scale-[0.98] shadow-2xl shadow-gray-900/20 disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : (
                            <span className="flex items-center">
                                Connect to Portal <LogIn className="ml-3" size={22} />
                            </span>
                        )}
                    </button>
                </form>

                <div className="text-center mt-12 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        New Researcher? <Link to="/register" className="text-primary-600 font-black hover:underline ml-2">Request Access</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
