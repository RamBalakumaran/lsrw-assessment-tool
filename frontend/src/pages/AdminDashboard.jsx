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
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

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
        return [
            { label: 'Students', value: stats?.totalStudents || 0, icon: <Users />, color: 'sky' },
            { label: 'Teachers', value: stats?.totalTeachers || 0, icon: <AlertTriangle />, color: 'emerald' },
            { label: 'Groups', value: stats?.totalGroups || 0, icon: <TrendingUp />, color: 'slate' },
            { label: 'Curated Tasks', value: stats?.totalTasks || 0, icon: <BookOpen />, color: 'amber' },
            { label: 'Total Assessments', value: stats?.totalAttempts || 0, icon: <CheckCircle2 />, color: 'rose' },
        ];
    }, [stats]);

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

            <main className="flex-1 p-6 md:p-10 overflow-y-auto min-w-0">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                            Platform Control
                        </h1>
                        <p className="text-gray-500 font-medium">
                            Global analytics for the entire learning program.
                        </p>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 shadow-sm">
                            <Globe size={18} />
                            <span>Scope: NEC Global</span>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.08 }}
                            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-6"
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${statCardClass[stat.color]}`}>
                                {React.cloneElement(stat.icon, { size: 28 })}
                            </div>
                            <div>
                                <div className="text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
                                <div className="text-2xl font-black text-gray-900 mt-1">{stat.value.toLocaleString()}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="flex bg-white p-2 rounded-[1.8rem] shadow-sm border border-gray-100 space-x-1 shrink-0 mb-10 max-w-2xl">
                    {[
                        { id: 'overview', label: 'Platform Overview' },
                        { id: 'teachers', label: 'Educator Activity' },
                        { id: 'groups', label: 'Group Progress' },
                        { id: 'students', label: 'Top Students' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-2xl font-black text-gray-900 flex items-center space-x-3">
                                    <TrendingUp className="text-primary-500" />
                                    <span>Network Growth</span>
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
                                {(Array.isArray(stats?.skillStats)
                                    ? stats.skillStats
                                    : Object.entries(stats?.skillStats || {}).map(([name, score]) => ({ name, score }))
                                ).map((skill, i) => (
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
                                "Across the platform, Speaking remains the most challenging module this quarter."
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'teachers' && (
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <h3 className="text-2xl font-black text-gray-900 mb-8">Educator Activity & Progress</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                                        <th className="pb-4">Teacher Name</th>
                                        <th className="pb-4">Email</th>
                                        <th className="pb-4 text-center">Managed Groups</th>
                                        <th className="pb-4 text-center">Tasks Created</th>
                                        <th className="pb-4 text-center">Total Student Submissions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {stats?.teacherActivity?.map((teacher) => (
                                        <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 font-bold text-gray-900">{teacher.firstName} {teacher.lastName}</td>
                                            <td className="py-4 font-medium text-gray-500">{teacher.email}</td>
                                            <td className="py-4 font-black text-gray-900 text-center">{teacher.groupsCount}</td>
                                            <td className="py-4 font-black text-indigo-600 text-center">{teacher.tasksCreated}</td>
                                            <td className="py-4 font-black text-emerald-600 text-center">{teacher.studentSubmissions}</td>
                                        </tr>
                                    ))}
                                    {(!stats?.teacherActivity || stats.teacherActivity.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-400 font-medium italic">No educator records found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'groups' && (
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <h3 className="text-2xl font-black text-gray-900 mb-8">Classroom Groups Progress</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                                        <th className="pb-4">Group Name</th>
                                        <th className="pb-4 text-center">Enrolled Students</th>
                                        <th className="pb-4 text-center">Task Submissions</th>
                                        <th className="pb-4">Average Performance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {stats?.groupProgress?.map((group) => (
                                        <tr key={group.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 font-bold text-gray-900">{group.name}</td>
                                            <td className="py-4 font-black text-gray-900 text-center">{group.studentsCount}</td>
                                            <td className="py-4 font-black text-indigo-600 text-center">{group.submissionsCount}</td>
                                            <td className="py-4 pr-4">
                                                <div className="flex items-center space-x-3 max-w-xs">
                                                    <span className="text-sm font-black text-primary-600 w-10 shrink-0">{group.averageScore}%</span>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                                        <div style={{ width: `${group.averageScore}%` }} className="h-full bg-primary-500 rounded-full shadow-sm" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!stats?.groupProgress || stats.groupProgress.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-gray-400 font-medium italic">No group records found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <h3 className="text-2xl font-black text-gray-900 mb-8">Top Active Students</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                                        <th className="pb-4">Student Name</th>
                                        <th className="pb-4">Email</th>
                                        <th className="pb-4 text-center">Tasks Completed</th>
                                        <th className="pb-4">Average Evaluation Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {stats?.topActiveStudents?.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 font-bold text-gray-900">{student.firstName} {student.lastName}</td>
                                            <td className="py-4 font-medium text-gray-500">{student.email}</td>
                                            <td className="py-4 font-black text-indigo-600 text-center">{student.submissionsCount}</td>
                                            <td className="py-4 pr-4">
                                                <div className="flex items-center space-x-3 max-w-xs">
                                                    <span className="text-sm font-black text-emerald-600 w-10 shrink-0">{student.averageScore}%</span>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                                        <div style={{ width: `${student.averageScore}%` }} className="h-full bg-emerald-500 rounded-full shadow-sm" />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!stats?.topActiveStudents || stats.topActiveStudents.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-gray-400 font-medium italic">No student submissions found yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
