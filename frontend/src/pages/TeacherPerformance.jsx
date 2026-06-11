import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import {
    BarChart,
    TrendingUp,
    Target,
    Award,
    Loader2,
    ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';

const TeacherPerformance = () => {
    const [stats, setStats] = useState({ avg: 72, peak: 94, totalAttempts: 156 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => setLoading(false), 800);
    }, []);

    if (loading) return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role="TEACHER" />
            <main className="flex-1 p-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary-500" size={48} />
            </main>
        </div>
    );

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role="TEACHER" />

            <main className="flex-1 p-10 overflow-y-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Analytics Hub</h1>
                    <p className="text-gray-500 font-medium">Deep insights into classroom LSRW proficiency</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {[
                        { label: "Class Average", val: `${stats.avg}%`, icon: <Target />, color: "primary" },
                        { label: "Peak Indiv. Score", val: `${stats.peak}%`, icon: <Award />, color: "emerald" },
                        { label: "Total Sessions", val: stats.totalAttempts, icon: <BarChart />, color: "indigo" },
                    ].map((m, i) => (
                        <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${m.color}-50 text-${m.color}-600 mb-8`}>
                                {m.icon}
                            </div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{m.label}</div>
                            <div className="text-4xl font-black text-gray-900">{m.val}</div>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="bg-black p-12 rounded-[3.5rem] text-white overflow-hidden relative">
                        <div className="relative z-10">
                            <div className="flex items-center space-x-2 text-primary-400 font-black text-[10px] uppercase tracking-widest mb-6">
                                <TrendingUp size={14} />
                                <span>Performance Trend</span>
                            </div>
                            <h2 className="text-4xl font-black mb-4 tracking-tighter">Velocity Increasing</h2>
                            <p className="text-gray-400 text-lg font-medium opacity-80 mb-10">
                                Collective class fluency has improved by 14% since the last reporting period.
                            </p>
                            <button className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black transition hover:bg-primary-700 flex items-center space-x-2">
                                <span>Export Analysis</span>
                                <ArrowUpRight size={18} />
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary-600 rounded-full blur-[120px] opacity-20"></div>
                    </div>

                    <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm">
                        <h3 className="text-2xl font-black text-gray-900 mb-8">Weakness Correlation</h3>
                        <div className="space-y-8">
                            {[
                                { skill: "Grammar Coherence", val: 45, color: "rose" },
                                { skill: "Phonetic Fluency", val: 82, color: "emerald" },
                                { skill: "Lexical Variety", val: 68, color: "amber" }
                            ].map((s, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="font-bold text-gray-700 text-sm uppercase tracking-widest">{s.skill}</span>
                                        <span className="text-xl font-black text-gray-900">{s.val}%</span>
                                    </div>
                                    <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${s.val}%` }}
                                            className={`h-full bg-${s.color}-500 rounded-full shadow-sm`}
                                        ></motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TeacherPerformance;
