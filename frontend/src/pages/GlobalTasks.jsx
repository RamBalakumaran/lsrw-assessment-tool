import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
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
    PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const GlobalTasks = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL');
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-10">
                    <AnimatePresence mode='popLayout'>
                        {filteredTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group relative"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-primary-600 group-hover:scale-110 group-hover:bg-primary-50 transition-all duration-500">
                                        {getTypeIcon(task.type)}
                                    </div>
                                    {task.createdByRole === 'ADMIN' ? (
                                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                            <button
                                                onClick={() => handleOpenModal(task)}
                                                className="p-3 bg-white shadow-lg border border-gray-50 text-gray-400 hover:text-primary-600 rounded-2xl transition-all hover:scale-110"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(task.id)}
                                                className="p-3 bg-white shadow-lg border border-gray-50 text-gray-400 hover:text-rose-600 rounded-2xl transition-all hover:scale-110"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black tracking-widest uppercase text-gray-400 border border-gray-100 italic self-start mt-2">
                                            Teacher Defined
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <span className="px-5 py-2 rounded-full bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-[0.2em] border border-primary-100 inline-block shadow-sm">
                                        {task.type} ASSESSMENT
                                    </span>

                                    <h3 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors">
                                        {task.title}
                                    </h3>
                                    <p className="text-gray-500 font-medium text-sm line-clamp-2 leading-relaxed">
                                        {task.description || "No description provided for this curriculum asset."}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-50">
                                    <div className="flex items-center space-x-6">
                                        <div className="flex items-center space-x-2.5 text-gray-400">
                                            <div className="p-1.5 bg-gray-50 rounded-lg">
                                                <Clock size={14} className="text-gray-400" />
                                            </div>
                                            <span className="text-[11px] font-black tracking-widest uppercase">{task.timeLimit}s</span>
                                        </div>
                                        <div className="flex items-center space-x-2.5 text-gray-400">
                                            <div className="p-1.5 bg-gray-50 rounded-lg">
                                                <BarChart size={14} className="text-gray-400" />
                                            </div>
                                            <span className="text-[11px] font-black tracking-widest uppercase">{task.difficulty}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
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
                            className="relative w-full max-w-3xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-10 pb-0 flex justify-between items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="p-4 bg-primary-600 text-white rounded-3xl shadow-lg shadow-primary-500/30">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900">{editingTask ? 'Edit Master Task' : 'Create Master Task'}</h2>
                                        <p className="text-gray-500 font-medium">Define standardized assessment parameters</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-3 hover:bg-gray-100 rounded-2xl transition text-gray-400 hover:text-gray-900"
                                >
                                    <X size={28} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Task Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={taskData.title}
                                            onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-100 transition font-bold text-gray-900"
                                            placeholder="Cloud Computing Essentials"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Assessment Type</label>
                                        <select
                                            value={taskData.type}
                                            onChange={(e) => setTaskData({ ...taskData, type: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-100 transition font-bold appearance-none text-gray-900"
                                        >
                                            <option value="READING">READING</option>
                                            <option value="LISTENING">LISTENING</option>
                                            <option value="SPEAKING">SPEAKING</option>
                                            <option value="WRITING">WRITING</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Description</label>
                                    <textarea
                                        rows="2"
                                        value={taskData.description}
                                        onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-100 transition font-bold text-gray-900 resize-none"
                                        placeholder="Brief summary of what this task assesses..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Difficulty Level</label>
                                        <select
                                            value={taskData.difficulty}
                                            onChange={(e) => setTaskData({ ...taskData, difficulty: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-100 transition font-bold appearance-none text-gray-900"
                                        >
                                            <option value="BEGINNER">BEGINNER</option>
                                            <option value="INTERMEDIATE">INTERMEDIATE</option>
                                            <option value="ADVANCED">ADVANCED</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Time Limit (Seconds)</label>
                                        <input
                                            type="number"
                                            required
                                            value={taskData.timeLimit}
                                            onChange={(e) => setTaskData({ ...taskData, timeLimit: parseInt(e.target.value) })}
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-100 transition font-bold text-gray-900"
                                            placeholder="1200"
                                        />
                                    </div>
                                </div>

                                {(taskData.type === 'READING' || taskData.type === 'WRITING') && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">
                                            {taskData.type === 'READING' ? 'Reading Passage' : 'Writing Prompt'}
                                        </label>
                                        <textarea
                                            rows="5"
                                            value={taskData.passage}
                                            onChange={(e) => setTaskData({ ...taskData, passage: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-100 transition font-bold text-gray-900"
                                            placeholder={taskData.type === 'READING' ? "Enter the full text for students to read..." : "Enter the writing topic or prompt..."}
                                        />
                                    </div>
                                )}

                                {(taskData.type === 'LISTENING' || taskData.type === 'SPEAKING') && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">
                                            {taskData.type === 'LISTENING' ? 'Audio Source URL' : 'Speaking Instructions'}
                                        </label>
                                        <input
                                            type="text"
                                            value={taskData.type === 'LISTENING' ? taskData.audioUrl : taskData.instructions}
                                            onChange={(e) => taskData.type === 'LISTENING'
                                                ? setTaskData({ ...taskData, audioUrl: e.target.value })
                                                : setTaskData({ ...taskData, instructions: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-100 transition font-bold text-gray-900"
                                            placeholder={taskData.type === 'LISTENING' ? "https://example.com/audio.mp3" : "Describe what the student should speak about..."}
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full py-6 bg-primary-600 text-white rounded-[2.5rem] font-black text-xl hover:bg-primary-700 transition shadow-xl shadow-primary-500/20 mt-4 active:scale-[0.98] duration-200"
                                >
                                    {editingTask ? 'Update Global Asset' : 'Publish Master Task'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GlobalTasks;
