import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { X, Target, Award, BarChart, Loader2, Calendar, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const renderFeedback = (feedback) => {
    if (!feedback) return null;
    
    // Try to parse feedback as JSON
    let data;
    try {
        data = JSON.parse(feedback);
    } catch (e) {
        // If it's not JSON, render it as plain text
        return (
            <p className="text-xs text-slate-500 italic mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-md leading-relaxed">
                "{feedback}"
            </p>
        );
    }

    // Case 1: Error JSON
    if (data.error) {
        return (
            <div className="mt-2 bg-rose-50 border border-rose-100 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl max-w-md font-semibold flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>{data.error}</span>
            </div>
        );
    }

    // Case 2: Speaking evaluation JSON
    if (data.overall_score !== undefined || data.transcription !== undefined) {
        const metrics = data.metrics || {};
        return (
            <div className="mt-2 bg-slate-50/50 border border-slate-100 p-3 rounded-xl max-w-md space-y-2">
                {data.transcription && (
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Transcription</span>
                        <p className="text-xs text-slate-700 font-medium italic bg-white p-2 rounded-lg border border-slate-100 leading-relaxed">
                            "{data.transcription}"
                        </p>
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {metrics.pronunciation !== undefined && (
                        <div className="bg-white p-1.5 rounded-lg border border-slate-100 flex justify-between items-center">
                            <span className="text-slate-400 font-bold text-[9px] uppercase">Pronunciation</span>
                            <span className="font-extrabold text-slate-800">{metrics.pronunciation}/10</span>
                        </div>
                    )}
                    {metrics.fluency !== undefined && (
                        <div className="bg-white p-1.5 rounded-lg border border-slate-100 flex justify-between items-center">
                            <span className="text-slate-400 font-bold text-[9px] uppercase">Fluency</span>
                            <span className="font-extrabold text-slate-800">{metrics.fluency}/10</span>
                        </div>
                    )}
                    {metrics.vocabulary !== undefined && (
                        <div className="bg-white p-1.5 rounded-lg border border-slate-100 flex justify-between items-center">
                            <span className="text-slate-400 font-bold text-[9px] uppercase">Vocabulary</span>
                            <span className="font-extrabold text-slate-800">{metrics.vocabulary}/10</span>
                        </div>
                    )}
                    {metrics.grammar !== undefined && (
                        <div className="bg-white p-1.5 rounded-lg border border-slate-100 flex justify-between items-center">
                            <span className="text-slate-400 font-bold text-[9px] uppercase">Grammar</span>
                            <span className="font-extrabold text-slate-800">{metrics.grammar}/10</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-1.5 text-[9px] text-slate-500 font-bold">
                    {data.wpm !== undefined && (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">WPM: {data.wpm}</span>
                    )}
                    {metrics.pause_count !== undefined && (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">Pauses: {metrics.pause_count}</span>
                    )}
                    {metrics.filler_count !== undefined && (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">Fillers: {metrics.filler_count}</span>
                    )}
                </div>
            </div>
        );
    }

    // Case 3: Writing evaluation JSON
    if (data.criteria !== undefined) {
        const criteria = data.criteria || {};
        return (
            <div className="mt-2 bg-slate-50/50 border border-slate-100 p-3 rounded-xl max-w-md space-y-2">
                {data.structure_feedback && (
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">AI Feedback</span>
                        <p className="text-xs text-slate-700 font-medium bg-white p-2 rounded-lg border border-slate-100 leading-relaxed">
                            {data.structure_feedback}
                        </p>
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {Object.entries(criteria).map(([key, val]) => (
                        <div key={key} className="bg-white p-1.5 rounded-lg border border-slate-100 flex justify-between items-center">
                            <span className="text-slate-400 font-bold text-[9px] uppercase truncate mr-2" title={key}>{key}</span>
                            <span className="font-extrabold text-slate-800 shrink-0">{val}%</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Default fallback
    return (
        <p className="text-xs text-slate-500 italic mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-md leading-relaxed">
            "{feedback}"
        </p>
    );
};

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
                                                {renderFeedback(act.feedback)}
                                                {act.recordingUrl && (
                                                    <div className="mt-3">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Audio Recording</span>
                                                        <audio controls src={process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL.replace('/api', '')}${act.recordingUrl}` : `http://localhost:5000${act.recordingUrl}`} className="h-8 max-w-sm" />
                                                    </div>
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
