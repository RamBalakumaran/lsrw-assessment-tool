import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
    Calendar,
    MessageSquare,
    ChevronRight,
    Search,
    Filter,
    ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { Loader2 } from 'lucide-react';
import StudentPerformanceModal from '../components/StudentPerformanceModal';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [originalStudents, setOriginalStudents] = useState([]);
    const [stats, setStats] = useState({ studentCount: 0, tasksAssigned: 0, pendingReports: 0, groupsCount: 0, groupActivities: [] });
    const [loading, setLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [availableTasks, setAvailableTasks] = useState([]);
    const [assignLoading, setAssignLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('students'); // 'students' or 'groups'

    useEffect(() => {
        const fetchTeacherData = async () => {
            try {
                const res = await api.get('/dashboard/teacher');
                setStats({
                    studentCount: res.data.studentCount,
                    tasksAssigned: res.data.tasksAssigned,
                    pendingReports: res.data.pendingReports,
                    groupsCount: res.data.groupsCount || 0,
                    groupActivities: (res.data.groupActivities || []).map(g => ({
                        groupId: g.id,
                        groupName: g.name,
                        studentCount: g.studentsCount,
                        attemptCount: g.attemptsCount,
                        avgScore: g.avgScore
                    }))
                });

                const mappedStudents = res.data.students.map(s => {
                    const avgScore = s.progressSummary ?
                        Math.round((s.progressSummary.listeningAvg + s.progressSummary.speakingAvg + s.progressSummary.readingAvg + s.progressSummary.writingAvg) / 4) : 0;

                    return {
                        id: s.id,
                        name: `${s.firstName || 'Unknown'} ${s.lastName || ''}`,
                        email: s.email,
                        score: avgScore,
                        status: avgScore > 80 ? "Active" : avgScore > 50 ? "Pending" : "Needs Review",
                        lastActivity: (s.attempts && s.attempts.length > 0) ? new Date(s.attempts[0].submittedAt).toLocaleDateString() : "No Activity",
                        avatar: `${(s.firstName || 'U')[0]}${(s.lastName || '')[0] || ''}`,
                        recentAttempts: s.attempts || []
                    };
                });
                setStudents(mappedStudents);
                setOriginalStudents(mappedStudents);
            } catch (error) {
                console.error("Teacher Dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeacherData();
    }, []);

    // Apply Search and Filter
    useEffect(() => {
        let filtered = [...originalStudents];

        if (searchQuery) {
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterStatus !== 'All') {
            filtered = filtered.filter(s => s.status === filterStatus);
        }

        setStudents(filtered);
    }, [searchQuery, filterStatus, originalStudents]);

    const handleAssignTask = async (taskId) => {
        if (!selectedStudent || !taskId) return;
        try {
            setAssignLoading(true);
            await api.post('/attempts/assign', {
                userId: selectedStudent.id,
                taskId: taskId
            });
            alert('Task assigned successfully!');
            setIsAssigning(false);
        } catch (error) {
            console.error("Assignment error:", error);
            alert(error.response?.data?.error || "Failed to assign task");
        } finally {
            setAssignLoading(false);
        }
    };

    const openAssignModal = async () => {
        try {
            setIsAssigning(true);
            const res = await api.get('/tasks');
            setAvailableTasks(res.data);
        } catch (error) {
            console.error("Fetch tasks error:", error);
        }
    };

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
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Educator Hub</h1>
                        <p className="text-gray-500 font-medium">Monitoring {stats.studentCount} assigned students</p>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search student..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-100 transition shadow-sm font-medium w-80"
                            />
                        </div>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex gap-6 mb-8 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`pb-4 px-2 font-black uppercase text-xs tracking-wider border-b-2 transition ${
                            activeTab === 'students' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-900'
                        }`}
                    >
                        Assigned Students
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`pb-4 px-2 font-black uppercase text-xs tracking-wider border-b-2 transition ${
                            activeTab === 'groups' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-900'
                        }`}
                    >
                        Group Reports
                    </button>
                </div>

                <div className="grid lg:grid-cols-3 gap-10">
                    {activeTab === 'students' ? (
                        /* Student List */
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-black text-gray-900">Assigned Students</h3>
                                <div className="flex items-center space-x-2">
                                    <Filter size={16} className="text-gray-400" />
                                    <select
                                        className="bg-transparent border-none text-primary-600 font-bold text-sm focus:ring-0 cursor-pointer"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="All">All Status</option>
                                        <option value="Active">Active</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Needs Review">Needs Review</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                <table className="w-full text-left font-medium">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-50">
                                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Student</th>
                                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Avg. Score</th>
                                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Status</th>
                                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest leading-none text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {students.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest">
                                                    No students match your criteria
                                                </td>
                                            </tr>
                                        ) : (
                                            students.map((student) => (
                                                <tr key={student.id} className="group hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedStudent(student)}>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 font-black flex items-center justify-center border-2 border-white shadow-sm transition-transform group-hover:scale-110">
                                                                {student.avatar}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-900">{student.name}</div>
                                                                <div className="text-xs text-gray-400">Activity: {student.lastActivity}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 font-black text-xl text-gray-700">
                                                        {student.score}%
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${student.status === 'Active'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            : student.status === 'Needs Review'
                                                                ? 'bg-rose-50 text-rose-600 border-rose-100'
                                                                : 'bg-amber-50 text-amber-600 border-amber-100'
                                                            }`}>
                                                            {student.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <button className="p-2 bg-gray-50 text-gray-400 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition shadow-sm">
                                                            <ChevronRight size={20} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* Group Reports */
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-black text-gray-900">Group Reports</h3>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-bold">
                                    {stats.groupsCount} groups managed
                                </span>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                <table className="w-full text-left font-medium">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-50">
                                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Group</th>
                                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Students</th>
                                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Submissions</th>
                                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Avg. Score</th>
                                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest leading-none text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {stats.groupActivities.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest">
                                                    No administered groups found
                                                </td>
                                            </tr>
                                        ) : (
                                            stats.groupActivities.map((g) => (
                                                <tr key={g.groupId} className="group hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/groups/${g.groupId}/students`)}>
                                                    <td className="px-8 py-5">
                                                        <div className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{g.groupName}</div>
                                                    </td>
                                                    <td className="px-8 py-5 text-gray-500 font-bold">
                                                        {g.studentCount} students
                                                    </td>
                                                    <td className="px-8 py-5 text-gray-500 font-bold">
                                                        {g.attemptCount} submissions
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-black text-lg text-gray-700">{g.avgScore}%</span>
                                                            <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full ${
                                                                        g.avgScore > 75 ? 'bg-emerald-500' : g.avgScore > 50 ? 'bg-amber-500' : 'bg-rose-500'
                                                                    }`}
                                                                    style={{ width: `${g.avgScore}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <button className="text-xs font-black text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-xl transition">
                                                            Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Sidebar Stats / Activity */}
                    <div className="space-y-8">
                        <div className="bg-indigo-900 p-10 rounded-[2.5rem] shadow-xl shadow-indigo-900/20 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                                    <Calendar size={24} />
                                </div>
                                <h3 className="text-2xl font-black mb-2">Weekly Summary</h3>
                                <p className="text-indigo-200 font-medium mb-8">System auto-generated report</p>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <span className="text-sm font-bold opacity-70 uppercase tracking-widest">Groups Managed</span>
                                        <span className="text-2xl font-black text-emerald-400">{stats.groupsCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <span className="text-sm font-bold opacity-70 uppercase tracking-widest">Tasks Assigned</span>
                                        <span className="text-2xl font-black">{stats.tasksAssigned}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <span className="text-sm font-bold opacity-70 uppercase tracking-widest">Reports Pending</span>
                                        <span className="text-2xl font-black text-amber-400">{String(stats.pendingReports).padStart(2, '0')}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Background glow */}
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary-500 rounded-full blur-[80px] opacity-30"></div>
                        </div>

                        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <h4 className="text-xl font-black text-gray-900 mb-6 flex items-center space-x-2">
                                <MessageSquare size={20} className="text-primary-500" />
                                <span>AI Observations</span>
                            </h4>
                            <div className="space-y-6">
                                {stats.studentCount > 0 && (
                                    <>
                                        <div className="flex space-x-4 border-l-4 border-emerald-500 pl-4">
                                            <div>
                                                <h5 className="font-bold text-gray-900 text-sm">Proficiency Index</h5>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {originalStudents.filter(s => s.score > 70).length} students are performing above the institutional baseline.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-4 border-l-4 border-rose-500 pl-4">
                                            <div>
                                                <h5 className="font-bold text-gray-900 text-sm">Intervention Required</h5>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {originalStudents.filter(s => s.score < 50).length} students flagged with low consistency in recent modules.
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button className="w-full mt-10 py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 font-bold text-sm hover:border-primary-200 hover:text-primary-600 transition flex items-center justify-center space-x-2">
                                <span>Full Insights Report</span>
                                <ArrowUpRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Student Details Modal */}
                {selectedStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-10 border-b border-gray-100 flex justify-between items-start">
                                <div className="flex items-center space-x-6">
                                    <div className="w-20 h-20 rounded-3xl bg-primary-600 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                                        {selectedStudent.avatar}
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-black text-gray-900">{selectedStudent.name}</h2>
                                        <p className="text-lg text-gray-500 font-medium">{selectedStudent.email}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedStudent(null)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                            <div className="p-12 grid md:grid-cols-2 gap-12">
                                <div>
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Recent Performance</h4>
                                    <div className="space-y-4">
                                        {selectedStudent.recentAttempts.map((attempt, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                                <div className="font-bold text-gray-900">{attempt.task?.title || 'Practice Session'}</div>
                                                <div className="text-primary-600 font-black">{attempt.status === 'ASSIGNED' ? 'PENDING' : `${attempt.score || 0}%`}</div>
                                            </div>
                                        ))}
                                        {selectedStudent.recentAttempts.length === 0 && (
                                            <div className="text-gray-400 italic">No recent attempts recorded.</div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-primary-50 p-8 rounded-[2rem] border border-primary-100 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-xs font-black text-primary-600 uppercase tracking-widest mb-4">Mastery level</h4>
                                        <div className="text-6xl font-black text-primary-900 mb-2">{selectedStudent.score}%</div>
                                        <p className="text-primary-600 font-medium">Overall proficiency across all LSRW modules.</p>
                                    </div>
                                    <div className="space-y-3 mt-4">
                                        <button
                                            onClick={() => {
                                                setSelectedStudentId(selectedStudent.id);
                                                setSelectedStudent(null);
                                            }}
                                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 transition"
                                        >
                                            View Detailed Performance Report
                                        </button>
                                        <button
                                            onClick={openAssignModal}
                                            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black shadow-lg shadow-primary-500/20 transition"
                                        >
                                            Assign New Task
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Task Assignment Selection Sub-Modal */}
                {isAssigning && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-10 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-3xl font-black text-gray-900">Select Task</h3>
                                    <p className="text-gray-500 font-medium italic">Assigning to {selectedStudent?.name}</p>
                                </div>
                                <button onClick={() => setIsAssigning(false)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>

                            <div className="p-10 max-h-[60vh] overflow-y-auto space-y-4">
                                {availableTasks.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 font-bold uppercase tracking-widest leading-none">
                                        No curriculum modules available
                                    </div>
                                ) : (
                                    availableTasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => handleAssignTask(task.id)}
                                            className="group p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-primary-600 transition-all shadow-sm hover:shadow-lg"
                                        >
                                            <div className="flex items-center space-x-6">
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary-600 font-black shadow-sm group-hover:scale-110 transition">
                                                    {(task.type || task.lsrwComponent || 'Task')[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 group-hover:text-white transition flex items-center flex-wrap gap-2">
                                                        <span>{task.title}</span>
                                                        {(task.assessmentType || task.subType) && (
                                                            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-white/20 group-hover:text-white group-hover:border-transparent shrink-0">
                                                                {(task.assessmentType || task.subType).replace(/_/g, ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400 group-hover:text-primary-100 transition whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">{task.description}</div>
                                                </div>
                                            </div>
                                            <div className="text-primary-600 font-black text-xs uppercase tracking-widest group-hover:text-white transition">
                                                {task.difficulty}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {assignLoading && (
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
                                    <Loader2 className="animate-spin text-primary-600" size={48} />
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </main>
            {selectedStudentId && (
                <StudentPerformanceModal
                    studentId={selectedStudentId}
                    onClose={() => setSelectedStudentId(null)}
                />
            )}
        </div>
    );
};

export default TeacherDashboard;
