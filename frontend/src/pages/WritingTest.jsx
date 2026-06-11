import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  ArrowLeft,
  ChevronRight,
  PenTool,
  CheckCircle2,
  Send,
  AlertCircle
} from 'lucide-react';
import TopicSelection from '../components/TopicSelection';
import DetailedReport from '../components/DetailedReport';
import api from '../utils/api';

const WritingTest = () => {
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
        const specificTasks = res.data.filter(t => t.type === 'WRITING');
        setTopics(specificTasks.map((t, idx) => ({
          ...t,
          desc: t.description,
          prompt: t.passage,
          color: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][idx % 4]
        })));
      } catch (e) {
        console.error("Failed to fetch writing tasks:", e);
      }
    };
    fetchTasks();
  }, []);

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
      const topicPrompt = selectedTopic?.prompt || "General";

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

  if (phase === 'topic') {
    return <TopicSelection title="Writing" topics={topics} onSelect={(t) => { setSelectedTopic(t); setPhase('write'); }} onBack={() => window.location.href = '/dashboard'} />;
  }

  if (phase === 'write') {
    return (
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
              <p className="text-gray-600 leading-relaxed font-medium">{selectedTopic.desc}</p>
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
          <div className="lg:col-span-2 flex flex-col h-full">
            <div className="relative flex-grow flex flex-col">
              <textarea
                className="w-full h-[500px] p-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm text-xl text-gray-800 leading-relaxed font-medium focus:outline-none focus:ring-4 focus:ring-primary-100 transition resize-none placeholder:text-gray-200"
                placeholder="Begin composing your response here..."
                value={text}
                onChange={e => setText(e.target.value)}
                disabled={loading}
              />

              <div className="absolute bottom-10 right-10 flex space-x-4 items-center">
                <div className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-400 border border-gray-100">
                  {text.trim().split(/\s+/).filter(w => w).length} Words
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading || text.length < 10}
                  className={`flex items-center px-10 py-5 rounded-2xl font-black text-lg transition transform active:scale-[0.98] shadow-2xl h-full ${loading || text.length < 10
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-black shadow-gray-900/20'
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Analyzing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Submit Response <Send size={20} className="ml-3" />
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
    );
  }

  return (
    <DetailedReport
      {...reportData}
      transcript={text}
      onRetry={() => {
        setPhase('topic');
        setReportData(null);
        setText("");
        setTimeLeft(300);
      }}
      onHome={() => window.location.href = '/dashboard'}
    />
  );
};

export default WritingTest;