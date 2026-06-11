import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, ArrowLeft, Building, Loader2, AlertCircle, ShieldCheck, GraduationCap, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        organizationId: '',
        role: 'STUDENT',
        department: '',
        teacherEmail: '',
        groupMemberships: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/register', formData);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Check your data and network.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
            <Link to="/" className="absolute top-10 left-10 flex items-center text-gray-400 hover:text-primary-600 transition font-black text-xs uppercase tracking-widest">
                <ArrowLeft className="mr-2 h-4 w-4" /> Exit
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 p-12 border border-gray-100 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full -mr-24 -mt-24 blur-3xl opacity-50"></div>

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">Initialize Account</h1>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest leading-none">Access the FluentPro ecosystem</p>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-10 p-5 bg-rose-50 text-rose-600 rounded-[1.5rem] border border-rose-100 flex items-start space-x-3 text-sm font-black"
                        >
                            <AlertCircle size={20} className="flex-shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Primary Name</label>
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all font-bold"
                                    placeholder="Jane"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Surname</label>
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all font-bold"
                                    placeholder="Smith"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Institution Token</label>
                            <div className="relative group">
                                <Building className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    name="organizationId"
                                    value={formData.organizationId}
                                    onChange={handleChange}
                                    className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all font-bold"
                                    placeholder="ORG-XXXXX"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Account Type</label>
                            <div className="relative group">
                                <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full pl-14 pr-10 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all font-black uppercase text-xs tracking-widest appearance-none cursor-pointer"
                                >
                                    <option value="STUDENT">Academic Learner</option>
                                    <option value="TEACHER">Instructional Lead</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Department</label>
                        <div className="relative group">
                            <GraduationCap className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                            <input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all font-bold"
                                placeholder="Computer Science"
                            />
                        </div>
                    </div>

                    {formData.role === 'STUDENT' && (
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Assigned Teacher Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                                    <input
                                        type="email"
                                        name="teacherEmail"
                                        value={formData.teacherEmail}
                                        onChange={handleChange}
                                        className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all font-bold"
                                        placeholder="teacher@institution.edu"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Groups</label>
                                <div className="relative group">
                                    <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        name="groupMemberships"
                                        value={formData.groupMemberships}
                                        onChange={handleChange}
                                        className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all font-bold"
                                        placeholder="Section A, Debate Club"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Official Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all font-bold"
                                placeholder="name@institution.edu"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Access Key</label>
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={20} />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:bg-white transition-all font-bold"
                                placeholder="Create security pin"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center py-6 bg-gray-900 text-white rounded-[1.5rem] font-black text-xl hover:bg-black transition transform active:scale-[0.98] shadow-2xl shadow-gray-900/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={28} />
                        ) : (
                            <span className="flex items-center">
                                Request Portal Access <UserPlus className="ml-4" size={24} />
                            </span>
                        )}
                    </button>
                </form>

                <div className="text-center mt-12 bg-gray-50 p-8 rounded-[2.5rem] border border-gray-50">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Already Registered? <Link to="/login" className="text-primary-600 font-black hover:underline ml-2">Secure Login</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
