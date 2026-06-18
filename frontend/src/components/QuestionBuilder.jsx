import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUESTION_TYPES = [
    { value: 'MCQ', label: 'Multiple Choice (Single Answer)' },
    { value: 'CHECKBOX', label: 'Checkboxes (Multiple Answers)' },
    { value: 'TRUE_FALSE', label: 'True / False' },
    { value: 'FILL_BLANKS', label: 'Fill in the Blanks' }
];

const QuestionBuilder = ({ questions, onChange }) => {
    
    const addQuestion = () => {
        const newQuestion = {
            id: `q_${Date.now()}`,
            type: 'MCQ',
            text: '',
            options: ['Option 1', 'Option 2'],
            correctAnswer: 'Option 1',
            correctAnswers: [],
            points: 1
        };
        onChange([...questions, newQuestion]);
    };

    const updateQuestion = (index, field, value) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        
        // Reset answers when type changes
        if (field === 'type') {
            if (value === 'TRUE_FALSE') {
                updated[index].options = ['True', 'False'];
                updated[index].correctAnswer = 'True';
            } else if (value === 'MCQ') {
                updated[index].options = ['Option 1', 'Option 2'];
                updated[index].correctAnswer = 'Option 1';
            } else if (value === 'CHECKBOX') {
                updated[index].options = ['Option 1', 'Option 2'];
                updated[index].correctAnswers = [];
            } else if (value === 'FILL_BLANKS') {
                updated[index].options = [];
                updated[index].correctAnswer = '';
            }
        }
        
        onChange(updated);
    };

    const removeQuestion = (index) => {
        const updated = questions.filter((_, i) => i !== index);
        onChange(updated);
    };

    // Option Management
    const addOption = (qIndex) => {
        const updated = [...questions];
        const q = updated[qIndex];
        q.options.push(`Option ${q.options.length + 1}`);
        onChange(updated);
    };

    const updateOption = (qIndex, optIndex, newValue) => {
        const updated = [...questions];
        const q = updated[qIndex];
        const oldVal = q.options[optIndex];
        q.options[optIndex] = newValue;
        
        // Update correct answer bindings if they match the old value
        if (q.type === 'MCQ' && q.correctAnswer === oldVal) {
            q.correctAnswer = newValue;
        }
        if (q.type === 'CHECKBOX' && q.correctAnswers.includes(oldVal)) {
            q.correctAnswers = q.correctAnswers.map(ans => ans === oldVal ? newValue : ans);
        }
        
        onChange(updated);
    };

    const removeOption = (qIndex, optIndex) => {
        const updated = [...questions];
        const q = updated[qIndex];
        const removedVal = q.options[optIndex];
        q.options = q.options.filter((_, i) => i !== optIndex);
        
        if (q.type === 'MCQ' && q.correctAnswer === removedVal) {
            q.correctAnswer = q.options[0] || '';
        }
        if (q.type === 'CHECKBOX') {
            q.correctAnswers = q.correctAnswers.filter(ans => ans !== removedVal);
        }
        
        onChange(updated);
    };

    const renderQuestionInputs = (q, index) => {
        switch (q.type) {
            case 'MCQ':
                return (
                    <div className="space-y-3 mt-4">
                        {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-3">
                                <input
                                    type="radio"
                                    name={`mcq_${q.id}`}
                                    checked={q.correctAnswer === opt}
                                    onChange={() => updateQuestion(index, 'correctAnswer', opt)}
                                    className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500 cursor-pointer"
                                    title="Mark as correct answer"
                                />
                                <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                    className={`flex-1 px-4 py-2 border rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary-100 ${q.correctAnswer === opt ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200'}`}
                                    placeholder="Enter option text"
                                />
                                {q.options.length > 2 && (
                                    <button onClick={() => removeOption(index, optIndex)} className="p-2 text-gray-400 hover:text-rose-500 transition">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button onClick={() => addOption(index)} className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center mt-2">
                            <Plus size={16} className="mr-1" /> Add Option
                        </button>
                    </div>
                );
            case 'CHECKBOX':
                return (
                    <div className="space-y-3 mt-4">
                        {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={q.correctAnswers.includes(opt)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            updateQuestion(index, 'correctAnswers', [...q.correctAnswers, opt]);
                                        } else {
                                            updateQuestion(index, 'correctAnswers', q.correctAnswers.filter(ans => ans !== opt));
                                        }
                                    }}
                                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                    className={`flex-1 px-4 py-2 border rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary-100 ${q.correctAnswers.includes(opt) ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200'}`}
                                    placeholder="Enter option text"
                                />
                                {q.options.length > 2 && (
                                    <button onClick={() => removeOption(index, optIndex)} className="p-2 text-gray-400 hover:text-rose-500 transition">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button onClick={() => addOption(index)} className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center mt-2">
                            <Plus size={16} className="mr-1" /> Add Option
                        </button>
                    </div>
                );
            case 'TRUE_FALSE':
                return (
                    <div className="flex gap-4 mt-4">
                        {['True', 'False'].map(val => (
                            <label key={val} className={`flex-1 flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition ${q.correctAnswer === val ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name={`tf_${q.id}`}
                                    checked={q.correctAnswer === val}
                                    onChange={() => updateQuestion(index, 'correctAnswer', val)}
                                    className="hidden"
                                />
                                {q.correctAnswer === val && <CheckCircle2 size={18} className="text-primary-600" />}
                                <span className="font-bold">{val}</span>
                            </label>
                        ))}
                    </div>
                );
            case 'FILL_BLANKS':
                return (
                    <div className="mt-4">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Correct Answer(s)</label>
                        <input
                            type="text"
                            value={q.correctAnswer}
                            onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-100 transition"
                            placeholder="Exact text or comma-separated for multiple acceptable answers"
                        />
                        <p className="text-xs text-gray-400 mt-2 font-medium">Use <code className="bg-gray-100 px-1 rounded">___</code> in the question text to indicate where the blank is.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-black text-gray-900">Assessment Questions</h3>
                    <p className="text-gray-500 font-medium text-sm">Add dynamic questions for this task.</p>
                </div>
                <button
                    onClick={(e) => { e.preventDefault(); addQuestion(); }}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm flex items-center gap-2 text-sm"
                >
                    <Plus size={16} /> Add Question
                </button>
            </div>

            <div className="space-y-6">
                <AnimatePresence>
                    {questions.map((q, index) => (
                        <motion.div
                            key={q.id}
                            initial={{ opacity: 0, height: 0, y: -20 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm relative overflow-hidden"
                        >
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-4 pb-4 border-b border-gray-100">
                                <div className="bg-gray-100 text-gray-500 font-black px-3 py-1 rounded-lg text-sm">Q{index + 1}</div>
                                
                                <div className="flex-1 flex flex-wrap gap-4 w-full">
                                    <div className="flex-1 min-w-[200px]">
                                        <select
                                            value={q.type}
                                            onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-100"
                                        >
                                            {QUESTION_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-32">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={q.points}
                                                onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value) || 0)}
                                                className="w-full pl-4 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-100"
                                                min="1"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Pts</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => { e.preventDefault(); removeQuestion(index); }}
                                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition absolute top-4 right-4 md:static"
                                    title="Delete Question"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Question Text *</label>
                                    <textarea
                                        value={q.text}
                                        onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                                        placeholder="Enter the question prompt..."
                                        rows="2"
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-medium focus:outline-none focus:ring-4 focus:ring-primary-100 transition resize-none"
                                    />
                                </div>
                                
                                {renderQuestionInputs(q, index)}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {questions.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-500 font-medium mb-2">No questions added yet.</p>
                        <p className="text-gray-400 text-sm">Click "Add Question" to start building your assessment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionBuilder;
