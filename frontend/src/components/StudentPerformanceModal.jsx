import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { X, Target, Award, BarChart, Loader2, Calendar, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

const renderFeedback = (feedback, act) => {
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
                {data.transcription && (!act || !act.recordingUrl) && (
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

    const handleDownloadReport = () => {
        if (!performance) return;

        const { student, stats, activities } = performance;
        
        const excelData = [];
        
        excelData.push(["NATIONAL ENGINEERING COLLEGE KOVILPATTI , 628 503"]);
        excelData.push([`Student Report: ${student.firstName} ${student.lastName}`]);
        excelData.push([`Email: ${student.email}`, `Registration No: ${student.registrationNumber || 'N/A'}`]);
        excelData.push([`Overall Average: ${stats.avg}%`, `Peak Score: ${stats.peak}%`, `Total Attempts: ${stats.totalAttempts}`]);
        excelData.push([]);
        
        const headers = ["Task Title", "Skill", "Submitted At", "Score", "Feedback / Answer"];
        excelData.push(headers);
        
        activities.forEach(act => {
            let details = '';
            if (act.answer) details += `Answer: ${act.answer}\n`;
            if (act.feedback) {
                try {
                    const f = JSON.parse(act.feedback);
                    if (f.error) details += `Error: ${f.error}\n`;
                    if (f.overall_score) details += `Overall: ${f.overall_score}\n`;
                    if (f.metrics) details += `Metrics: ${JSON.stringify(f.metrics)}\n`;
                    if (f.criteria) details += `Criteria: ${JSON.stringify(f.criteria)}\n`;
                    if (f.structure_feedback) details += `Feedback: ${f.structure_feedback}\n`;
                    if (f.transcription) details += `Transcription: ${f.transcription}\n`;
                } catch(e) {
                    details += `Feedback: ${act.feedback}`;
                }
            }
            if (act.studentAnswers) {
                details += `Responses: ${typeof act.studentAnswers === 'object' ? JSON.stringify(act.studentAnswers) : act.studentAnswers}\n`;
            }
            
            excelData.push([
                act.taskTitle,
                act.lsrwComponent,
                new Date(act.submittedAt).toLocaleDateString(),
                act.score,
                details.trim()
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        const merges = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title 1
            { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Title 2
        ];
        ws['!merges'] = merges;
        
        ws['!cols'] = [
            { wch: 30 }, // Task Title
            { wch: 15 }, // Skill
            { wch: 15 }, // Date
            { wch: 10 }, // Score
            { wch: 60 }  // Details
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Student_Report");
        XLSX.writeFile(wb, `${student.firstName}_${student.lastName}_Report.xlsx`);
    };

    const handleDownloadTaskPDF = (act) => {
        const printWindow = window.open('', '_blank');
        
        let feedbackHTML = '';
        if (act.feedback) {
            try {
                const f = JSON.parse(act.feedback);
                if (f.overall_score !== undefined && f.overall_score !== null && f.overall_score !== '') {
                    feedbackHTML += `<p><strong>Overall Score:</strong> ${f.overall_score}</p>`;
                }
                if (f.transcription) {
                    feedbackHTML += `<p><strong>Transcription:</strong> ${f.transcription}</p>`;
                }
                if (f.metrics && Object.keys(f.metrics).length > 0) {
                    let metricItems = '';
                    for (const [k, v] of Object.entries(f.metrics)) {
                        if (v === null || v === undefined || v === '') continue;
                        let displayLabel = k;
                        let displayValue = v;
                        
                        if (typeof v === 'object') {
                            if (v.label && v.value) {
                                displayLabel = v.label;
                                displayValue = v.value;
                            } else {
                                displayValue = JSON.stringify(v);
                            }
                        }
                        
                        if (displayValue !== '{}' && displayValue !== '[]' && displayValue !== '') {
                            displayLabel = String(displayLabel).replace(/_/g, ' ');
                            metricItems += `
                                <div style="display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #f3f4f6;">
                                    <span style="color: #6b7280; font-weight: 600; text-transform: capitalize;">${displayLabel}</span>
                                    <span style="color: #111827; font-weight: bold;">${displayValue}</span>
                                </div>
                            `;
                        }
                    }
                    if (metricItems) {
                        feedbackHTML += `<h4 style="margin-top: 20px; margin-bottom: 10px; color: #374151;">Metrics</h4>
                                         <div style="border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; overflow: hidden;">${metricItems}</div>`;
                    }
                }
                if (f.structure_feedback) {
                    feedbackHTML += `<p><strong>AI Feedback:</strong> ${f.structure_feedback}</p>`;
                }
                if (f.criteria && Object.keys(f.criteria).length > 0) {
                    let criteriaItems = '';
                    for (const [k, v] of Object.entries(f.criteria)) {
                        if (v === null || v === undefined || v === '') continue;
                        let displayLabel = k;
                        let displayValue = v;
                        
                        if (typeof v === 'object') {
                            if (v.label && v.value) {
                                displayLabel = v.label;
                                displayValue = v.value;
                            } else {
                                displayValue = JSON.stringify(v);
                            }
                        }
                        
                        if (displayValue !== '{}' && displayValue !== '[]' && displayValue !== '') {
                            displayLabel = String(displayLabel).replace(/_/g, ' ');
                            // Do not add '%' if the value already has it
                            const suffix = String(displayValue).includes('%') ? '' : '%';
                            criteriaItems += `
                                <div style="display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #f3f4f6;">
                                    <span style="color: #6b7280; font-weight: 600; text-transform: capitalize;">${displayLabel}</span>
                                    <span style="color: #111827; font-weight: bold;">${displayValue}${suffix}</span>
                                </div>
                            `;
                        }
                    }
                    if (criteriaItems) {
                        feedbackHTML += `<h4 style="margin-top: 20px; margin-bottom: 10px; color: #374151;">Criteria</h4>
                                         <div style="border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; overflow: hidden;">${criteriaItems}</div>`;
                    }
                }
                if (f.error) {
                    feedbackHTML += `<p><strong>Error:</strong> ${f.error}</p>`;
                }
            } catch(e) {
                if (act.feedback) {
                    feedbackHTML += `<p>${act.feedback}</p>`;
                }
            }
        }
        
        let answersHTML = '';
        if (act.answer) {
            answersHTML += `<h4>Typed Answer</h4><p style="white-space: pre-wrap;">${act.answer}</p>`;
        }
        if (act.studentAnswers) {
            let answersStr = '';
            if (typeof act.studentAnswers === 'object') {
                answersStr += `<div style="border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; overflow: hidden; margin-top: 10px;">`;
                for (const [k, v] of Object.entries(act.studentAnswers)) {
                    let displayVal = typeof v === 'object' ? JSON.stringify(v) : v;
                    answersStr += `
                        <div style="display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #f3f4f6;">
                            <span style="color: #6b7280; font-weight: bold; width: 20%;">Q${k}</span>
                            <span style="color: #111827; width: 80%; text-align: right;">${displayVal}</span>
                        </div>
                    `;
                }
                answersStr += `</div>`;
            } else {
                answersStr = `<pre style="background: #f3f4f6; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${act.studentAnswers}</pre>`;
            }
            if (answersStr !== '{}' && answersStr !== '[]' && answersStr !== '') {
                answersHTML += `<h4>Responses</h4>${answersStr}`;
            }
        }

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Task Report - ${act.taskTitle}</title>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; color: #333; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
                        h1 { color: #111; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                        .header-info { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
                        .section { margin-bottom: 30px; }
                        .section h3 { color: #4f46e5; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
                        .score-badge { background: #4f46e5; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold; font-size: 1.2em; display: inline-block; }
                        .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; background: #fff; }
                        pre { background: #f3f4f6; padding: 10px; border-radius: 4px; overflow-x: auto; }
                        .college-name { text-align: center; margin-bottom: 20px; color: #111; font-weight: 900; font-size: 1.5rem; text-transform: uppercase; letter-spacing: 1px; }
                    </style>
                </head>
                <body>
                    <div class="college-name">NATIONAL ENGINEERING COLLEGE , KOVILPATTI - 628 503</div>
                    <h1>Task Performance Report</h1>
                    
                    <div class="header-info">
                        <div>
                            <p><strong>Student:</strong> ${performance.student.firstName} ${performance.student.lastName}</p>
                            <p><strong>Email:</strong> ${performance.student.email}</p>
                            <p><strong>Reg No:</strong> ${performance.student.registrationNumber || 'N/A'}</p>
                        </div>
                        <div>
                            <p><strong>Task:</strong> ${act.taskTitle}</p>
                            <p><strong>Skill:</strong> ${act.lsrwComponent}</p>
                            <p><strong>Date:</strong> ${new Date(act.submittedAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div class="section">
                        <h3>Overall Score</h3>
                        <div class="score-badge">${act.score}%</div>
                    </div>

                    ${answersHTML ? `<div class="section">
                        <h3>Student Submission</h3>
                        <div class="box">${answersHTML}</div>
                    </div>` : ''}

                    ${feedbackHTML ? `<div class="section">
                        <h3>AI Evaluation & Feedback</h3>
                        <div class="box">${feedbackHTML}</div>
                    </div>` : ''}

                    <script>
                        window.onload = function() {
                            window.print();
                        }
                    </script>
                </body>
            </html>
        `;
        
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    };

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
                    <button 
                        onClick={handleDownloadReport}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition"
                    >
                        <Download size={14} /> Download Report
                    </button>
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
                                                {renderFeedback(act.feedback, act)}
                                                {act.recordingUrl && (
                                                    <div className="mt-3">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Audio Recording</span>
                                                        <audio controls src={process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL.replace('/api', '')}${act.recordingUrl}` : `http://localhost:5000${act.recordingUrl}`} className="h-8 max-w-sm" />
                                                    </div>
                                                )}
                                                {act.answer && !act.recordingUrl && (
                                                    <div className="mt-3 bg-white p-3 rounded-xl border border-slate-100 max-w-md">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Typed Answer</span>
                                                        <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap">{act.answer}</p>
                                                    </div>
                                                )}
                                                {act.studentAnswers && (
                                                    <div className="mt-3 bg-white p-3 rounded-xl border border-slate-100 max-w-md space-y-1.5">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">MCQ Responses</span>
                                                        {typeof act.studentAnswers === 'object' ? Object.entries(act.studentAnswers).map(([qId, ans]) => (
                                                            <div key={qId} className="text-[10px] text-slate-600">
                                                                <span className="font-bold">Q{qId}:</span> {typeof ans === 'object' ? JSON.stringify(ans) : ans}
                                                            </div>
                                                        )) : (
                                                            <div className="text-[10px] text-slate-600">
                                                                {JSON.stringify(act.studentAnswers)}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 self-end md:self-auto">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400 font-bold uppercase">Score</span>
                                                <div className={`px-4 py-2 rounded-xl text-lg font-black ${
                                                    act.score >= 75 ? 'bg-emerald-50 text-emerald-700' :
                                                    act.score >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                                                }`}>
                                                    {act.score}%
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleDownloadTaskPDF(act)}
                                                className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:text-gray-900 transition shadow-sm flex items-center justify-center"
                                                title="Download PDF Report"
                                            >
                                                <Download size={16} />
                                            </button>
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
