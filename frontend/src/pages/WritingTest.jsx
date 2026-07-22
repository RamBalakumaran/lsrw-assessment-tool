import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  PenTool,
  CheckCircle2,
  Send,
  AlertCircle
} from 'lucide-react';
import TopicSelection from '../components/TopicSelection';
import DetailedReport from '../components/DetailedReport';
import api from '../utils/api';
import FullscreenProctorGuard from '../components/FullscreenProctorGuard';
import SmartQuiz from '../components/SmartQuiz';

const WritingTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('topic');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300);

  const [topics, setTopics] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get('/tasks');
        const specificTasks = res.data.filter(t => {
          const comp = (t.lsrwComponent || t.type || '').toUpperCase();
          return comp === 'WRITING';
        });
        const formattedTasks = specificTasks.map((t, idx) => ({
          ...t,
          desc: t.description,
          prompt: t.passage,
          color: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][idx % 4]
        }));
        setTopics(formattedTasks);

        if (id) {
          const taskToAutoStart = formattedTasks.find(t => t.id === id);
          if (taskToAutoStart) {
            setSelectedTopic(taskToAutoStart);
            setPhase('intro');
          }
        }
      } catch (e) {
        console.error("Failed to fetch writing tasks:", e);
      }
    };
    fetchTasks();
  }, [id]);

  useEffect(() => {
    let timerId;
    if (phase === 'write' && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (phase === 'write' && timeLeft === 0) {
      handleSubmit();
    }
    return () => clearInterval(timerId);
  }, [phase, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSubmit = async () => {
    if (timeLeft > 0 && (!text || text.trim().split(/\s+/).length < 20)) {
      alert("Please write at least 20 words before submitting.");
      return;
    }

    setLoading(true);

    try {
      const topicPrompt = [
        selectedTopic?.prompt,
        selectedTopic?.instructions,
        selectedTopic?.desc
      ].filter(Boolean).join(" | ");

      const res = await api.post('/writing/analyze', {
        text: text,
        topic: topicPrompt,
        taskId: selectedTopic?.id
      });

      const data = res.data;
      if (data.error) throw new Error(data.error);

      setReportData({
        score: data.score,
        title: "Writing",
        metrics: [
          { label: "Word Count", value: text.trim().split(/\s+/).length },
          { label: "Time Taken", value: formatTime(300 - timeLeft) },
          { label: "Grammar Grade", value: data.criteria['Grammar Accuracy'] >= 90 ? 'A+' : data.criteria['Grammar Accuracy'] >= 70 ? 'B' : 'C' },
          { label: "Topic Lock", value: `${data.criteria['Task Fulfillment']}%` }
        ],
        criteria: {
          "Grammar Accuracy": data.criteria['Grammar Accuracy'],
          "Task Fulfillment": data.criteria['Task Fulfillment'],
          "Professional Tone": data.criteria['Professional Tone'],
          "Logical Coherence": data.criteria['Coherence & Logical Flow'],
          "Expression Clarity": data.criteria['Clarity of Expression']
        },
        mistakes: data.errors.map(e => ({
          type: "AI Detection",
          question: e.issue,
          userAnswer: e.word,
          correctAnswer: e.suggestion
        })),
        recommendations: [
          data.structure_feedback,
          data.criteria['Professional Tone'] < 70 ? "Your tone is slightly informal. Try replacing contractions and slang." : "Excellent professional tone maintained.",
          data.criteria['Task Fulfillment'] < 50 ? "Focus more on the specific core keywords of the prompt." : "Clear alignment with the assigned topic."
        ]
      });
      setPhase('report');

    } catch (e) {
      alert("Assessment System Offline: " + e.message);
    }
    setLoading(false);
  };

  const handleQuizComplete = (answers) => {
    let correct = 0;
    let mistakes = [];

    let criteria = {};
    (selectedTopic?.questions || []).forEach(q => {
      const type = q.type || q.questionType || "Grammar";
      criteria[type] = 0;
    });

    (selectedTopic?.questions || []).forEach(q => {
      const type = q.type || q.questionType || "Grammar";
      const userAns = answers[q.id];
      if (userAns === q.correctAnswer) {
        correct++;
        criteria[type] = 100;
      } else {
        mistakes.push({
          type: type,
          question: q.questionText || q.text,
          userAnswer: userAns || "Skipped",
          correctAnswer: q.correctAnswer
        });
      }
    });

    const score = Math.round((correct / (selectedTopic?.questions?.length || 1)) * 100);

    const reportDataObj = {
      score,
      title: "Grammar MCQ",
      metrics: [
        { label: "Total Questions", value: selectedTopic?.questions?.length || 0 },
        { label: "Correct Answers", value: correct },
        { label: "Accuracy Rate", value: `${score}%` }
      ],
      criteria,
      mistakes,
      recommendations: [
        score === 100 ? "Perfect accuracy in grammar correction." : "Review the grammatical rules for incorrect responses.",
        "Keep practicing with various grammar correction patterns."
      ]
    };

    setReportData(reportDataObj);
    setPhase('report');

    // Submit attempt to backend
    try {
      api.post('/attempts/submit', {
        taskId: selectedTopic?.id,
        studentAnswers: answers,
        score,
        aiResults: reportDataObj
      });
    } catch (e) {
      console.error("Failed to submit attempt", e);
    }
  };

  const handleExit = () => {
    if (id) {
      navigate('/student/dashboard');
    } else {
      setPhase('topic');
      setSelectedTopic(null);
    }
  };

  if (phase === 'topic') {
    return <TopicSelection title="Writing" topics={topics} onSelect={(t) => { setSelectedTopic(t); setPhase('intro'); }} onBack={() => navigate('/student/dashboard')} />;
  }

  if (phase === 'intro') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-10">
          <button
            onClick={() => {
              if (id) {
                navigate('/student/dashboard');
              } else {
                setPhase('topic');
                setSelectedTopic(null);
              }
            }}
            className="flex items-center text-gray-500 hover:text-primary-600 transition font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft className="mr-2" size={16} /> Choose Topic
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="p-12 text-center md:text-left">
            <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-3xl flex items-center justify-center mx-auto md:mx-0 mb-8 border border-primary-100">
              <PenTool size={40} />
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">{selectedTopic.title}</h2>
            
            {selectedTopic.desc && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Instructions</h3>
                <p className="text-gray-600 text-lg font-medium leading-relaxed whitespace-pre-line">
                  {selectedTopic.desc}
                </p>
              </div>
            )}

            {selectedTopic.prompt && (
              <div className="mb-10 bg-gray-50 p-8 rounded-[2rem] border border-gray-100 text-left">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Prompt / Passage</h3>
                <div className="text-gray-800 font-medium text-lg leading-relaxed whitespace-pre-line max-h-[300px] overflow-y-auto pr-4">
                  {selectedTopic.prompt}
                </div>
              </div>
            )}

            {/* Proctoring guidelines */}
            <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-3">
              <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider">Assessment Rules</h4>
              <ul className="text-slate-650 text-sm font-medium space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                  This assessment must be taken in <strong>Fullscreen Mode</strong>.
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                  Switching tabs or minimizing the browser window is strictly prohibited.
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                  Exiting fullscreen will block and pause your progress.
                </li>
              </ul>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
               <button
                 onClick={() => {
                   if (selectedTopic.questions && selectedTopic.questions.length > 0) {
                     setPhase('quiz');
                   } else {
                     setPhase('write');
                     setTimeLeft(selectedTopic.timeLimit || 300); // Reset timer to limit
                   }
                 }}
                 className="px-12 py-5 bg-gray-900 text-white rounded-2xl font-black text-xl hover:bg-black transition transform hover:-translate-y-1 active:scale-95 flex items-center shadow-xl shadow-gray-900/20"
               >
                 Start Assessment <ArrowRight className="ml-3 h-5 w-5" />
               </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'quiz') {
    return (
      <FullscreenProctorGuard
        title={selectedTopic?.title}
        onExit={handleExit}
      >
        <SmartQuiz questions={selectedTopic.questions} onComplete={handleQuizComplete} />
      </FullscreenProctorGuard>
    );
  }

  if (phase === 'write') {
    return (
      <FullscreenProctorGuard
        title={selectedTopic?.title}
        onExit={handleExit}
      >
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Header Navigation */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => setPhase('topic')}
              className="flex items-center text-gray-400 hover:text-primary-600 transition font-bold uppercase tracking-widest text-xs"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Change Prompt
            </button>

            <div className={`flex items-center space-x-3 px-6 py-3 rounded-2xl font-black text-xl shadow-lg border ${timeLeft < 60 ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' : 'bg-white text-gray-900 border-gray-100'
              }`}>
              <Clock size={24} className={timeLeft < 60 ? 'text-rose-500' : 'text-primary-500'} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Sidebar / Prompt info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm border-l-8 border-l-primary-500">
                <div className="flex items-center space-x-3 mb-4">
                  <PenTool className="text-primary-500" size={20} />
                  <span className="font-bold text-gray-400 text-xs uppercase tracking-widest">Active Prompt</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 leading-tight">{selectedTopic.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium whitespace-pre-line">{selectedTopic.desc}</p>
              </div>

              <div className="bg-indigo-900 p-8 rounded-[2rem] text-white overflow-hidden relative shadow-xl shadow-indigo-900/20">
                <h4 className="font-black text-lg mb-4 flex items-center">
                  <CheckCircle2 className="mr-2 text-indigo-400" size={20} />
                  Tips for High Score
                </h4>
                <ul className="space-y-3 text-indigo-200 text-sm font-medium relative z-10">
                  <li>• Use academic vocabulary</li>
                  <li>• Connect ideas with transitions</li>
                  <li>• Maintain formal writing style</li>
                  <li>• Stay focused on the prompt</li>
                </ul>
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              </div>
            </div>

            {/* Main Editor */}
            <div className="lg:col-span-2 flex flex-col space-y-6">
              {selectedTopic.prompt && (
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                  <h4 className="font-black text-gray-955 text-sm mb-3 uppercase tracking-wider">Passage / Story</h4>
                  <div className="text-gray-700 leading-relaxed font-medium whitespace-pre-line text-base max-h-[280px] overflow-y-auto pr-4">
                    {selectedTopic.prompt}
                  </div>
                </div>
              )}

              <div className="flex flex-col h-[520px] bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden focus-within:ring-4 focus-within:ring-primary-100 focus-within:border-transparent transition-all duration-200">
                <textarea
                  className="flex-grow p-10 outline-none border-none resize-none text-xl text-gray-800 leading-relaxed font-medium placeholder:text-gray-300 w-full overflow-y-auto"
                  placeholder="Begin composing your response here..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  disabled={loading}
                />

                <div className="bg-gray-50/50 border-t border-gray-100 px-8 py-5 flex justify-between items-center z-10">
                  <div className="px-4 py-2.5 bg-white rounded-xl text-xs font-black text-gray-500 border border-gray-100 shadow-sm uppercase tracking-wider">
                    {text.trim().split(/\s+/).filter(w => w).length} Words
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || text.length < 10}
                    className={`flex items-center px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all transform active:scale-[0.98] ${loading || text.length < 10
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200/50'
                      : 'bg-gray-900 text-white hover:bg-black hover:shadow-lg shadow-gray-900/10'
                      }`}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Analyzing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Submit Response <Send size={16} className="ml-2.5" />
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {text.length > 0 && text.length < 50 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex items-center space-x-2 text-rose-500 bg-rose-50 px-6 py-4 rounded-2xl border border-rose-100 font-bold"
                >
                  <AlertCircle size={20} />
                  <span>Response is too short for comprehensive AI analysis.</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </FullscreenProctorGuard>
    );
  }

  return (
    <DetailedReport
      {...reportData}
      title="Writing"
      onRetry={() => {
        if (id) {
          navigate('/writing');
        } else {
          setPhase('topic');
          setReportData(null);
          setText("");
          setTimeLeft(300);
        }
      }}
      onHome={() => navigate('/student/dashboard')}
    />
  );
};

export default WritingTest;