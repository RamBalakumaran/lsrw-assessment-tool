import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { X, Target, Award, BarChart, Loader2, Calendar, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const StudentPerformanceModal = ({ studentId, onClose }) => {
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPerformance = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/users/${studentId}/performance`);
                setPerformance(response.data);
            } catch (error) {
                alert('Error loading performance details: ' + (error.response?.data?.error || error.message));
                onClose();
            } finally {
                setLoading(false);
            }
        };
        fetchPerformance();
    }, [studentId, onClose]);

    if (loading) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm">
                <div className="bg-white rounded-[2rem] p-10 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-primary-600 mb-4" size={40} />
                    <span className="font-bold text-gray-600">Loading performance data...</span>
                </div>
            </div>
        );
    }

    if (!performance) return null;

    const { student, stats, activities } = performance;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
                onClick={onClose} 
            />

            {/* Modal Box */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 20 }} 
                className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl p-10 max-h-[90vh] overflow-y-auto font-sans"
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Profile Header */}
                <div className="mb-8 pb-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 leading-tight">
                            {student.firstName} {student.lastName}
                        </h2>
                        <p className="text-gray-500 font-medium mt-1">
                            {student.email} {student.registrationNumber ? ` • Reg No: ${student.registrationNumber}` : ''}
                        </p>
                    </div>
                    <span className="px-4 py-2 bg-primary-50 text-primary-700 rounded-xl text-xs font-black uppercase tracking-wider">
                        Student Report
                    </span>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                        { label: "Overall Average", val: `${stats.avg}%`, icon: <Target />, color: "primary" },
                        { label: "Peak Score", val: `${stats.peak}%`, icon: <Award />, color: "emerald" },
                        { label: "Sessions Attempted", val: stats.totalAttempts, icon: <BarChart />, color: "indigo" },
                    ].map((card, i) => (
                        <div key={i} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                                card.color === 'primary' ? 'bg-primary-50 text-primary-600' :
                                card.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                            }`}>
                                {card.icon}
                            </div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{card.label}</div>
                            <div className="text-2xl font-black text-gray-900">{card.val}</div>
                        </div>
                    ))}
                </div>

                {/* Split layout: LSRW bars and tasks */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Proficiency Bars */}
                    <div className="lg:col-span-4 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 h-fit space-y-6">
                        <h3 className="text-lg font-black text-gray-900 mb-4">LSRW Proficiency</h3>
                        {(stats.skillProficiency || []).map((skill, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">{skill.skill}</span>
                                    <span className="text-sm font-black text-gray-900">{skill.val}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                                    <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: `${skill.val}%` }} 
                                        className={`h-full rounded-full ${
                                            skill.color === 'rose' ? 'bg-rose-500' :
                                            skill.color === 'emerald' ? 'bg-emerald-500' :
                                            skill.color === 'amber' ? 'bg-amber-500' : 'bg-indigo-500'
                                        }`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Task Activities list */}
                    <div className="lg:col-span-8 space-y-4">
                        <h3 className="text-lg font-black text-gray-900">Task Performance Log</h3>
                        <div className="border border-gray-100 rounded-[2rem] bg-gray-50/50 overflow-hidden">
                            <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-100">
                                {activities.map((act, i) => (
                                    <div key={i} className="p-5 bg-white hover:bg-gray-50/50 transition-all flex flex-col md:flex-row justify-between md:items-center gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 leading-tight">{act.taskTitle}</h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mt-1">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider text-gray-500">
                                                        {act.lsrwComponent}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} /> {new Date(act.submittedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {act.feedback && (
                                                    <p className="text-xs text-gray-500 italic mt-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100 max-w-md">
                                                        "{act.feedback}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 self-end md:self-auto">
                                            <span className="text-xs text-gray-400 font-bold uppercase">Score</span>
                                            <div className={`px-4 py-2 rounded-xl text-lg font-black ${
                                                act.score >= 75 ? 'bg-emerald-50 text-emerald-700' :
                                                act.score >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                                            }`}>
                                                {act.score}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {activities.length === 0 && (
                                    <div className="p-12 text-center text-gray-400 font-bold">
                                        No tasks submitted by this student yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default StudentPerformanceModal;
