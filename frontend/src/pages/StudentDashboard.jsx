import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  Headphones,
  Mic,
  BookOpen,
  PenTool,
  Trophy,
  Target,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Loader2,
  Calendar,
  ChevronRight,
  FileText,
  Globe,
  Users,
  ChevronDown,
  ChevronUp,
  Download,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';

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

const StudentDashboard = () => {
  const [user, setUser] = useState({
    firstName: "Student",
    lastName: "",
    plan: "Standard Plan",
    groups: []
  });
  const [stats, setStats] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  const [globalTasks, setGlobalTasks] = useState([]);
  const [groupCards, setGroupCards] = useState([]);

  // States for accordions
  const [isGlobalExpanded, setIsGlobalExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [globalCategoryTab, setGlobalCategoryTab] = useState('ASSESSMENT');
  const [globalLsrwTab, setGlobalLsrwTab] = useState('LISTENING');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [groupCategoryTab, setGroupCategoryTab] = useState({});
  const [groupLsrwTab, setGroupLsrwTab] = useState({});
  const [groupSearchQueries, setGroupSearchQueries] = useState({});

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, attemptsRes] = await Promise.all([
          api.get('/dashboard/student'),
          api.get('/attempts/my-attempts')
        ]);
        
        setUser(dashRes.data.user);
        setStats(dashRes.data.stats);
        setGlobalTasks(dashRes.data.globalTasks || []);
        const fetchedGroupCards = dashRes.data.groupCards || [];
        setGroupCards(fetchedGroupCards);
        setAssignedTasks(dashRes.data.assignedTasks || []);

        // Collapse all group cards by default
        const initialExpanded = {};
        fetchedGroupCards.forEach(g => {
          initialExpanded[g.id] = false;
        });
        setExpandedGroups(initialExpanded);
        
        // Filter attempts that are completed
        const completedAttempts = (attemptsRes.data || []).filter(a => a.status === 'COMPLETED');
        setRecentAttempts(completedAttempts.slice(0, 5)); // show top 5 recent reports
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const handleDownloadReport = async () => {
    try {
      const response = await api.get('/reports/progress', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'progress_report.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Failed to download report");
    }
  };

  const handleDownloadAttemptPdf = async (attemptId, taskTitle) => {
    try {
        const response = await api.get(`/reports/attempt/${attemptId}/pdf`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Report_${(taskTitle || 'Task').replace(/\s+/g, '_')}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    } catch (error) {
        console.error("Error downloading PDF:", error);
        alert("Failed to download PDF report");
    }
  };

  const getModuleLink = (task) => {
    if (!task) return "/";
    const type = (task.lsrwComponent || task.type)?.toLowerCase();
    const assessType = (task.assessmentType || task.subType || '').toLowerCase();
    if (assessType === 'read aloud passage' || assessType === 'read_aloud') {
      return `/speaking-test/${task.id}`;
    }
    if (type === 'listening') return `/listening-test/${task.id}`;
    if (type === 'reading') return `/reading-test/${task.id}`;
    if (type === 'writing') return `/writing-test/${task.id}`;
    if (type === 'speaking') return `/speaking-test/${task.id}`;
    return "/";
  };

  const getIconForStat = (label) => {
    switch (label) {
      case 'Skill Average': return <Target className="text-primary-500" />;
      case 'Completed': return <CheckCircle2 className="text-emerald-500" />;
      case 'Global Rank': return <Trophy className="text-amber-500" />;
      case 'Daily Streak': return <Zap className="text-rose-500" />;
      default: return <Target />;
    }
  };

  const modules = [
    { title: "Listening", desc: "Sharpen your phonetic awareness and comprehension through high-fidelity audio streams.", color: "#0ea5e9", icon: <Headphones />, link: "/listening", level: "Intermediate" },
    { title: "Speaking", desc: "Real-time AI analysis of your pronunciation, fluency, and grammatical structure.", color: "#f43f5e", icon: <Mic />, link: "/speaking", level: "B2 Upper" },
    { title: "Reading", desc: "Enhance your processing speed and deep comprehension of complex technical passages.", color: "#f59e0b", icon: <BookOpen />, link: "/reading", level: "Advanced" },
    { title: "Writing", desc: "Construct sophisticated long-form content with real-time semantic and logic feedback.", color: "#10b981", icon: <PenTool />, link: "/writing", level: "Upper Intermediate" },
  ];

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
        <header className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center space-x-2 text-primary-600 font-black text-xs uppercase tracking-[0.2em] mb-3">
              <Sparkles size={14} />
              <span>AI Personalized Path Active</span>
            </div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter">
              Welcome back, <span className="gradient-text">{user.firstName}</span>
            </h1>
            <p className="text-gray-500 font-medium text-lg mt-1">Ready to push your boundaries today?</p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleDownloadReport}
              className="flex items-center space-x-2 bg-indigo-50 text-indigo-600 px-4 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition"
            >
              <Download size={18} />
              <span>Download Report</span>
            </button>
            <div className="flex items-center space-x-6 bg-white p-3 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="text-right pl-4">
                <div className="font-black text-gray-900 leading-none">{user.firstName} {user.lastName}</div>
                <div className="text-[10px] font-black uppercase text-gray-400 mt-1 tracking-widest">{user.plan}</div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary-500/30">
                {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-500"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                  {getIconForStat(stat.label)}
                </div>
                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                  {stat.trend}
                </span>
              </div>
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-2">{stat.label}</div>
              <div className="text-3xl font-black text-gray-900">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Assigned Tasks Section (Directly assigned tasks) HIDDEN AS PER REQUEST */}

        {/* Global Tasks Card Section */}
        <div className="mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all duration-300">
            <div 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setIsGlobalExpanded(!isGlobalExpanded)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black transition-transform group-hover:scale-105">
                  <Globe size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-indigo-600 transition-colors">Global Tasks</h2>
                  <p className="text-xs font-bold text-gray-400 mt-1">Platform-wide assessment and practice tasks</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                  <span className="text-xs font-black bg-indigo-50 text-indigo-600 px-3.5 py-1.5 rounded-full">
                    {globalTasks.length} {globalTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      {isGlobalExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
              </div>
            </div>

            {isGlobalExpanded && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                    <div className="flex space-x-4 mb-6 bg-gray-50 p-2 rounded-2xl w-max">
                        {['ASSESSMENT', 'PRACTICE'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setGlobalCategoryTab(cat)}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${globalCategoryTab === cat ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 border-b border-gray-100 pb-4">
                        <div className="flex space-x-2">
                            {['LISTENING', 'SPEAKING', 'READING', 'WRITING'].map(lsrw => (
                                <button
                                    key={lsrw}
                                    onClick={() => setGlobalLsrwTab(lsrw)}
                                    className={`px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors ${globalLsrwTab === lsrw ? 'bg-indigo-50 text-indigo-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'}`}
                                >
                                    {lsrw}
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Search global tasks..."
                                value={globalSearchQuery}
                                onChange={e => setGlobalSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full md:w-64 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {(() => {
                        const filteredTasks = globalTasks.filter(t => {
                            const tObj = t.task || t;
                            
                            if (tObj.status && tObj.status.toUpperCase() !== 'PUBLISHED') return false;

                            const catMatch = (tObj.category || 'PRACTICE') === globalCategoryTab;
                            const lsrwMatch = (tObj.type || tObj.lsrwComponent || '').toUpperCase() === globalLsrwTab;
                            const searchMatch = !globalSearchQuery || (tObj.title || '').toLowerCase().includes(globalSearchQuery.toLowerCase());
                            
                            return catMatch && lsrwMatch && searchMatch;
                        });

                        if (filteredTasks.length === 0) {
                            return (
                                <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-xs font-bold text-gray-400">
                                    No {globalCategoryTab.toLowerCase()} tasks found for {globalLsrwTab.toLowerCase()}.
                                </div>
                            );
                        }

                        // Group by subType
                        const grouped = filteredTasks.reduce((acc, t) => {
                            const tObj = t.task || t;
                            const subType = tObj.subType || tObj.assessmentType || 'Other';
                            if (!acc[subType]) acc[subType] = [];
                            acc[subType].push(t);
                            return acc;
                        }, {});

                        return Object.entries(grouped).map(([subType, tasksInGroup]) => (
                            <div key={subType} className="mb-8 last:mb-0">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 border-l-4 border-indigo-200 pl-3">{subType.replace(/_/g, ' ')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {tasksInGroup.map((assignment, idx) => {
                                        const tObj = assignment.task || assignment;
                                        
                                        // Simple countdown logic if endDate exists
                                        let timeRemaining = null;
                                        if (tObj.endDate) {
                                            const end = new Date(tObj.endDate);
                                            const now = new Date();
                                            const diffMs = end - now;
                                            if (diffMs > 0) {
                                                const diffMins = Math.floor(diffMs / 60000);
                                                const diffHours = Math.floor(diffMins / 60);
                                                if (diffHours > 24) timeRemaining = `${Math.floor(diffHours / 24)} days left`;
                                                else if (diffHours > 0) timeRemaining = `${diffHours} hrs left`;
                                                else timeRemaining = `${diffMins} mins left`;
                                            } else {
                                                timeRemaining = 'Closed';
                                            }
                                        }

                                        let isLocked = false;
                                        if (tObj.startDate && new Date(tObj.startDate) > new Date()) {
                                            isLocked = true;
                                            timeRemaining = 'Scheduled';
                                        }
                                        if (timeRemaining === 'Closed') {
                                            isLocked = true;
                                        }

                                        return (
                                            <motion.div
                                                key={assignment.id || idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`p-6 rounded-[2rem] text-white flex justify-between items-center shadow-lg group/card transition-all duration-300 ${isLocked ? 'bg-gray-400 opacity-70 cursor-not-allowed shadow-none' : tObj.priority === 'HIGH' ? 'bg-rose-500 shadow-rose-500/20 hover:scale-[1.01]' : tObj.priority === 'LOW' ? 'bg-emerald-500 shadow-emerald-500/20 hover:scale-[1.01]' : 'bg-indigo-600 shadow-indigo-500/20 hover:scale-[1.01]'}`}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-xl border border-white/20">
                                                        {tObj?.type?.[0] || tObj?.lsrwComponent?.[0] || 'G'}
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black text-white/70 uppercase tracking-widest leading-none mb-1 flex items-center gap-1.5">
                                                            <span>Priority: {tObj.priority || 'MEDIUM'}</span>
                                                            {timeRemaining && <span>• {timeRemaining}</span>}
                                                        </div>
                                                        <h4 className="text-xl font-black leading-tight">{tObj?.title || 'Untitled Task'}</h4>
                                                    </div>
                                                </div>
                                                {isLocked ? (
                                                    <div className="p-3 bg-white/20 rounded-xl text-white">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                    </div>
                                                ) : (
                                                    <Link
                                                        to={getModuleLink(tObj)}
                                                        className={`p-3 bg-white rounded-xl transition transform group-hover/card:translate-x-1 ${tObj.priority === 'HIGH' ? 'text-rose-500 hover:bg-rose-50' : tObj.priority === 'LOW' ? 'text-emerald-500 hover:bg-emerald-50' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                                    >
                                                        <ArrowRight size={18} />
                                                    </Link>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            )}
          </div>
        </div>

        {/* Group-Specific Task Cards Section (Disappears when student is not in group) */}
        {groupCards && groupCards.length > 0 && (
          <div className="mb-12 space-y-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">My Group Tasks</h2>
            {groupCards.map((groupCard, gIdx) => (
              <motion.div
                key={groupCard.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gIdx * 0.1 }}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6"
              >
                <div 
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => toggleGroup(groupCard.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-black transition-transform group-hover:scale-105">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-primary-600 transition-colors">{groupCard.name}</h3>
                      <p className="text-xs font-bold text-gray-400 mt-1">
                        {groupCard.academicYear ? `Year ${groupCard.academicYear}` : ''} {groupCard.section ? `• Section ${groupCard.section}` : ''} {groupCard.description || 'Assigned group tasks'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                      <span className="text-xs font-black bg-primary-50 text-primary-600 px-3.5 py-1.5 rounded-full">
                        {groupCard.tasks?.length || 0} enrolled tasks
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                          {expandedGroups[groupCard.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                  </div>
                </div>

                {expandedGroups[groupCard.id] && (
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        {(() => {
                            const currentCatTab = groupCategoryTab[groupCard.id] || 'ASSESSMENT';
                            const currentLsrwTab = groupLsrwTab[groupCard.id] || 'LISTENING';
                            const currentSearchQuery = groupSearchQueries[groupCard.id] || '';
                            
                            const filteredTasks = (groupCard.tasks || []).filter(t => {
                                const tObj = t.task || t;
                                if (tObj.status && tObj.status.toUpperCase() !== 'PUBLISHED') return false;
                                const catMatch = (tObj.category || 'PRACTICE') === currentCatTab;
                                const lsrwMatch = (tObj.type || tObj.lsrwComponent || '').toUpperCase() === currentLsrwTab;
                                const searchMatch = !currentSearchQuery || (tObj.title || '').toLowerCase().includes(currentSearchQuery.toLowerCase());
                                return catMatch && lsrwMatch && searchMatch;
                            });

                            return (
                                <>
                                    <div className="flex space-x-4 mb-6 bg-gray-50 p-2 rounded-2xl w-max">
                                        {['ASSESSMENT', 'PRACTICE'].map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setGroupCategoryTab(prev => ({...prev, [groupCard.id]: cat}))}
                                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${currentCatTab === cat ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 border-b border-gray-100 pb-4">
                                        <div className="flex space-x-2">
                                            {['LISTENING', 'SPEAKING', 'READING', 'WRITING'].map(lsrw => (
                                                <button
                                                    key={lsrw}
                                                    onClick={() => setGroupLsrwTab(prev => ({...prev, [groupCard.id]: lsrw}))}
                                                    className={`px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors ${currentLsrwTab === lsrw ? 'bg-primary-50 text-primary-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'}`}
                                                >
                                                    {lsrw}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input 
                                                type="text"
                                                placeholder={`Search ${groupCard.name}...`}
                                                value={currentSearchQuery}
                                                onChange={e => setGroupSearchQueries(prev => ({...prev, [groupCard.id]: e.target.value}))}
                                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full md:w-64 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {filteredTasks.length === 0 ? (
                                        <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-xs font-bold text-gray-400">
                                            No {currentCatTab.toLowerCase()} tasks found for {currentLsrwTab.toLowerCase()}.
                                        </div>
                                    ) : (
                                        (() => {
                                            const grouped = filteredTasks.reduce((acc, t) => {
                                                const tObj = t.task || t;
                                                const subType = tObj.subType || tObj.assessmentType || 'Other';
                                                if (!acc[subType]) acc[subType] = [];
                                                acc[subType].push(t);
                                                return acc;
                                            }, {});

                                            return Object.entries(grouped).map(([subType, tasksInGroup]) => (
                                                <div key={subType} className="mb-8 last:mb-0">
                                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 border-l-4 border-primary-200 pl-3">{subType.replace(/_/g, ' ')}</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {tasksInGroup.map((assignment, tIdx) => {
                                                            const tObj = assignment.task || assignment;
                                                            let timeRemaining = null;
                                                            if (tObj.endDate) {
                                                                const end = new Date(tObj.endDate);
                                                                const now = new Date();
                                                                const diffMs = end - now;
                                                                if (diffMs > 0) {
                                                                    const diffMins = Math.floor(diffMs / 60000);
                                                                    const diffHours = Math.floor(diffMins / 60);
                                                                    if (diffHours > 24) timeRemaining = `${Math.floor(diffHours / 24)} days left`;
                                                                    else if (diffHours > 0) timeRemaining = `${diffHours} hrs left`;
                                                                    else timeRemaining = `${diffMins} mins left`;
                                                                } else {
                                                                    timeRemaining = 'Closed';
                                                                }
                                                            }
                                                            let isLocked = false;
                                                            if (tObj.startDate && new Date(tObj.startDate) > new Date()) {
                                                                isLocked = true;
                                                                timeRemaining = 'Scheduled';
                                                            }
                                                            if (timeRemaining === 'Closed') {
                                                                isLocked = true;
                                                            }

                                                            return (
                                                                <motion.div
                                                                    key={assignment.id || tIdx}
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    className={`p-6 rounded-[2rem] text-white flex justify-between items-center shadow-lg group/card transition-all duration-300 ${isLocked ? 'bg-gray-400 opacity-70 cursor-not-allowed shadow-none' : tObj.priority === 'HIGH' ? 'bg-rose-500 shadow-rose-500/20 hover:scale-[1.01]' : tObj.priority === 'LOW' ? 'bg-emerald-500 shadow-emerald-500/20 hover:scale-[1.01]' : 'bg-primary-600 shadow-primary-500/20 hover:scale-[1.01]'}`}
                                                                >
                                                                    <div className="flex items-center space-x-4">
                                                                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-xl border border-white/20">
                                                                            {tObj?.type?.[0] || tObj?.lsrwComponent?.[0] || 'T'}
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-[10px] font-black text-white/70 uppercase tracking-widest leading-none mb-1 flex items-center gap-1.5">
                                                                                <span>Priority: {tObj.priority || 'MEDIUM'}</span>
                                                                                {timeRemaining && <span>• {timeRemaining}</span>}
                                                                            </div>
                                                                            <h4 className="text-xl font-black leading-tight">{tObj?.title || 'Untitled Task'}</h4>
                                                                        </div>
                                                                    </div>
                                                                    {isLocked ? (
                                                                        <div className="p-3 bg-white/20 rounded-xl text-white">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                                        </div>
                                                                    ) : (
                                                                        <Link
                                                                            to={getModuleLink(tObj)}
                                                                            className={`p-3 bg-white rounded-xl transition transform group-hover/card:translate-x-1 ${tObj.priority === 'HIGH' ? 'text-rose-500 hover:bg-rose-50' : tObj.priority === 'LOW' ? 'text-emerald-500 hover:bg-emerald-50' : 'text-primary-600 hover:bg-primary-50'}`}
                                                                        >
                                                                            <ArrowRight size={18} />
                                                                        </Link>
                                                                    )}
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ));
                                        })()
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Individual Reports Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">My Individual Reports</h2>
            <Link to="/student/history" className="text-sm font-black text-primary-600 uppercase tracking-widest hover:underline flex items-center gap-1">
              View All History <ChevronRight size={16} />
            </Link>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50">
              <h3 className="text-xl font-black text-gray-800">Recent Attempt Reports</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {recentAttempts.map((attempt, i) => (
                <div key={i} className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-primary-500 shrink-0">
                      <FileText size={22} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg leading-tight">{attempt.task?.title || "Speaking Session"}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-400 font-semibold mt-1">
                        <span className="bg-primary-50 text-primary-600 px-2 py-0.5 rounded uppercase font-black tracking-widest text-[9px] border border-primary-100">
                          {attempt.task?.type || "Speaking"}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar size={12} /> {new Date(attempt.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block leading-none mb-1">Score</span>
                      <span className="font-black text-2xl text-gray-700">{Math.round(attempt.score || 0)}%</span>
                    </div>
                    <button
                      onClick={() => setSelectedAttempt(attempt)}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-gray-900 text-white font-bold text-xs rounded-xl hover:bg-black transition shadow-sm active:scale-95 uppercase tracking-wider"
                    >
                      <span>View Report</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {recentAttempts.length === 0 && (
                <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-wider">
                  No assessment reports available yet. Submit a module to see your reports here.
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

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
                      <div className="flex items-center gap-4">
                          <button 
                              onClick={() => handleDownloadAttemptPdf(selectedAttempt.id, selectedAttempt.task?.title)} 
                              className="px-5 py-2.5 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-700 transition shadow-lg shadow-primary-500/30 flex items-center gap-2"
                          >
                              <Download size={16} />
                              Download PDF Report
                          </button>
                          <button onClick={() => setSelectedAttempt(null)} className="p-3 bg-white text-gray-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition shadow-sm border border-gray-100">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                      </div>
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
    </div>
  );
};

export default StudentDashboard;
