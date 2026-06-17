import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import {
    Users,
    Search,
    ChevronRight,
    Loader2,
    Calendar,
    Mail,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const TeacherStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newStudent, setNewStudent] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '123456'
    });

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/admin/users/invite', {
                ...newStudent,
                role: 'STUDENT',
                teacherId: JSON.parse(localStorage.getItem('user')).id
            });
            setShowAddModal(false);
            setNewStudent({ firstName: '', lastName: '', email: '', password: '123456' });
            // Refresh list
            const res = await api.get('/analytics/teacher');
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
            console.error("Error adding student:", error);
            alert(error.response?.data?.error || "Failed to add student");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get('/analytics/teacher');
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

                    <div className="flex space-x-4 items-center">
                        <div className="relative w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Find student by name..."
                                className="w-full pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition shadow-sm font-medium"
                            />
                        </div>
                        <button onClick={() => window.location.href = '/teacher/bulk-import'} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition shadow-sm">
                            Bulk Import
                        </button>
                        <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-500/30 flex items-center space-x-2">
                            <Users size={18} />
                            <span>Add Student</span>
                        </button>
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

            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                            onClick={() => setShowAddModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10"
                        >
                            <button 
                                onClick={() => setShowAddModal(false)}
                                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition"
                            >
                                <X size={24} />
                            </button>

                            <h2 className="text-3xl font-black text-gray-900 mb-2">Add Student</h2>
                            <p className="text-gray-500 font-medium mb-8">Invite a single learner to your active roster.</p>

                            <form onSubmit={handleAddStudent} className="space-y-5">
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newStudent.firstName}
                                        onChange={e => setNewStudent({...newStudent, firstName: e.target.value})}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition"
                                        placeholder="Alex"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newStudent.lastName}
                                        onChange={e => setNewStudent({...newStudent, lastName: e.target.value})}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition"
                                        placeholder="Learner"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={newStudent.email}
                                        onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition"
                                        placeholder="alex@nec.edu.in"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Default Password</label>
                                    <input
                                        type="text"
                                        required
                                        value={newStudent.password}
                                        onChange={e => setNewStudent({...newStudent, password: e.target.value})}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition"
                                        placeholder="123456"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full mt-4 flex items-center justify-center space-x-2 py-4 bg-primary-600 text-white rounded-2xl font-black text-lg hover:bg-primary-700 transition disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={24} /> : <span>Add to Roster</span>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeacherStudents;
