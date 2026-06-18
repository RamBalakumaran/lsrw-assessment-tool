import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, X, Plus, Trash2, ChevronDown, ChevronLeft, Headphones, Mic, BookOpen, PenTool, LayoutTemplate, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import QuestionBuilder from './QuestionBuilder';

const TASK_CONFIG = {
    LISTENING: {
        icon: <Headphones size={32} />,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        subtypes: {
            MCQ_AUDIO: { label: 'Multiple Choice from Audio', fields: ['audioUrl', 'questions'] },
            FILL_BLANKS_AUDIO: { label: 'Fill Blanks from Audio', fields: ['audioUrl', 'questions'] },
            DICTATION: { label: 'Dictation Exercise', fields: ['audioUrl', 'questions'] }
        }
    },
    SPEAKING: {
        icon: <Mic size={32} />,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        border: 'border-indigo-100',
        subtypes: {
            SELF_INTRODUCTION: { label: 'Self-Introduction', fields: ['instructions', 'timeLimit', 'evaluationRubric'] },
            PICTURE_DESCRIPTION: { label: 'Picture Description', fields: ['instructions', 'timeLimit', 'evaluationRubric'] },
            ONE_MINUTE_ASSESSMENT: { label: 'One Minute Assessment', fields: ['instructions', 'timeLimit', 'evaluationRubric'] },
            REPEAT_SENTENCES: { label: 'Repeat Sentences', fields: ['audioUrl', 'evaluationRubric'] }
        }
    },
    READING: {
        icon: <BookOpen size={32} />,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
        subtypes: {
            READ_ALOUD: { label: 'Read Aloud Passage', fields: ['passage', 'timeLimit', 'evaluationRubric'] },
            COMPREHENSION_MCQ: { label: 'Reading Comprehension (MCQ)', fields: ['passage', 'questions'] },
            TRUE_FALSE: { label: 'True/False Questions', fields: ['passage', 'questions'] },
            FILL_BLANKS: { label: 'Fill in the Blanks', fields: ['passage', 'questions'] },
            VOCABULARY: { label: 'Vocabulary from Context', fields: ['passage', 'questions'] }
        }
    },
    WRITING: {
        icon: <PenTool size={32} />,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        subtypes: {
            ESSAY: { label: 'Essay Writing', fields: ['instructions', 'evaluationRubric', 'timeLimit'] },
            PARAGRAPH: { label: 'Paragraph Writing', fields: ['instructions', 'timeLimit'] },
            LETTER_EMAIL: { label: 'Letter/Email Writing', fields: ['instructions', 'timeLimit'] },
            STORY_COMPLETION: { label: 'Story Completion', fields: ['passage', 'instructions', 'timeLimit'] },
            SUMMARIZATION: { label: 'Summarization', fields: ['passage', 'instructions'] },
            GRAMMAR_CORRECTION: { label: 'Grammar Correction', fields: ['passage', 'questions'] },
            REPORT: { label: 'Report Writing', fields: ['instructions', 'evaluationRubric', 'timeLimit'] }
        }
    }
};

const VISIBILITY_SCOPES = [
    { value: 'Global', label: 'Global', description: 'Visible to all students.' },
    { value: 'GroupSpecific', label: 'Group-Specific', description: 'Visible to selected groups only.' }
];

const TaskCreationForm = ({ onTaskCreated, userRole }) => {
    const [step, setStep] = useState(1);
    const [taskType, setTaskType] = useState(null);
    const [subType, setSubType] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficultyLevel: 'Beginner',
        visibilityScope: 'Global',
        groupIds: [],
        audioUrl: '',
        passage: '',
        instructions: '',
        timeLimit: 120,
        maxAttempts: 1,
        passingScore: 60,
        startDate: '',
        endDate: '',
        questions: [],
        showAnswers: false,
        evaluationRubric: null
    });

    const [groups, setGroups] = useState([]);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                if (userRole !== 'STUDENT') {
                    const groupRes = await api.get('/groups/my-groups');
                    setGroups(groupRes.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch groups:', err);
            }
        };
        fetchGroups();
    }, [userRole]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        const config = TASK_CONFIG[taskType]?.subtypes[subType];
        if (config) {
            if (config.fields.includes('audioUrl') && !formData.audioUrl.trim()) newErrors.audioUrl = 'Audio URL is required for this task';
            if (config.fields.includes('passage') && !formData.passage.trim()) newErrors.passage = 'Passage is required for this task';
            if (config.fields.includes('instructions') && !formData.instructions.trim()) newErrors.instructions = 'Instructions are required for this task';
        }
        if (formData.visibilityScope === 'GroupSpecific' && formData.groupIds.length === 0) {
            newErrors.groupIds = 'Select at least one group';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            const payload = {
                ...formData,
                lsrwComponent: taskType.charAt(0).toUpperCase() + taskType.slice(1).toLowerCase(),
                assessmentType: TASK_CONFIG[taskType].subtypes[subType].label,
                status: 'Draft'
            };
            if (!payload.startDate) delete payload.startDate;
            if (!payload.endDate) delete payload.endDate;
            if (payload.visibilityScope !== 'GroupSpecific') payload.groupIds = [];

            const response = await api.post('/tasks', payload);
            setSuccess(true);
            setTimeout(() => {
                setTaskType(null);
                setSubType(null);
                setStep(1);
                setFormData({
                    title: '', description: '', difficultyLevel: 'Beginner', visibilityScope: 'Global', groupIds: [],
                    audioUrl: '', passage: '', instructions: '', timeLimit: 120, maxAttempts: 1, passingScore: 60,
                    startDate: '', endDate: '', questions: [], showAnswers: false, evaluationRubric: null
                });
                setSuccess(false);
                if (onTaskCreated) onTaskCreated(response.data);
            }, 2000);
        } catch (error) {
            setErrors({ submit: error.response?.data?.error || 'Failed to create task' });
        } finally {
            setLoading(false);
        }
    };

    if (step === 1) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] shadow-xl p-10 font-sans border border-gray-100 max-w-4xl w-full mx-auto">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg">
                        <LayoutTemplate size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Create Assessment</h2>
                        <p className="text-gray-500 font-medium">Select the foundational component for your new task.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(TASK_CONFIG).map(([type, config]) => (
                        <motion.button
                            whileHover={{ y: -4 }}
                            key={type}
                            onClick={() => { setTaskType(type); setStep(2); }}
                            className={`p-8 border-2 border-gray-100 rounded-[2rem] text-left transition-all hover:border-transparent hover:shadow-xl group relative overflow-hidden`}
                        >
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${config.bg}`}></div>
                            <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center shadow-inner ${config.bg} ${config.color}`}>
                                {config.icon}
                            </div>
                            <h3 className="font-black text-2xl text-gray-900 mb-2">{type}</h3>
                            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Select Category →</p>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        );
    }

    if (step === 2 && taskType) {
        const config = TASK_CONFIG[taskType];
        return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[2.5rem] shadow-xl p-10 font-sans border border-gray-100 max-w-4xl w-full mx-auto">
                <button onClick={() => setStep(1)} className="flex items-center text-gray-400 hover:text-gray-900 font-bold mb-8 transition">
                    <ChevronLeft size={20} className="mr-1" /> Back to Categories
                </button>

                <div className="flex items-center gap-4 mb-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${config.bg} ${config.color}`}>
                        {config.icon}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">{taskType} Focus</h2>
                        <p className="text-gray-500 font-medium">Select the specific assessment format.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(config.subtypes).map(([subtype, subConfig]) => (
                        <button
                            key={subtype}
                            onClick={() => { setSubType(subtype); setStep(3); }}
                            className="p-6 border-2 border-gray-100 rounded-2xl text-left hover:border-gray-900 transition-all group"
                        >
                            <div className="font-black text-lg text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{subConfig.label}</div>
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                Required: {subConfig.fields.join(', ')}
                            </div>
                        </button>
                    ))}
                </div>
            </motion.div>
        );
    }

    if (step === 3 && taskType && subType) {
        const typeConfig = TASK_CONFIG[taskType];
        const config = typeConfig.subtypes[subType];
        
        return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[2.5rem] shadow-xl p-10 font-sans border border-gray-100 max-w-4xl w-full mx-auto relative overflow-hidden">
                <button onClick={() => setStep(2)} className="flex items-center text-gray-400 hover:text-gray-900 font-bold mb-8 transition relative z-10">
                    <ChevronLeft size={20} className="mr-1" /> Back to Formats
                </button>

                <div className="flex items-center gap-4 mb-10 relative z-10">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${typeConfig.bg} ${typeConfig.color}`}>
                        <Layers size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">{config.label}</h2>
                        <p className="text-gray-500 font-medium">Configure the parameters for this assessment.</p>
                    </div>
                </div>

                <AnimatePresence>
                    {errors.submit && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8 p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-start space-x-3 font-bold text-sm">
                            <AlertCircle size={20} className="flex-shrink-0" />
                            <span>{errors.submit}</span>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8 p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center space-x-3 font-bold text-sm">
                            <CheckCircle2 size={20} />
                            <span>Assessment Task deployed successfully!</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-8 relative z-10">
                    {/* Title & Description */}
                    <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 space-y-6">
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Task Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="e.g., Advanced English Grammar Review"
                                className={`w-full px-5 py-4 bg-white border ${errors.title ? 'border-rose-300 focus:ring-rose-100' : 'border-gray-200 focus:ring-primary-100'} rounded-2xl font-bold focus:outline-none focus:ring-4 transition`}
                            />
                            {errors.title && <span className="text-rose-600 text-xs font-bold mt-2 block">{errors.title}</span>}
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Additional instructions or context..."
                                rows="3"
                                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl font-medium focus:outline-none focus:ring-4 focus:ring-primary-100 transition resize-none"
                            />
                        </div>
                    </div>

                    {/* Meta Config */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Difficulty</label>
                            <select
                                value={formData.difficultyLevel}
                                onChange={(e) => handleInputChange('difficultyLevel', e.target.value)}
                                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition appearance-none cursor-pointer"
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Time Limit (s)</label>
                            <input
                                type="number"
                                value={formData.timeLimit}
                                onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value) || 0)}
                                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Max Attempts</label>
                            <input
                                type="number"
                                value={formData.maxAttempts}
                                onChange={(e) => handleInputChange('maxAttempts', parseInt(e.target.value) || 1)}
                                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition"
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Passing Score</label>
                            <input
                                type="number"
                                value={formData.passingScore}
                                onChange={(e) => handleInputChange('passingScore', parseInt(e.target.value) || 0)}
                                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition"
                                min="0" max="100"
                            />
                        </div>
                    </div>

                    {/* Content Fields based on subtype */}
                    <div className="space-y-6 pt-4 border-t border-gray-100">
                        {config.fields.includes('audioUrl') && (
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Audio Source URL *</label>
                                <input
                                    type="url"
                                    value={formData.audioUrl}
                                    onChange={(e) => handleInputChange('audioUrl', e.target.value)}
                                    placeholder="https://example.com/audio.mp3"
                                    className={`w-full px-5 py-4 bg-white border ${errors.audioUrl ? 'border-rose-300 focus:ring-rose-100' : 'border-gray-200 focus:ring-primary-100'} rounded-2xl font-bold focus:outline-none focus:ring-4 transition`}
                                />
                                {errors.audioUrl && <span className="text-rose-600 text-xs font-bold mt-2 block">{errors.audioUrl}</span>}
                            </div>
                        )}

                        {config.fields.includes('passage') && (
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Reading Passage / Prompt *</label>
                                <textarea
                                    value={formData.passage}
                                    onChange={(e) => handleInputChange('passage', e.target.value)}
                                    placeholder="Enter the text passage..."
                                    rows="6"
                                    className={`w-full px-5 py-4 bg-white border ${errors.passage ? 'border-rose-300 focus:ring-rose-100' : 'border-gray-200 focus:ring-primary-100'} rounded-2xl font-medium focus:outline-none focus:ring-4 transition resize-none`}
                                />
                                {errors.passage && <span className="text-rose-600 text-xs font-bold mt-2 block">{errors.passage}</span>}
                            </div>
                        )}

                        {config.fields.includes('instructions') && (
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Specific Instructions *</label>
                                <textarea
                                    value={formData.instructions}
                                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                                    placeholder="Provide specific instructions to the student..."
                                    rows="3"
                                    className={`w-full px-5 py-4 bg-white border ${errors.instructions ? 'border-rose-300 focus:ring-rose-100' : 'border-gray-200 focus:ring-primary-100'} rounded-2xl font-medium focus:outline-none focus:ring-4 transition resize-none`}
                                />
                                {errors.instructions && <span className="text-rose-600 text-xs font-bold mt-2 block">{errors.instructions}</span>}
                            </div>
                        )}
                    </div>

                    {/* Question Builder */}
                    {config.fields.includes('questions') && (
                        <div className="pt-4 border-t border-gray-100">
                            <QuestionBuilder 
                                questions={formData.questions} 
                                onChange={(newQuestions) => handleInputChange('questions', newQuestions)} 
                            />
                        </div>
                    )}

                    {/* Visibility & Assignments */}
                    <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">Deployment Scope *</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {VISIBILITY_SCOPES.map(scope => (
                                <label key={scope.value} className={`relative flex flex-col p-6 border-2 rounded-2xl cursor-pointer transition-all ${formData.visibilityScope === scope.value ? 'border-gray-900 bg-white shadow-md' : 'border-gray-200 bg-transparent hover:border-gray-300'}`}>
                                    <div className="flex items-center mb-2">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${formData.visibilityScope === scope.value ? 'border-gray-900' : 'border-gray-300'}`}>
                                            {formData.visibilityScope === scope.value && <div className="w-2.5 h-2.5 rounded-full bg-gray-900"></div>}
                                        </div>
                                        <span className={`font-black ${formData.visibilityScope === scope.value ? 'text-gray-900' : 'text-gray-600'}`}>{scope.label}</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-500 ml-8">{scope.description}</span>
                                </label>
                            ))}
                        </div>

                        {formData.visibilityScope === 'GroupSpecific' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-4 border-t border-gray-200">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">Target Groups</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                                    {groups.length === 0 ? (
                                        <div className="text-gray-500 font-medium italic">No targetable groups available.</div>
                                    ) : groups.map(group => (
                                        <label key={group.id} className="flex items-center p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-gray-900 transition">
                                            <input
                                                type="checkbox"
                                                checked={formData.groupIds.includes(group.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) handleInputChange('groupIds', [...formData.groupIds, group.id]);
                                                    else handleInputChange('groupIds', formData.groupIds.filter(id => id !== group.id));
                                                }}
                                                className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 mr-3"
                                            />
                                            <span className="font-bold text-gray-700">{group.name}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.groupIds && <span className="text-rose-600 text-xs font-bold mt-2 block">{errors.groupIds}</span>}
                            </motion.div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-6 border-t border-gray-100">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-lg hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 transition shadow-xl"
                        >
                            {loading ? 'Processing Deployment...' : 'Deploy Assessment Task'}
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return null;
};

export default TaskCreationForm;
