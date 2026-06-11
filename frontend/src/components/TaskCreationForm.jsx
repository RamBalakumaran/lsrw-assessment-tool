import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, X, Plus, Trash2, ChevronDown } from 'lucide-react';
import api from '../utils/api';

// Task subtype configurations
const TASK_CONFIG = {
    LISTENING: {
        icon: '🎧',
        subtypes: {
            MCQ_AUDIO: { label: 'Multiple Choice from Audio', fields: ['audioUrl', 'questions'] },
            FILL_BLANKS_AUDIO: { label: 'Fill Blanks from Audio', fields: ['audioUrl', 'questions'] },
            NOTE_TAKING: { label: 'Note-Taking from Lecture', fields: ['audioUrl', 'instructions'] },
            LISTENING_GIST: { label: 'Listening for Main Idea', fields: ['audioUrl', 'questions'] },
            LISTENING_DETAILS: { label: 'Listening for Specific Details', fields: ['audioUrl', 'questions'] },
            DICTATION: { label: 'Dictation Exercise', fields: ['audioUrl', 'questions'] },
            MATCHING_AUDIO: { label: 'Matching Audio to Responses', fields: ['audioUrl', 'questions'] }
        }
    },
    SPEAKING: {
        icon: '🗣️',
        subtypes: {
            SELF_INTRODUCTION: { label: 'Self-Introduction', fields: ['instructions', 'timeLimit', 'evaluationRubric'] },
            PICTURE_DESCRIPTION: { label: 'Picture Description', fields: ['instructions', 'timeLimit', 'evaluationRubric'] },
            READ_ALOUD: { label: 'Read Aloud Passage', fields: ['passage', 'timeLimit', 'evaluationRubric'] },
            ANSWER_QUESTIONS: { label: 'Answer Questions', fields: ['instructions', 'timeLimit', 'evaluationRubric'] },
            REPEAT_SENTENCES: { label: 'Repeat Sentences', fields: ['audioUrl', 'evaluationRubric'] }
        }
    },
    READING: {
        icon: '📖',
        subtypes: {
            COMPREHENSION_MCQ: { label: 'Reading Comprehension (MCQ)', fields: ['passage', 'questions'] },
            TRUE_FALSE: { label: 'True/False Questions', fields: ['passage', 'questions'] },
            FILL_BLANKS: { label: 'Fill in the Blanks', fields: ['passage', 'questions'] },
            MATCHING_HEADINGS: { label: 'Matching Headings', fields: ['passage', 'questions'] },
            SKIMMING: { label: 'Skimming (Main Idea)', fields: ['passage', 'instructions', 'questions'] },
            SCANNING: { label: 'Scanning (Specific Info)', fields: ['passage', 'instructions', 'questions'] },
            VOCABULARY: { label: 'Vocabulary from Context', fields: ['passage', 'questions'] }
        }
    },
    WRITING: {
        icon: '✍️',
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
    { value: 'ORGANIZATION', label: 'Organization-Wide', description: 'All students in the organization' },
    { value: 'DEPARTMENT', label: 'Department-Specific', description: 'Selected departments only' },
    { value: 'GROUP', label: 'Group-Specific', description: 'Selected groups only' }
];

const TaskCreationForm = ({ onTaskCreated, userRole, userId }) => {
    const [step, setStep] = useState(1);
    const [taskType, setTaskType] = useState(null);
    const [subType, setSubType] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficulty: 'INTERMEDIATE',
        visibilityScope: 'ORGANIZATION',
        departmentIds: [],
        groupIds: [],
        audioUrl: '',
        passage: '',
        instructions: '',
        timeLimit: 120,
        questions: [],
        passingScore: 60,
        showAnswers: false,
        evaluationRubric: null
    });

    const [departments, setDepartments] = useState([]);
    const [groups, setGroups] = useState([]);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch departments and groups on mount
    useEffect(() => {
        fetchDepartmentsAndGroups();
    }, []);

    const fetchDepartmentsAndGroups = async () => {
        try {
            if (userRole !== 'STUDENT') {
                const deptRes = await api.get('/admin/departments');
                setDepartments(deptRes.data || []);
            }
            const groupRes = await api.get('/api/groups');
            setGroups(groupRes.data || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        }
    };

    const handleTaskTypeSelect = (type) => {
        setTaskType(type);
        setSubType(null);
        setStep(2);
    };

    const handleSubTypeSelect = (sub) => {
        setSubType(sub);
        setStep(3);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const handleQuestionAdd = () => {
        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, {
                questionText: '',
                options: ['', '', '', ''],
                correctAnswer: 'A',
                questionType: 'MCQ'
            }]
        }));
    };

    const handleQuestionUpdate = (index, field, value) => {
        const newQuestions = [...formData.questions];
        newQuestions[index][field] = value;
        setFormData(prev => ({
            ...prev,
            questions: newQuestions
        }));
    };

    const handleQuestionRemove = (index) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!taskType) newErrors.taskType = 'Task type is required';
        if (!subType) newErrors.subType = 'Task subtype is required';
        if (!formData.visibilityScope) newErrors.visibilityScope = 'Visibility scope is required';

        // Check required fields based on subtype
        const config = TASK_CONFIG[taskType]?.subtypes[subType];
        if (config) {
            if (config.fields.includes('audioUrl') && !formData.audioUrl.trim()) {
                newErrors.audioUrl = 'Audio URL is required for this task';
            }
            if (config.fields.includes('passage') && !formData.passage.trim()) {
                newErrors.passage = 'Passage is required for this task';
            }
            if (config.fields.includes('instructions') && !formData.instructions.trim()) {
                newErrors.instructions = 'Instructions are required for this task';
            }
        }

        // Validate visibility scope selections
        if (formData.visibilityScope === 'DEPARTMENT' && formData.departmentIds.length === 0) {
            newErrors.departmentIds = 'Select at least one department';
        }
        if (formData.visibilityScope === 'GROUP' && formData.groupIds.length === 0) {
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
                type: taskType,
                subType: subType
            };

            const response = await api.post('/api/tasks', payload);
            setSuccess(true);
            
            // Reset form
            setTimeout(() => {
                setTaskType(null);
                setSubType(null);
                setStep(1);
                setFormData({
                    title: '',
                    description: '',
                    difficulty: 'INTERMEDIATE',
                    visibilityScope: 'ORGANIZATION',
                    departmentIds: [],
                    groupIds: [],
                    audioUrl: '',
                    passage: '',
                    instructions: '',
                    timeLimit: 120,
                    questions: [],
                    passingScore: 60,
                    showAnswers: false,
                    evaluationRubric: null
                });
                setSuccess(false);
                if (onTaskCreated) onTaskCreated(response.data);
            }, 2000);
        } catch (error) {
            setErrors({
                submit: error.response?.data?.error || 'Failed to create task'
            });
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Task Type Selection
    if (step === 1) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-6">Create New Assessment Task</h2>
                <p className="text-gray-600 mb-8">Select the type of assessment task you want to create:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(TASK_CONFIG).map(([type, config]) => (
                        <button
                            key={type}
                            onClick={() => handleTaskTypeSelect(type)}
                            className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                        >
                            <div className="text-4xl mb-2">{config.icon}</div>
                            <div className="font-bold text-lg">{type}</div>
                            <div className="text-sm text-gray-600">Click to continue</div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Step 2: Subtype Selection
    if (step === 2 && taskType) {
        const subtypes = TASK_CONFIG[taskType].subtypes;
        return (
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
                <button onClick={() => setStep(1)} className="mb-4 text-blue-600 hover:underline">
                    ← Back
                </button>
                <h2 className="text-2xl font-bold mb-6">{TASK_CONFIG[taskType].icon} {taskType} - Select Subtype</h2>
                
                <div className="space-y-2">
                    {Object.entries(subtypes).map(([subtype, config]) => (
                        <button
                            key={subtype}
                            onClick={() => handleSubTypeSelect(subtype)}
                            className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                        >
                            <div className="font-semibold">{config.label}</div>
                            <div className="text-sm text-gray-600">Required fields: {config.fields.join(', ')}</div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Step 3: Task Details Form
    if (step === 3 && taskType && subType) {
        const config = TASK_CONFIG[taskType].subtypes[subType];
        
        return (
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
                <button onClick={() => setStep(2)} className="mb-4 text-blue-600 hover:underline">
                    ← Back
                </button>
                <h2 className="text-2xl font-bold mb-6">Create {taskType} - {config.label}</h2>

                {errors.submit && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
                        <AlertCircle className="mr-2" />
                        {errors.submit}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
                        <CheckCircle2 className="mr-2" />
                        Task created successfully!
                    </div>
                )}

                <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                        <label className="block font-semibold mb-2">Task Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="e.g., English Grammar Basics"
                            className={`w-full p-2 border rounded ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.title && <span className="text-red-600 text-sm">{errors.title}</span>}
                    </div>

                    <div>
                        <label className="block font-semibold mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Additional instructions or context..."
                            rows="3"
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>

                    {/* Difficulty and Time Limit */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold mb-2">Difficulty</label>
                            <select
                                value={formData.difficulty}
                                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option>BEGINNER</option>
                                <option>INTERMEDIATE</option>
                                <option>ADVANCED</option>
                            </select>
                        </div>

                        {config.fields.includes('timeLimit') && (
                            <div>
                                <label className="block font-semibold mb-2">Time Limit (seconds)</label>
                                <input
                                    type="number"
                                    value={formData.timeLimit}
                                    onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value))}
                                    className="w-full p-2 border border-gray-300 rounded"
                                />
                            </div>
                        )}
                    </div>

                    {/* Conditional Fields */}
                    {config.fields.includes('audioUrl') && (
                        <div>
                            <label className="block font-semibold mb-2">Audio URL *</label>
                            <input
                                type="url"
                                value={formData.audioUrl}
                                onChange={(e) => handleInputChange('audioUrl', e.target.value)}
                                placeholder="https://example.com/audio.mp3"
                                className={`w-full p-2 border rounded ${errors.audioUrl ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.audioUrl && <span className="text-red-600 text-sm">{errors.audioUrl}</span>}
                        </div>
                    )}

                    {config.fields.includes('passage') && (
                        <div>
                            <label className="block font-semibold mb-2">Passage *</label>
                            <textarea
                                value={formData.passage}
                                onChange={(e) => handleInputChange('passage', e.target.value)}
                                placeholder="Enter the passage text..."
                                rows="6"
                                className={`w-full p-2 border rounded ${errors.passage ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.passage && <span className="text-red-600 text-sm">{errors.passage}</span>}
                        </div>
                    )}

                    {config.fields.includes('instructions') && (
                        <div>
                            <label className="block font-semibold mb-2">Instructions *</label>
                            <textarea
                                value={formData.instructions}
                                onChange={(e) => handleInputChange('instructions', e.target.value)}
                                placeholder="Provide clear instructions for the task..."
                                rows="4"
                                className={`w-full p-2 border rounded ${errors.instructions ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.instructions && <span className="text-red-600 text-sm">{errors.instructions}</span>}
                        </div>
                    )}

                    {config.fields.includes('evaluationRubric') && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-sm">Evaluation Rubric will be configured during advanced settings</p>
                        </div>
                    )}

                    {/* Questions */}
                    {config.fields.includes('questions') && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="block font-semibold">Questions</label>
                                <button
                                    onClick={handleQuestionAdd}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center"
                                >
                                    <Plus size={16} className="mr-1" /> Add Question
                                </button>
                            </div>
                            
                            {formData.questions.map((q, idx) => (
                                <div key={idx} className="mb-4 p-4 border border-gray-200 rounded">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold">Question {idx + 1}</span>
                                        <button
                                            onClick={() => handleQuestionRemove(idx)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <textarea
                                        value={q.questionText}
                                        onChange={(e) => handleQuestionUpdate(idx, 'questionText', e.target.value)}
                                        placeholder="Question text..."
                                        rows="2"
                                        className="w-full p-2 border border-gray-300 rounded mb-2"
                                    />

                                    <label className="block text-sm font-semibold mb-1">Options</label>
                                    {q.options.map((opt, optIdx) => (
                                        <input
                                            key={optIdx}
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                                const newOptions = [...q.options];
                                                newOptions[optIdx] = e.target.value;
                                                handleQuestionUpdate(idx, 'options', newOptions);
                                            }}
                                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                            className="w-full p-2 border border-gray-300 rounded mb-1"
                                        />
                                    ))}

                                    <select
                                        value={q.correctAnswer}
                                        onChange={(e) => handleQuestionUpdate(idx, 'correctAnswer', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded mt-2"
                                    >
                                        <option value="A">Correct Answer: A</option>
                                        <option value="B">Correct Answer: B</option>
                                        <option value="C">Correct Answer: C</option>
                                        <option value="D">Correct Answer: D</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Visibility Scope */}
                    <div>
                        <label className="block font-semibold mb-2">Visibility Scope *</label>
                        <div className="space-y-2">
                            {VISIBILITY_SCOPES.map(scope => (
                                <label key={scope.value} className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value={scope.value}
                                        checked={formData.visibilityScope === scope.value}
                                        onChange={(e) => handleInputChange('visibilityScope', e.target.value)}
                                        className="mr-3"
                                    />
                                    <div>
                                        <div className="font-semibold">{scope.label}</div>
                                        <div className="text-sm text-gray-600">{scope.description}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        {errors.visibilityScope && <span className="text-red-600 text-sm">{errors.visibilityScope}</span>}
                    </div>

                    {/* Department Selection */}
                    {formData.visibilityScope === 'DEPARTMENT' && (
                        <div>
                            <label className="block font-semibold mb-2">Select Departments *</label>
                            <div className="space-y-2">
                                {departments.map(dept => (
                                    <label key={dept.id} className="flex items-center p-2 border rounded">
                                        <input
                                            type="checkbox"
                                            checked={formData.departmentIds.includes(dept.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    handleInputChange('departmentIds', [...formData.departmentIds, dept.id]);
                                                } else {
                                                    handleInputChange('departmentIds', formData.departmentIds.filter(id => id !== dept.id));
                                                }
                                            }}
                                            className="mr-2"
                                        />
                                        <span>{dept.name}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.departmentIds && <span className="text-red-600 text-sm">{errors.departmentIds}</span>}
                        </div>
                    )}

                    {/* Group Selection */}
                    {formData.visibilityScope === 'GROUP' && (
                        <div>
                            <label className="block font-semibold mb-2">Select Groups *</label>
                            <div className="space-y-2">
                                {groups.map(group => (
                                    <label key={group.id} className="flex items-center p-2 border rounded">
                                        <input
                                            type="checkbox"
                                            checked={formData.groupIds.includes(group.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    handleInputChange('groupIds', [...formData.groupIds, group.id]);
                                                } else {
                                                    handleInputChange('groupIds', formData.groupIds.filter(id => id !== group.id));
                                                }
                                            }}
                                            className="mr-2"
                                        />
                                        <div>
                                            <span className="font-semibold">{group.name}</span>
                                            <span className="text-sm text-gray-600 ml-2">({group.members.length} members)</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {errors.groupIds && <span className="text-red-600 text-sm">{errors.groupIds}</span>}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6">
                        <button
                            onClick={() => setStep(2)}
                            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default TaskCreationForm;
