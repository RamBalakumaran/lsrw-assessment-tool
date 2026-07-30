import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import {
    History,
    Calendar,
    ChevronRight,
    Download,
    Trophy,
    Target,
    Search,
    Filter,
    ArrowUpDown,
    X
} from 'lucide-react';
import { motion } from 'framer-motion';

const renderNestedValue = (val) => {
    if (Array.isArray(val)) {
        if (val.length === 0) return <span className="text-gray-400 italic">None</span>;
        if (typeof val[0] === 'string') {
            return (
                <ul className="list-disc pl-5 space-y-2 mt-2 mb-2">
                    {val.map((item, idx) => (
                        <li key={idx} className="text-gray-700">{item}</li>
                    ))}
                </ul>
            );
        }
        return (
            <div className="space-y-3 mt-3">
                {val.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col space-y-2">
                        {Object.entries(item).map(([k, v]) => (
                            <div key={k} className="flex justify-between items-center text-sm">
                                <span className="font-bold text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span className="font-medium text-gray-900 line-clamp-2" title={String(v)}>{String(v)}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    } else if (typeof val === 'object' && val !== null) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {Object.entries(val).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <span className="font-bold text-gray-500 text-xs capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="font-black text-primary-600 line-clamp-1" title={String(v)}>{String(v)}</span>
                    </div>
                ))}
            </div>
        );
    }
    return <span className="font-medium text-gray-800 break-words block mt-1">{String(val)}</span>;
};

const StudentHistory = () => {
    const [attempts, setAttempts] = useState([]);
    const [stats, setStats] = useState({ peak: 0, peakTask: "No attempts yet", total: 0, average: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedAttempt, setSelectedAttempt] = useState(null);

    // Filter and Sort states
    const [searchTerm, setSearchTerm] = useState('');
    const [domainFilter, setDomainFilter] = useState('ALL');
    const [resultCondition, setResultCondition] = useState('ALL'); // ALL, GREATER, LESS, EQUAL
    const [resultValue, setResultValue] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortField, setSortField] = useState('date'); // module, domain, result, date
    const [sortDirection, setSortDirection] = useState('desc'); // asc, desc

    const filteredAndSortedAttempts = useMemo(() => {
        let result = [...attempts];

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(a => (a.task?.title || "Speaking Session").toLowerCase().includes(lowerSearch));
        }

        if (domainFilter !== 'ALL') {
            result = result.filter(a => (a.task?.type || "SPEAKING").toUpperCase() === domainFilter);
        }

        if (resultCondition !== 'ALL' && resultValue !== '') {
            const val = parseFloat(resultValue);
            if (!isNaN(val)) {
                result = result.filter(a => {
                    const score = Math.round(a.score || 0);
                    if (resultCondition === 'GREATER') return score > val;
                    if (resultCondition === 'GREATER_EQUAL') return score >= val;
                    if (resultCondition === 'LESS') return score < val;
                    if (resultCondition === 'LESS_EQUAL') return score <= val;
                    if (resultCondition === 'EQUAL') return score === val;
                    return true;
                });
            }
        }

        if (dateFrom) {
            const from = new Date(dateFrom).getTime();
            result = result.filter(a => new Date(a.submittedAt).getTime() >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo).getTime();
            result = result.filter(a => new Date(a.submittedAt).getTime() <= to + 86400000);
        }

        result.sort((a, b) => {
            let valA, valB;
            switch (sortField) {
                case 'module':
                    valA = (a.task?.title || "Speaking Session").toLowerCase();
                    valB = (b.task?.title || "Speaking Session").toLowerCase();
                    break;
                case 'domain':
                    valA = (a.task?.type || "SPEAKING").toLowerCase();
                    valB = (b.task?.type || "SPEAKING").toLowerCase();
                    break;
                case 'result':
                    valA = Math.round(a.score || 0);
                    valB = Math.round(b.score || 0);
                    break;
                case 'date':
                default:
                    valA = new Date(a.submittedAt).getTime();
                    valB = new Date(b.submittedAt).getTime();
                    break;
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [attempts, searchTerm, domainFilter, resultCondition, resultValue, dateFrom, dateTo, sortField, sortDirection]);

    const handleExport = () => {
        if (!filteredAndSortedAttempts.length) return;
        const headers = ["Task Title", "Module Type", "Score", "Date", "Status"];
        const csvContent = [
            headers.join(","),
            ...filteredAndSortedAttempts.map(a => [
                `"${a.task?.title || 'Practice Session'}"`,
                a.task?.type || 'SPEAKING',
                Math.round(a.score || 0),
                new Date(a.submittedAt).toLocaleDateString(),
                a.status || 'COMPLETED'
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `performance_history_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        const fetchAttempts = async () => {
            try {
                const res = await api.get('/attempts/my-attempts');
                const data = res.data;
                setAttempts(data);

                if (data.length > 0) {
                    const scores = data.map(a => a.score).filter(s => s !== null);
                    const peakAttempt = data.reduce((prev, current) => (prev.score > current.score) ? prev : current);
                    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

                    setStats({
                        peak: Math.round(peakAttempt.score || 0),
                        peakTask: peakAttempt.task?.title || "Speaking Assessment",
                        total: data.length,
                        average: avg
                    });
                }
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAttempts();
    }, []);

    if (loading) return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role="STUDENT" />
            <main className="flex-1 p-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary-500" size={48} />
            </main>
        </div>
    );

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role="STUDENT" />

            <main className="flex-1 p-6 md:p-10 overflow-y-auto min-w-0">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Performance History</h1>
                        <p className="text-gray-500 font-medium">Review your growth over the last 30 days</p>
                    </div>

                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition shadow-sm active:scale-95"
                    >
                        <Download size={18} />
                        <span>Export Path Report</span>
                    </button>
                </header>

                {/* Highlight Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-gradient-to-br from-indigo-600 to-primary-700 p-10 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl shadow-primary-500/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-2">Peak Performance</div>
                            <div className="text-5xl font-black mb-4 tracking-tighter">{stats.peak}%</div>
                            <p className="text-indigo-100 font-medium">{stats.peakTask}</p>
                        </div>
                        <div className="relative z-10 w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20">
                            <Trophy size={48} className="text-amber-400 fill-current" />
                        </div>
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm flex justify-between items-center relative overflow-hidden">
                        <div>
                            <div className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Total Modules</div>
                            <div className="text-5xl font-black text-gray-900 mb-4 tracking-tighter">{stats.total}</div>
                            <p className="text-emerald-600 font-bold flex items-center">
                                <Target size={18} className="mr-2" />
                                {stats.average}% Skill Average
                            </p>
                        </div>
                        <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center text-primary-500">
                            <History size={48} />
                        </div>
                    </div>
                </div>

                {/* Filters & Sorting */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-gray-900 flex items-center">
                            <Filter className="mr-2 text-primary-500" size={20} />
                            Filter & Sort Options
                        </h3>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setDomainFilter('ALL');
                                setResultCondition('ALL');
                                setResultValue('');
                                setDateFrom('');
                                setDateTo('');
                            }}
                            className="text-sm font-bold text-gray-500 hover:text-rose-500 transition flex items-center"
                        >
                            <X size={16} className="mr-1" /> Clear Filters
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Module Search */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Assessment Module</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search module..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition"
                                />
                            </div>
                        </div>

                        {/* Domain Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Skill Domain</label>
                            <select
                                value={domainFilter}
                                onChange={(e) => setDomainFilter(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition appearance-none cursor-pointer"
                            >
                                <option value="ALL">All Domains</option>
                                <option value="SPEAKING">Speaking</option>
                                <option value="LISTENING">Listening</option>
                                <option value="READING">Reading</option>
                                <option value="WRITING">Writing</option>
                            </select>
                        </div>

                        {/* Result Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Result Filter</label>
                            <div className="flex space-x-2">
                                <select
                                    value={resultCondition}
                                    onChange={(e) => setResultCondition(e.target.value)}
                                    className="w-1/2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition appearance-none cursor-pointer"
                                >
                                    <option value="ALL">Any</option>
                                    <option value="GREATER">{'>'} Than</option>
                                    <option value="GREATER_EQUAL">{'>='} Than</option>
                                    <option value="LESS">{'<'} Than</option>
                                    <option value="LESS_EQUAL">{'<='} Than</option>
                                    <option value="EQUAL">Equal</option>
                                </select>
                                <input
                                    type="number"
                                    value={resultValue}
                                    onChange={(e) => setResultValue(e.target.value)}
                                    placeholder="Score %"
                                    disabled={resultCondition === 'ALL'}
                                    className="w-1/2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* Date Filter */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Date Range</label>
                            <div className="flex space-x-2 items-center">
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none transition text-gray-600"
                                />
                                <span className="text-gray-400 font-bold">-</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none transition text-gray-600"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attempt Table */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="text-2xl font-black text-gray-900">Recent Sessions</h3>
                        <div className="flex space-x-2">
                            <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
                            <span className="w-3 h-3 bg-indigo-200 rounded-full"></span>
                            <span className="w-3 h-3 bg-indigo-100 rounded-full"></span>
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                {
                                    [
                                        { label: 'Assessment Module', field: 'module' },
                                        { label: 'Skill Domain', field: 'domain' },
                                        { label: 'Result', field: 'result' },
                                        { label: 'Date', field: 'date' }
                                    ].map((col) => (
                                        <th 
                                            key={col.field} 
                                            onClick={() => {
                                                if (sortField === col.field) {
                                                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                                } else {
                                                    setSortField(col.field);
                                                    setSortDirection('desc');
                                                }
                                            }}
                                            className="px-10 py-5 text-xs font-black text-gray-400 uppercase tracking-widest leading-none cursor-pointer hover:text-gray-700 transition select-none group"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <span>{col.label}</span>
                                                <ArrowUpDown size={12} className={`transition ${sortField === col.field ? 'text-primary-500 opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
                                            </div>
                                        </th>
                                    ))
                                }
                                <th className="px-10 py-5 text-xs font-black text-gray-400 uppercase tracking-widest leading-none"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredAndSortedAttempts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-10 py-12 text-center text-gray-500 font-medium">
                                        No sessions match your filters.
                                    </td>
                                </tr>
                            ) : filteredAndSortedAttempts.map((attempt, i) => (
                                <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-10 py-6">
                                        <span className="font-bold text-gray-900 text-lg">{attempt.task?.title || "Speaking Session"}</span>
                                        <div className="text-xs text-emerald-500 font-bold mt-1 uppercase tracking-tighter">Verified Result</div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className="inline-flex px-4 py-1.5 rounded-xl bg-gray-50 text-gray-600 font-bold text-xs uppercase tracking-widest border border-gray-100">
                                            {attempt.task?.type || "Speaking"}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 font-black text-2xl text-gray-700">
                                        {Math.round(attempt.score || 0)}%
                                    </td>
                                    <td className="px-10 py-6 text-gray-400 font-medium">
                                        <div className="flex items-center space-x-2">
                                            <Calendar size={14} />
                                            <span>{new Date(attempt.submittedAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <button
                                            onClick={() => setSelectedAttempt(attempt)}
                                            className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-primary-600 hover:text-white transition shadow-sm"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Attempt Details Modal */}
                {selectedAttempt && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900">{selectedAttempt.task?.title || "Practice Session"}</h2>
                                    <p className="text-gray-500 font-medium uppercase tracking-widest text-xs mt-2">{selectedAttempt.task?.type || "SPEAKING"} • {new Date(selectedAttempt.submittedAt).toLocaleDateString()}</p>
                                </div>
                                <button onClick={() => setSelectedAttempt(null)} className="p-3 bg-white text-gray-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition shadow-sm border border-gray-100">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>

                            <div className="p-10 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div className="bg-primary-50 rounded-[2rem] p-8 border border-primary-100">
                                        <div className="text-primary-600 text-xs font-black uppercase tracking-widest mb-2">Final Score</div>
                                        <div className="text-6xl font-black text-primary-900">{Math.round(selectedAttempt.score || 0)}%</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100">
                                        <div className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Status</div>
                                        <div className={`text-4xl font-black pt-2 ${selectedAttempt.status === 'ASSIGNED' ? 'text-amber-500' : 'text-emerald-500'}`}>{selectedAttempt.status || "COMPLETED"}</div>
                                    </div>
                                </div>

                                {selectedAttempt.aiResults && (
                                    <div className="space-y-6 mb-8">
                                        <h4 className="text-xl font-black text-gray-900 flex items-center">
                                            <Target className="mr-2 text-primary-500" size={20} />
                                            AI Evaluation Details
                                        </h4>
                                        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
                                            {typeof selectedAttempt.aiResults === 'string' ? (
                                                <p className="text-gray-600 font-medium leading-relaxed">{selectedAttempt.aiResults}</p>
                                            ) : (
                                                <div className="space-y-6">
                                                    {Object.entries(selectedAttempt.aiResults).map(([key, value]) => (
                                                        <div key={key} className="flex flex-col bg-gray-50 p-6 rounded-[1.5rem] border border-gray-100">
                                                            <span className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                            <div className="w-full">
                                                                {renderNestedValue(value)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedAttempt.recordingUrl && (
                                    <div className="mb-8 space-y-6">
                                        <h4 className="text-xl font-black text-gray-900 flex items-center">
                                            <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"></path></svg>
                                            Audio Recording
                                        </h4>
                                        <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-8 shadow-sm">
                                            <audio controls src={process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL.replace('/api', '')}${selectedAttempt.recordingUrl}` : `http://localhost:5000${selectedAttempt.recordingUrl}`} className="w-full" />
                                        </div>
                                    </div>
                                )}

                                {selectedAttempt.teacherFeedback && (
                                    <div className="mb-8 space-y-6">
                                        <h4 className="text-xl font-black text-gray-900 flex items-center">
                                            <Target className="mr-2 text-primary-500" size={20} />
                                            Teacher Feedback
                                        </h4>
                                        <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8 shadow-sm">
                                            <p className="text-amber-900 font-medium leading-relaxed">
                                                {selectedAttempt.teacherFeedback}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {(!selectedAttempt.aiResults && !selectedAttempt.teacherFeedback) && (
                                    <div className="text-center py-10 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                        <p className="text-gray-400 font-bold uppercase tracking-widest">No detailed feedback available</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudentHistory;
