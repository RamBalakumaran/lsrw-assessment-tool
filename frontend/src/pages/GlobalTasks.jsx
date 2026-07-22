import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import TaskCreationForm from '../components/TaskCreationForm';
import {
    BookOpen,
    Plus,
    Search,
    Type,
    Clock,
    BarChart,
    Loader2,
    Edit2,
    Trash2,
    X,
    FileText,
    Mic,
    Headphones,
    PenTool,
    Zap,
    Eye,
    Brain,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const GlobalTasks = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [viewingQuizId, setViewingQuizId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskData, setTaskData] = useState({
        title: '',
        description: '',
        type: 'READING',
        difficulty: 'INTERMEDIATE',
        timeLimit: 1200,
        passage: '',
        instructions: '',
        audioUrl: ''
    });

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            setTasks(res.data);
        } catch (error) {
            console.error("Task fetch error:", error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesFilter = activeFilter === 'ALL' || t.type === activeFilter;

            return matchesSearch && matchesFilter;
        });
    }, [tasks, searchQuery, activeFilter]);

    const handleOpenModal = (task = null) => {
        if (task) {
            setEditingTask(task);
            setTaskData({
                title: task.title,
                description: task.description || '',
                type: task.type,
                difficulty: task.difficulty,
                timeLimit: task.timeLimit || 1200,
                passage: task.passage || '',
                instructions: task.instructions || '',
                audioUrl: task.audioUrl || ''
            });
        } else {
            setEditingTask(null);
            setTaskData({
                title: '',
                description: '',
                type: 'READING',
                difficulty: 'INTERMEDIATE',
                timeLimit: 1200,
                passage: '',
                instructions: '',
                audioUrl: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTask) {
                await api.put(`/tasks/${editingTask.id}`, taskData);
            } else {
                await api.post('/tasks', taskData);
            }
            setShowModal(false);
            fetchTasks();
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save task");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        try {
            await api.delete(`/tasks/${id}`);
            fetchTasks();
        } catch (error) {
            alert("Failed to delete task");
        }
    };

    const handleToggleStatus = async (task) => {
        const newStatus = task.status === 'Published' ? 'Draft' : 'Published';
        try {
            await api.put(`/tasks/${task.id}`, { status: newStatus });
            fetchTasks();
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'READING': return <FileText size={24} />;
            case 'LISTENING': return <Headphones size={24} />;
            case 'SPEAKING': return <Mic size={24} />;
            case 'WRITING': return <PenTool size={24} />;
            default: return <Type size={24} />;
        }
    };

    if (loading) return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role="ADMIN" />
            <main className="flex-1 p-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary-500" size={48} />
            </main>
        </div>
    );

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role="ADMIN" />

            <main className="flex-1 p-10 overflow-y-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Curriculum Assets</h1>
                        <p className="text-gray-500 font-medium">Standardized LSRW assessments for the institution</p>
                    </div>

                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-500/30"
                    >
                        <Plus size={18} />
                        <span>Create Master Task</span>
                    </button>
                </header>

                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-8 mb-10">
                    <div className="relative max-w-xl flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search assets by title or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-8 py-5 bg-white border-none rounded-[2rem] shadow-sm focus:ring-4 focus:ring-primary-100 transition font-medium text-lg"
                        />
                    </div>

                    <div className="flex items-center bg-white p-2 rounded-[1.8rem] shadow-sm border border-gray-100 space-x-1 shrink-0">
                        {['ALL', 'READING', 'LISTENING', 'SPEAKING', 'WRITING'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeFilter === filter
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-6 max-w-5xl">
                    <AnimatePresence mode='popLayout'>
                        {filteredTasks.map((task) => (
                            <React.Fragment key={task.id}>
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all"
                                >
                                    <div className="flex items-center space-x-8">
                                        <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-primary-600 group-hover:scale-110 group-hover:bg-primary-50 transition-all duration-500">
                                            {getTypeIcon(task.type)}
                                        </div>
                                        <div className="max-w-md">
                                            <div className="flex items-center space-x-3 mb-1">
                                                <h3 className="text-2xl font-black text-gray-900">{task.title}</h3>
                                                <span className="px-5 py-1.5 rounded-full bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-[0.2em] border border-primary-100 inline-block shadow-sm">
                                                    {task.type}
                                                </span>
                                                {(task.assessmentType || task.subType) && (
                                                    <span className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 inline-block shadow-sm">
                                                        {(task.assessmentType || task.subType).replace(/_/g, ' ')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-500 font-medium text-sm line-clamp-1 leading-relaxed">
                                                {task.description || "No description provided for this curriculum asset."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-12">
                                        <div className="text-right hidden md:block text-xs font-black text-gray-400 uppercase tracking-widest leading-none font-sans">
                                            <div className="mb-px">{task.difficultyLevel}</div>
                                            <div>{task.timeLimit >= 60 ? `${Math.round(task.timeLimit / 60)} MINS` : `${task.timeLimit} SECS`}</div>
                                        </div>
                                        {task.creatorId === user?.id || user?.role === 'ADMIN' || user?.role === 'TEACHER' ? (
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleToggleStatus(task)}
                                                    className={`p-3 rounded-2xl transition shadow-sm ${task.status === 'Published' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                                    title={task.status === 'Published' ? 'Click to Deactivate' : 'Click to Activate'}
                                                >
                                                    <Zap size={20} />
                                                </button>
                                                <button
                                                    onClick={() => setViewingQuizId(viewingQuizId === task.id ? null : task.id)}
                                                    className={`p-3 rounded-2xl transition shadow-sm ${viewingQuizId === task.id ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400 hover:bg-indigo-50'}`}
                                                    title="Preview Task Content"
                                                >
                                                    <Eye size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(task)}
                                                    className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition shadow-sm"
                                                    title="Edit Task"
                                                >
                                                    <Edit2 size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(task.id)}
                                                    className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-rose-600 hover:text-white transition shadow-sm"
                                                    title="Delete Task"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black tracking-widest uppercase text-gray-400 border border-gray-100 italic">
                                                Teacher Defined
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Collapsible Task Preview */}
                                {viewingQuizId === task.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-gray-50/50 rounded-[2rem] p-8 -mt-4 mb-6 border border-gray-100 mx-4 space-y-6"
                                    >
                                        <div className="flex items-center justify-between border-b border-gray-200/60 pb-4">
                                            <div className="flex items-center space-x-3">
                                                <Brain className="text-indigo-600" size={24} />
                                                <h4 className="text-xl font-black text-gray-800">Task Preview</h4>
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white border border-gray-100 px-3 py-1 rounded-full">
                                                {task.visibilityScope === 'Global' ? 'Public / Global' : `Group Specific (${task.targetGroups?.map(g => g.name).join(', ') || 'No groups assigned'})`}
                                            </span>
                                        </div>

                                        {/* Task Core Metadata */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-gray-100/80">
                                            <div>
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Description</div>
                                                <p className="text-sm font-medium text-gray-700">{task.description || "No description provided."}</p>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Settings</div>
                                                <div className="text-xs font-bold text-gray-600 space-y-1">
                                                    <div>Max Attempts: <span className="font-black text-gray-900">{task.maxAttempts}</span></div>
                                                    <div>Passing Score: <span className="font-black text-gray-900">{task.passingScore}%</span></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Task Contents */}
                                        {(task.passage || task.instructions || task.audioUrl || task.imageUrl) && (
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100/80 space-y-4">
                                                {task.instructions && (
                                                    <div>
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Instructions</div>
                                                        <p className="text-sm font-bold text-gray-800 whitespace-pre-wrap">{task.instructions}</p>
                                                    </div>
                                                )}
                                                {task.passage && (
                                                    <div>
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Passage / Prompt</div>
                                                        <p className="text-sm font-bold text-gray-800 bg-gray-50 p-4 rounded-xl border border-gray-100/50 whitespace-pre-wrap leading-relaxed">{task.passage}</p>
                                                    </div>
                                                )}
                                                {task.audioUrl && (
                                                    <div>
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Audio Source</div>
                                                        <audio controls src={task.audioUrl} className="w-full max-w-md h-10 rounded-xl" />
                                                    </div>
                                                )}
                                                {task.imageUrl && (
                                                    <div>
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reference Image</div>
                                                        <img src={task.imageUrl} alt="Task Reference" className="max-w-md max-h-48 rounded-xl object-contain border border-gray-100" />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Questions */}
                                        {task.questions && task.questions.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Questions ({task.questions.length})</div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {task.questions.map((q, idx) => (
                                                        <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/80">
                                                            <div className="flex items-center space-x-2 mb-2">
                                                                <span className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-black">{idx + 1}</span>
                                                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-gray-50 px-2 py-0.5 rounded-md">{q.type}</span>
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-700 mb-3">{q.questionText || q.text}</p>
                                                            <div className="space-y-1.5">
                                                                {(q.options || q.opts)?.map((opt, oIdx) => (
                                                                    <div key={oIdx} className={`text-[11px] px-3 py-1.5 rounded-lg flex items-center space-x-2 ${opt === q.correctAnswer ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100' : 'bg-gray-50 text-gray-500'}`}>
                                                                        {opt === q.correctAnswer && <CheckCircle2 size={12} />}
                                                                        <span>{opt}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </React.Fragment>
                        ))}
                    </AnimatePresence>
                </div>
            </main>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
                            onClick={() => setShowModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.9 }}
                            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[3.5rem] shadow-2xl flex flex-col"
                        >
                            <div className="absolute top-6 right-6 z-10">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-3 hover:bg-gray-100 rounded-2xl transition text-gray-400 hover:text-gray-900 bg-white shadow"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-8">
                                <TaskCreationForm 
                                    onTaskCreated={(newTask) => {
                                        setShowModal(false);
                                        fetchTasks();
                                    }} 
                                    userRole={user?.role} 
                                    userId={user?.id} 
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GlobalTasks;
