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
  FileText
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, attemptsRes] = await Promise.all([
          api.get('/dashboard/student'),
          api.get('/attempts/my-attempts')
        ]);
        
        setUser(dashRes.data.user);
        setStats(dashRes.data.stats);
        setAssignedTasks(dashRes.data.assignedTasks || []);
        
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

      <main className="flex-1 p-10 overflow-y-auto">
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

          <div className="flex items-center space-x-6 bg-white p-3 rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="text-right pl-4">
              <div className="font-black text-gray-900 leading-none">{user.firstName} {user.lastName}</div>
              <div className="text-[10px] font-black uppercase text-gray-400 mt-1 tracking-widest">{user.plan}</div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary-500/30">
              {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
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

        {/* My Groups Section */}
        {user.groups && user.groups.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-8">My Groups</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {user.groups.map((group, idx) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * idx }}
                  className="bg-white p-6 rounded-[2rem] border-2 border-primary-100 shadow-sm flex flex-col"
                >
                  <h3 className="text-xl font-black text-gray-900 mb-2">{group.name}</h3>
                  <p className="text-sm font-medium text-gray-500 mb-4 flex-1">Check your specific assigned tasks below.</p>
                  <div className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg w-max">Active</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Prioritized Path (Assigned Tasks) Section */}
        {assignedTasks.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Prioritized Path (Assigned Tasks)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignedTasks.map((assignment, idx) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="bg-primary-600 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-lg shadow-primary-500/20 group hover:scale-[1.02] transition-transform duration-300"
                >
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center font-black text-2xl border border-white/20">
                      {assignment.task?.type?.[0] || assignment.task?.lsrwComponent?.[0] || 'T'}
                    </div>
                    <div>
                      <div className="text-xs font-black text-primary-200 uppercase tracking-widest leading-none mb-2 flex flex-wrap items-center gap-1.5">
                        <span>Teacher Assigned</span>
                        {assignment.task?.type && (
                          <>
                            <span>•</span>
                            <span>{assignment.task.type}</span>
                          </>
                        )}
                        {(assignment.task?.assessmentType || assignment.task?.subType) && (
                          <>
                            <span>•</span>
                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide">
                              {(assignment.task.assessmentType || assignment.task.subType).replace(/_/g, ' ')}
                            </span>
                          </>
                        )}
                      </div>
                      <h4 className="text-2xl font-black">{assignment.task?.title}</h4>
                    </div>
                  </div>
                  <Link
                    to={getModuleLink(assignment.task)}
                    className="p-4 bg-white text-primary-600 rounded-2xl hover:bg-primary-50 transition transform group-hover:translate-x-1"
                  >
                    <ArrowRight size={20} />
                  </Link>
                </motion.div>
              ))}
            </div>
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

        {/* Assessment Modules Grid */}
        <section id="modules" className="mb-6">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Assessment Modules</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
            {modules.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + (idx * 0.1) }}
                whileHover={{ y: -8 }}
                className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col items-start relative overflow-hidden group hover:shadow-2xl transition-all duration-500"
              >
                <div
                  className="absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity"
                  style={{ backgroundColor: m.color }}
                ></div>

                <div className="flex justify-between items-start w-full mb-8">
                  <div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500"
                    style={{ backgroundColor: `${m.color}15`, color: m.color }}
                  >
                    {React.cloneElement(m.icon, { size: 38 })}
                  </div>
                  <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-100 bg-gray-50 text-gray-400">
                    {m.level}
                  </span>
                </div>

                <div className="flex-grow pr-10">
                  <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight group-hover:text-primary-600 transition-colors">{m.title}</h3>
                  <p className="text-gray-500 mb-10 text-lg font-medium leading-relaxed">{m.desc}</p>

                  <Link
                    to={m.link}
                    className="flex items-center space-x-3 px-8 py-5 rounded-[1.5rem] bg-gray-900 text-white font-black text-lg hover:bg-black transition transform active:scale-95 shadow-xl shadow-gray-900/20"
                  >
                    <span>Start Module</span>
                    <ArrowRight size={22} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
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
