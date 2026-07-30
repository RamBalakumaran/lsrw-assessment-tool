import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import { Loader2, Activity, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PerformanceComparison = () => {
    let role = 'STUDENT';
    let currentUserId = null;
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const userObj = JSON.parse(userStr);
            role = userObj.role || 'STUDENT';
            currentUserId = userObj.id;
        }
    } catch(e) {}
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);

    // Data for dropdowns
    const [availableTasks, setAvailableTasks] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    
    // UI selections
    const [mode, setMode] = useState('overall');
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Date Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                if (role === 'STUDENT') {
                    const res = await api.get('/attempts/my-attempts');
                    const uniqueTasks = [];
                    const map = new Map();
                    for (const attempt of res.data) {
                        if (attempt.task && !map.has(attempt.taskId)) {
                            map.set(attempt.taskId, true);
                            uniqueTasks.push(attempt.task);
                        }
                    }
                    setAvailableTasks(uniqueTasks);
                } else {
                    const resUsers = await api.get('/users');
                    setAvailableUsers(resUsers.data || []);
                    try {
                        const resTasks = await api.get('/tasks/global'); 
                        setAvailableTasks(resTasks.data || []);
                    } catch (e) {
                        // fallback if global tasks route isn't available
                        console.warn("Could not fetch global tasks", e);
                    }
                }
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDropdownData();
    }, [role]);

    const handleCompare = async () => {
        if (mode !== 'overall' && selectedIds.length === 0) return;
        setLoading(true);
        try {
            const res = await api.get('/analytics/compare', {
                params: {
                    mode,
                    ids: selectedIds.join(','),
                    contextId: role === 'STUDENT' ? currentUserId : undefined,
                    role,
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined
                }
            });
            setChartData(res.data);
        } catch (error) {
            console.error("Failed to compare", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mode === 'overall') {
            handleCompare();
        }
    }, [mode]);

    const handleDownloadGraph = () => {
        const svgElement = document.querySelector('.recharts-wrapper svg');
        if (!svgElement) return;
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "performance_graph.svg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading && availableTasks.length === 0 && availableUsers.length === 0) {
        return (
            <div className="flex bg-gray-50 min-h-screen">
                <Sidebar role={role} />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary-500" size={48} />
                </main>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role={role} />
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                <header className="mb-10">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center">
                        <Activity className="mr-4 text-primary-500" size={40} />
                        Performance Comparison
                    </h1>
                    <p className="text-gray-500 font-medium mt-2">Analyze and contrast performance metrics</p>
                </header>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {role !== 'STUDENT' ? (
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Comparison Mode</label>
                                <select 
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-700 focus:ring-2 focus:ring-primary-500 transition cursor-pointer appearance-none"
                                    value={mode}
                                    onChange={(e) => {
                                        setMode(e.target.value);
                                        setSelectedIds([]);
                                        setChartData([]);
                                    }}
                                >
                                    <option value="overall">Overall Performance (All Modules)</option>
                                    {role === 'TEACHER' && <option value="teacher-students">Compare Specific Students</option>}
                                    {role === 'TEACHER' && <option value="student-tasks">Compare Tasks</option>}
                                    {role === 'ADMIN' && <option value="admin-teachers">Compare Active Teachers</option>}
                                    {role === 'ADMIN' && <option value="teacher-students">Compare Students</option>}
                                    {role === 'ADMIN' && <option value="student-tasks">Compare Tasks</option>}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Comparison Mode</label>
                                <select 
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-700 focus:ring-2 focus:ring-primary-500 transition cursor-pointer appearance-none"
                                    value={mode}
                                    onChange={(e) => {
                                        setMode(e.target.value);
                                        setSelectedIds([]);
                                        setChartData([]);
                                    }}
                                >
                                    <option value="overall">Overall Performance (All Modules)</option>
                                    <option value="student-tasks">Compare Specific Tasks</option>
                                </select>
                            </div>
                        )}

                        {mode !== 'overall' && (
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                                    {mode === 'student-tasks' ? 'Select Tasks to Compare' : 'Select Users to Compare'}
                                </label>

                            {/* Empty States */}
                            {mode === 'student-tasks' && availableTasks.length === 0 && (
                                <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <p className="text-gray-500 font-medium">No tasks available to compare yet.</p>
                                </div>
                            )}

                            {(mode === 'teacher-students' || mode === 'admin-teachers') && availableUsers.length === 0 && (
                                <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <p className="text-gray-500 font-medium">No users found for comparison.</p>
                                </div>
                            )}

                            {/* Options Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {mode === 'student-tasks' && availableTasks.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => {
                                            if (selectedIds.includes(t.id)) {
                                                setSelectedIds(selectedIds.filter(id => id !== t.id));
                                            } else {
                                                setSelectedIds([...selectedIds, t.id]);
                                            }
                                        }}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${selectedIds.includes(t.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <span className={`font-bold text-sm ${selectedIds.includes(t.id) ? 'text-primary-700' : 'text-gray-700'}`}>{t.title}</span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedIds.includes(t.id) ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
                                            {selectedIds.includes(t.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                        </div>
                                    </button>
                                ))}

                                {(mode === 'teacher-students' || mode === 'admin-teachers') && availableUsers.filter(u => mode === 'admin-teachers' ? u.role === 'TEACHER' : u.role === 'STUDENT').map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => {
                                            if (selectedIds.includes(u.id)) {
                                                setSelectedIds(selectedIds.filter(id => id !== u.id));
                                            } else {
                                                setSelectedIds([...selectedIds, u.id]);
                                            }
                                        }}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${selectedIds.includes(u.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <div>
                                            <div className={`font-bold text-sm ${selectedIds.includes(u.id) ? 'text-primary-700' : 'text-gray-700'}`}>{u.firstName} {u.lastName}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedIds.includes(u.id) ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
                                            {selectedIds.includes(u.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                    {/* Date Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">From Date</label>
                            <input 
                                type="date" 
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-700 focus:ring-2 focus:ring-primary-500 transition"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">To Date</label>
                            <input 
                                type="date" 
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-700 focus:ring-2 focus:ring-primary-500 transition"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={handleCompare}
                            disabled={(mode !== 'overall' && selectedIds.length === 0) || loading}
                            className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 transition shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:shadow-none flex items-center"
                        >
                            {loading && <Loader2 className="animate-spin mr-2" size={20} />}
                            {loading ? 'Processing Data...' : 'Run Comparison'}
                        </button>
                    </div>
                </div>

                {chartData.length > 0 && (
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 relative">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-gray-900">Comparison Results</h3>
                            <button 
                                onClick={handleDownloadGraph}
                                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition"
                            >
                                <Download size={18} className="mr-2" />
                                Download Graph
                            </button>
                        </div>
                        <div className="h-[400px] w-full bg-white">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} />
                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} />
                                    <Tooltip 
                                        cursor={{ fill: '#F3F4F6' }}
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="score" fill="#6366F1" radius={[8, 8, 0, 0]} name="Average Score (%)" barSize={80} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PerformanceComparison;
