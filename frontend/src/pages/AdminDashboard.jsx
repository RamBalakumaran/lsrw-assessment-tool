import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import {
    AlertTriangle,
    BookOpen,
    Building2,
    CheckCircle2,
    Globe,
    Plus,
    TrendingUp,
    Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { Loader2 } from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';

const readStoredUser = () => {
    try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
        return null;
    }
};

const statCardClass = {
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-700',
};

const AdminDashboard = () => {
    const currentUser = readStoredUser();
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/admin');
                setStats(res.data);
            } catch (error) {
                console.error('Admin Dashboard error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const navigateToCreate = () => {
        window.location.href = '/admin/tasks';
    };

    const statCards = useMemo(() => {
        const baseCards = [
            { label: 'Students', value: stats?.totalStudents || 0, icon: <Users />, color: 'sky' },
            { label: 'Teachers', value: stats?.totalTeachers || 0, icon: <AlertTriangle />, color: 'emerald' },
            { label: 'Curated Tasks', value: stats?.totalTasks || 0, icon: <BookOpen />, color: 'amber' },
            { label: 'Total Assessments', value: stats?.totalAttempts || 0, icon: <CheckCircle2 />, color: 'rose' },
        ];

        if (!isSuperAdmin) {
            return baseCards;
        }

        return [
            { label: 'Organizations', value: stats?.totalOrganizations || 0, icon: <Building2 />, color: 'slate' },
            ...baseCards,
        ];
    }, [isSuperAdmin, stats]);

    if (loading) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar role={currentUser?.role || 'ADMIN'} />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary-500" size={48} />
                </main>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role={currentUser?.role || 'ADMIN'} />

            <main className="flex-1 p-10 overflow-y-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                            {isSuperAdmin ? 'Platform Control' : 'Organization Control'}
                        </h1>
                        <p className="text-gray-500 font-medium">
                            {isSuperAdmin
                                ? 'Global analytics for every organization, department, and learning program.'
                                : 'Live performance and task oversight for your organization.'}
                        </p>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 shadow-sm">
                            <Globe size={18} />
                            <span>{isSuperAdmin ? 'Scope: All Organizations' : 'Scope: My Organization'}</span>
                        </div>
                        <button
                            onClick={navigateToCreate}
                            className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-500/30"
                        >
                            <Plus size={18} />
                            <span>Create New Task</span>
                        </button>
                    </div>
                </header>

                <div className={`grid grid-cols-1 md:grid-cols-2 ${isSuperAdmin ? 'xl:grid-cols-5' : 'xl:grid-cols-4'} gap-6 mb-10`}>
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.08 }}
                            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-6"
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${statCardClass[stat.color]}`}>
                                {React.cloneElement(stat.icon, { size: 28 })}
                            </div>
                            <div>
                                <div className="text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
                                <div className="text-2xl font-black text-gray-900 mt-1">{stat.value.toLocaleString()}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black text-gray-900 flex items-center space-x-3">
                                <TrendingUp className="text-primary-500" />
                                <span>{isSuperAdmin ? 'Network Growth' : 'Student Growth'}</span>
                            </h3>
                            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 font-bold text-xs uppercase text-gray-500">
                                Current Year
                            </div>
                        </div>
                        <div>
                            <ResponsiveContainer width="100%" aspect={2.5}>
                                <AreaChart data={stats?.growthData || []}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontWeight: 'bold', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontWeight: 'bold', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="users" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <h3 className="text-2xl font-black text-gray-900 mb-8">Skill Proficiency</h3>
                        <div className="space-y-8">
                            {(stats?.skillStats || []).map((skill, i) => (
                                <div key={`${skill.name}-${i}`}>
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="font-black text-gray-700 text-sm uppercase tracking-wider">{skill.name}</span>
                                        <span className="text-xl font-black text-primary-600">{skill.score}%</span>
                                    </div>
                                    <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${skill.score}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className="h-full bg-primary-500 rounded-full shadow-sm"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 p-6 bg-primary-50 rounded-3xl border border-primary-100 italic text-sm text-primary-700 font-medium">
                            {isSuperAdmin
                                ? '"Across the platform, Speaking remains the most challenging module this quarter."'
                                : '"Within this organization, Speaking remains the most challenging module this quarter."'}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
