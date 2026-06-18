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
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';

const Dashboard = () => {
  const [user, setUser] = useState({
    firstName: "Student",
    lastName: "",
    plan: "Standard Plan",
    groups: []
  });
  const [stats, setStats] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/student');
        setUser(res.data.user);
        setStats(res.data.stats);
        setAssignedTasks(res.data.assignedTasks || []);
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getModuleLink = (task) => {
    if (!task) return "/";
    const type = (task.lsrwComponent || task.type)?.toLowerCase();
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
    { title: "Speaking", desc: "Real-time AI analysis of your pronunciation, fluency, and grammatical structure.", color: "#f43f5e", icon: <Mic />, link: "/test/1", level: "B2 Upper" },
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

        {/* Prioritized Path Section */}
        {assignedTasks.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Prioritized Path</h2>
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
                      <div className="text-xs font-black text-primary-200 uppercase tracking-widest leading-none mb-1">Teacher Assigned</div>
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

        <section>
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Assessment Modules</h2>
            <button className="text-primary-600 font-black text-sm uppercase tracking-widest flex items-center hover:translate-x-1 transition-transform">
              Browse Curriculum <ArrowRight size={16} className="ml-2" />
            </button>
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

        {/* Quick Tips Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 bg-indigo-900 rounded-[3rem] p-12 text-white relative overflow-hidden"
        >
          <div className="relative z-10 max-w-2xl">
            <h4 className="text-4xl font-black mb-6 tracking-tighter leading-tight">Optimize your <br /><span className="text-indigo-400">LSRW Efficiency</span></h4>
            <p className="text-indigo-100 text-lg font-medium mb-10 leading-relaxed">
              Our AI models recommend focusing on "Speaking" today. Class data shows a 12% improvement in fluency when practiced after a Listening session.
            </p>
            <button className="px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black shadow-xl hover:scale-105 transition active:scale-95">
              View Personalized Insights
            </button>
          </div>
          {/* Background Abstract */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary-500 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-400 rounded-full blur-[60px] opacity-20"></div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;