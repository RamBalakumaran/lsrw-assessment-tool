import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import {
    BookOpen,
    Plus,
    Target,
    Layers,
    ChevronRight,
    Loader2,
    Headphones,
    Mic,
    PenTool,
    Music,
    Edit2,
    Trash2,
    Zap,
    Eye,
    MessageSquare,
    CheckCircle2,
    Settings,
    Brain
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';

const TeacherTasks = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTaskId, setEditTaskId] = useState(null);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        type: 'READING',
        difficulty: 'INTERMEDIATE',
        timeLimit: 30,
        passage: '',
        audioUrl: '',
        instructions: '',
        questions: []
    });
    const [viewingQuizId, setViewingQuizId] = useState(null);

    const getIcon = (type) => {
        switch (type) {
            case 'LISTENING': return <Headphones size={28} />;
            case 'SPEAKING': return <Mic size={28} />;
            case 'READING': return <BookOpen size={28} />;
            case 'WRITING': return <PenTool size={28} />;
            default: return <Layers size={28} />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'LISTENING': return 'text-blue-600 bg-blue-50';
            case 'SPEAKING': return 'text-purple-600 bg-purple-50';
            case 'READING': return 'text-emerald-600 bg-emerald-50';
            case 'WRITING': return 'text-rose-600 bg-rose-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await api.get('/tasks');
            setTasks(res.data);
        } catch (error) {
            console.error("Task fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleOpenCreateModal = () => {
        setEditTaskId(null);
        setNewTask({
            title: '',
            description: '',
            type: 'READING',
            difficulty: 'INTERMEDIATE',
            timeLimit: 30,
            passage: '',
            audioUrl: '',
            instructions: '',
            questions: []
        });
        setIsModalOpen(true);
    };

    const handleEditTask = (task) => {
        setEditTaskId(task.id);
        setNewTask({
            title: task.title || '',
            description: task.description || '',
            type: task.type || 'READING',
            difficulty: task.difficulty || 'INTERMEDIATE',
            timeLimit: task.timeLimit || 30,
            passage: task.passage || '',
            audioUrl: task.audioUrl || '',
            instructions: task.instructions || '',
            questions: task.questions || []
        });
        setIsModalOpen(true);
    };

    const handleDeleteTask = async (id) => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            try {
                await api.delete(`/tasks/${id}`);
                fetchTasks();
            } catch (error) {
                console.error("Failed to delete task:", error);
            }
        }
    };

    const handleAutoGenerateQuiz = () => {
        // Mocking AI Quiz Generation based on title/description/type
        const mockQuestions = [
            { id: Date.now() + 1, type: "Main Idea", questionText: `What is the primary focus of "${newTask.title}"?`, options: ["Option A", "Option B", "Option C"], correctAnswer: "Option A", time: 20 },
            { id: Date.now() + 2, type: "Detail Accuracy", questionText: "According to the material, which of these is true?", options: ["Correct Detail", "False Detail 1", "False Detail 2"], correctAnswer: "Correct Detail", time: 20 },
            { id: Date.now() + 3, type: "Contextual Logic", questionText: "What can be inferred from the provided context?", options: ["Inference X", "Inference Y", "Inference Z"], correctAnswer: "Inference X", time: 20 }
        ];
        setNewTask(prev => ({ ...prev, questions: mockQuestions }));
    };

    const addManualQuestion = () => {
        const newQ = { id: Date.now(), type: "General", questionText: "", options: ["", "", ""], correctAnswer: "", time: 20 };
        setNewTask(prev => ({ ...prev, questions: [...prev.questions, newQ] }));
    };

    const removeQuestion = (qId) => {
        setNewTask(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== qId) }));
    };

    const updateQuestion = (qId, field, value) => {
        setNewTask(prev => ({
            ...prev,
            questions: prev.questions.map(q => q.id === qId ? { ...q, [field]: value } : q)
        }));
    };

    const updateQuestionOption = (qId, optIdx, value) => {
        setNewTask(prev => ({
            ...prev,
            questions: prev.questions.map(q => {
                if (q.id === qId) {
                    const newOpts = [...q.options];
                    newOpts[optIdx] = value;
                    return { ...q, options: newOpts };
                }
                return q;
            })
        }));
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            if (editTaskId) {
                await api.put(`/tasks/${editTaskId}`, newTask);
            } else {
                await api.post('/tasks', newTask);
            }
            setIsModalOpen(false);
            setNewTask({
                title: '',
                description: '',
                type: 'READING',
                difficulty: 'INTERMEDIATE',
                timeLimit: 30,
                passage: '',
                audioUrl: '',
                instructions: ''
            });
            fetchTasks();
        } catch (error) {
            console.error("Failed to save task:", error);
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
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role="TEACHER" />

            <main className="flex-1 p-10 overflow-y-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Assigned Modules</h1>
                        <p className="text-gray-500 font-medium">Curriculum management for your student groups</p>
                    </div>

                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30"
                    >
                        <Plus size={18} />
                        <span>Create New Task</span>
                    </button>
                </header>

                <div className="space-y-6 max-w-5xl">
                    {tasks.map((task) => (
                        <React.Fragment key={task.id}>
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all"
                            >
                                <div className="flex items-center space-x-8">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black group-hover:scale-110 transition-transform ${getTypeColor(task.type)}`}>
                                        {getIcon(task.type)}
                                    </div>
                                    <div className="max-w-md">
                                        <div className="flex items-center space-x-3 mb-1">
                                            <h3 className="text-2xl font-black text-gray-900">{task.title}</h3>
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border italic ${getTypeColor(task.type)} border-current/10`}>
                                                {task.type}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 font-medium line-clamp-1">{task.description}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-12">
                                    <div className="text-right hidden md:block text-xs font-black text-gray-400 uppercase tracking-widest leading-none">
                                        <div className="mb-px">{task.difficulty}</div>
                                        <div>{task.timeLimit} MINS</div>
                                    </div>
                                    {task.createdById === user?.id ? (
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setViewingQuizId(viewingQuizId === task.id ? null : task.id)}
                                                className={`p-3 rounded-2xl transition shadow-sm ${viewingQuizId === task.id ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400 hover:bg-indigo-50'}`}
                                                title="View Quiz Questions"
                                            >
                                                <Eye size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleEditTask(task)}
                                                className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition shadow-sm"
                                                title="Edit Task"
                                            >
                                                <Edit2 size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-rose-600 hover:text-white transition shadow-sm"
                                                title="Delete Task"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black tracking-widest uppercase text-gray-400 border border-gray-100 italic">
                                            Admin Assigned
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Collapsible Quiz Preview */}
                            {viewingQuizId === task.id && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-gray-50/50 rounded-[2rem] p-8 -mt-4 mb-6 border border-gray-100 mx-4"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <Brain className="text-indigo-600" size={24} />
                                            <h4 className="text-xl font-black text-gray-800">Quiz Content ({task.questions?.length || 0} Questions)</h4>
                                        </div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            Estimated Time: {task.questions?.reduce((acc, q) => acc + (q.time || 0), 0)}s
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {task.questions?.map((q, idx) => (
                                            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
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
                                        {(!task.questions || task.questions.length === 0) && (
                                            <div className="col-span-full py-8 text-center text-gray-400 font-medium italic">
                                                No questions generated for this module yet.
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </React.Fragment>
                    ))}

                    {tasks.length === 0 && (
                        <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                            <Layers size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest">No curriculum modules assigned yet</p>
                        </div>
                    )}
                </div>

                {/* Create Task Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-10 border-b border-gray-50 flex justify-between items-center">
                                <h2 className="text-3xl font-black text-gray-900">{editTaskId ? 'Edit' : 'New'} {newTask.type.charAt(0) + newTask.type.slice(1).toLowerCase()} Module</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                                    <Plus className="rotate-45" size={32} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateTask} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Task Title</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Advanced Business Communication"
                                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 font-bold text-gray-900 transition"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Description</label>
                                    <textarea
                                        required
                                        placeholder="Outline the learning objectives..."
                                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 font-medium text-gray-700 transition min-h-[120px]"
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Module Type</label>
                                        <select
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 font-bold text-gray-700 transition appearance-none"
                                            value={newTask.type}
                                            onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                                        >
                                            <option value="READING">Reading</option>
                                            <option value="LISTENING">Listening</option>
                                            <option value="SPEAKING">Speaking</option>
                                            <option value="WRITING">Writing</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Difficulty</label>
                                        <select
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 font-bold text-gray-700 transition appearance-none"
                                            value={newTask.difficulty}
                                            onChange={(e) => setNewTask({ ...newTask, difficulty: e.target.value })}
                                        >
                                            <option value="BEGINNER">Beginner</option>
                                            <option value="INTERMEDIATE">Intermediate</option>
                                            <option value="ADVANCED">Advanced</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Time (Mins)</label>
                                        <input
                                            required
                                            type="number"
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 font-black text-gray-900 transition"
                                            value={newTask.timeLimit}
                                            onChange={(e) => setNewTask({ ...newTask, timeLimit: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                {(newTask.type === 'READING' || newTask.type === 'WRITING') && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Reading Passage / Prompt</label>
                                        <textarea
                                            required
                                            placeholder="Paste the text passage here..."
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 font-medium text-gray-700 transition min-h-[150px]"
                                            value={newTask.passage}
                                            onChange={(e) => setNewTask({ ...newTask, passage: e.target.value })}
                                        ></textarea>
                                    </div>
                                )}

                                {(newTask.type === 'LISTENING' || newTask.type === 'SPEAKING') && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2 flex items-center space-x-2">
                                            <Music size={14} />
                                            <span>Audio Source URL</span>
                                        </label>
                                        <input
                                            required
                                            type="url"
                                            placeholder="https://example.com/audio.mp3"
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 font-medium text-gray-700 transition"
                                            value={newTask.audioUrl}
                                            onChange={(e) => setNewTask({ ...newTask, audioUrl: e.target.value })}
                                        />
                                        <p className="text-[10px] text-gray-400 px-2 italic font-medium">Provide a direct link to the reference audio or video file.</p>
                                    </div>
                                )}

                                {/* Quiz Settings Section */}
                                <div className="pt-8 border-t border-gray-100 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                                <Settings size={20} />
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Quiz Configuration</h3>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAutoGenerateQuiz}
                                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-xs hover:shadow-lg transition active:scale-95"
                                        >
                                            <Zap size={14} className="fill-current" />
                                            <span>AI Auto-Generate Quiz</span>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {newTask.questions.map((q, idx) => (
                                            <div key={q.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 relative group">
                                                <button
                                                    type="button"
                                                    onClick={() => removeQuestion(q.id)}
                                                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Question Type</label>
                                                        <input
                                                            type="text"
                                                            value={q.type}
                                                            onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                                                            className="w-full px-4 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-indigo-200 font-bold text-gray-700 text-sm"
                                                            placeholder="e.g. Main Idea"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Time Limit (s)</label>
                                                        <input
                                                            type="number"
                                                            value={q.time}
                                                            onChange={(e) => updateQuestion(q.id, 'time', parseInt(e.target.value))}
                                                            className="w-full px-4 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-indigo-200 font-bold text-gray-700 text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2 mb-4">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Question Text</label>
                                                    <textarea
                                                        value={q.questionText || q.text}
                                                        onChange={(e) => updateQuestion(q.id, 'questionText', e.target.value)}
                                                        className="w-full px-4 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-indigo-200 font-medium text-gray-700 text-sm resize-none"
                                                        rows="2"
                                                        placeholder="Enter the question..."
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Options & Correct Answer</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        {(q.options || q.opts)?.map((opt, oIdx) => (
                                                            <div key={oIdx} className="relative">
                                                                <input
                                                                    type="text"
                                                                    value={opt}
                                                                    onChange={(e) => updateQuestionOption(q.id, oIdx, e.target.value)}
                                                                    className={`w-full px-4 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-indigo-200 font-bold text-xs ${opt === q.correctAnswer ? 'ring-2 ring-emerald-400' : ''}`}
                                                                    placeholder={`Option ${oIdx + 1}`}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateQuestion(q.id, 'correctAnswer', opt)}
                                                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition ${opt && opt === q.correctAnswer ? 'text-emerald-500 bg-emerald-50' : 'text-gray-200 hover:text-gray-400'}`}
                                                                >
                                                                    <CheckCircle2 size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={addManualQuestion}
                                            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold text-sm hover:border-indigo-200 hover:text-indigo-400 transition flex items-center justify-center space-x-2"
                                        >
                                            <Plus size={16} />
                                            <span>Add Manual Question</span>
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition transform hover:-translate-y-1">
                                    {editTaskId ? 'Update Active Module' : 'Publish Active Module'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TeacherTasks;
