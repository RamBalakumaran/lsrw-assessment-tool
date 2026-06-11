import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import {
    Users,
    Search,
    ChevronRight,
    Loader2,
    Calendar,
    Mail
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';

const TeacherStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get('/dashboard/teacher');
                const mapped = res.data.students.map(s => {
                    const avg = s.progressSummary ? Math.round((s.progressSummary.listeningAvg + s.progressSummary.speakingAvg + s.progressSummary.readingAvg + s.progressSummary.writingAvg) / 4) : 0;
                    return {
                        id: s.id,
                        name: `${s.firstName || 'Student'} ${s.lastName || ''}`,
                        email: s.email,
                        score: avg,
                        status: avg > 80 ? "EXCELS" : avg > 60 ? "STABLE" : "NEEDS FOCUS"
                    };
                });
                setStudents(mapped);
            } catch (error) {
                console.error("Teacher student fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
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
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar role="TEACHER" />

            <main className="flex-1 p-10 overflow-y-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Active Roster</h1>
                        <p className="text-gray-500 font-medium">Tracking performance for {students.length} assigned learners</p>
                    </div>

                    <div className="relative w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Find student by name..."
                            className="w-full pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition shadow-sm font-medium"
                        />
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.map((student) => (
                        <motion.div
                            key={student.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all relative group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 font-black flex items-center justify-center text-xl shadow-inner">
                                    {student.name[0]}
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${student.status === 'EXCELS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        student.status === 'NEEDS FOCUS' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                    {student.status}
                                </span>
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 mb-1">{student.name}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-400 font-medium mb-8">
                                <Mail size={14} />
                                <span>{student.email}</span>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Proficiency</div>
                                    <div className="text-3xl font-black text-gray-900">{student.score}%</div>
                                </div>
                                <button className="p-3 bg-gray-50 text-gray-400 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition shadow-sm">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default TeacherStudents;
