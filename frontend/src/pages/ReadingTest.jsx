import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ArrowLeft,
  CheckCircle,
  TrendingUp,
  Zap,
  Clock,
  BookOpenCheck
} from 'lucide-react';
import TopicSelection from '../components/TopicSelection';
import SmartQuiz from '../components/SmartQuiz';
import DetailedReport from '../components/DetailedReport';
import api from '../utils/api';

const ReadingTest = () => {
  const [phase, setPhase] = useState('topic');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [report, setReport] = useState(null);
  const [readStartTime, setReadStartTime] = useState(0);
  const [readTime, setReadTime] = useState(0);

  const defaultTopics = [
    {
      id: "1", title: "Technology", desc: "Foundations of Cloud Computing and Architectural Models.", color: '#3b82f6',
      passage: "Cloud computing provides on-demand computing resources over the internet, essentially shifting local infrastructure to remote data centers. It offers three primary service models: Infrastructure as a Service (IaaS), Platform as a Service (PaaS), and Software as a Service (SaaS). Each model provides different levels of control and flexibility, allowing businesses to scale resources dynamically without maintaining physical hardware.",
      questions: [
        { id: "q1", type: "Main Idea", text: "What is the primary function of cloud computing according to the passage?", opts: ["Local machine backup", "On-demand internet resources", "Social Media hosting"], correctAnswer: "On-demand internet resources", time: 20 },
        { id: "q2", type: "Terminology", text: "What does the 'S' in SaaS represent?", opts: ["Software", "System", "Speed"], correctAnswer: "Software", time: 15 }
      ]
    },
    {
      id: "2", title: "Business Strategy", desc: "Understanding the Blue Ocean market strategy.", color: '#d946ef',
      passage: "Blue Ocean Strategy involves creating entirely new market space (the 'Blue Ocean') rather than competing in existing crowded industries (the 'Red Ocean'). This strategic move makes the competition irrelevant by delivering a leap in value for both the company and its customers. It focuses on innovation and cost-effective value creation to unlock new demand.",
      questions: [
        { id: "q1", type: "Strategic Goal", text: "What is the central goal of the Blue Ocean Strategy?", opts: ["Aggressive pricing", "New market creation", "Acquiring competitors"], correctAnswer: "New market creation", time: 20 },
        { id: "q2", type: "Competitive Logic", text: "Under this strategy, what happens to existing rivals?", opts: ["They become more powerful", "They become irrelevant", "They merge together"], correctAnswer: "Becomes irrelevant", time: 15 }
      ]
    }
  ];

  const [topics, setTopics] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get('/tasks');
        const data = res.data.filter(t => t.type === 'READING');
        setTopics(data.map((t, idx) => ({
          ...t,
          desc: t.description,
          questions: t.questions && t.questions.length > 0 ? t.questions : defaultTopics[idx % defaultTopics.length].questions,
          color: ['#3b82f6', '#d946ef', '#10b981', '#f59e0b'][idx % 4]
        })));
      } catch (e) {
        console.error("Failed to fetch reading tasks:", e);
      }
    };
    fetchTasks();
  }, []);

  const startReading = () => {
    setPhase('read');
    setReadStartTime(Date.now());
  };

  const finishReading = () => {
    setReadTime((Date.now() - readStartTime) / 1000);
    setPhase('quiz');
  };

  const handleComplete = (answers) => {
    let correct = 0;
    let mistakes = [];

    let criteria = {};
    selectedTopic.questions.forEach(q => criteria[q.type] = 0);

    selectedTopic.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
        criteria[q.type] = 100;
      } else {
        mistakes.push({
          type: q.type,
          question: q.text,
          userAnswer: answers[q.id] || "Skipped",
          correctAnswer: q.correctAnswer
        });
      }
    });

    const score = Math.round((correct / selectedTopic.questions.length) * 100);
    const wordCount = selectedTopic.passage.split(/\s+/).length;
    const wpm = Math.round((wordCount / (readTime / 60)) || 0);

    const reportData = {
      score,
      title: "Reading",
      metrics: [
        { label: "Reading Tempo", value: `${wpm} WPM` },
        { label: "Immersion Time", value: `${Math.round(readTime)}s` },
        { label: "Comprehension", value: `${score}%` },
        { label: "Word Density", value: wordCount }
      ],
      criteria,
      mistakes,
      recommendations: [
        wpm < 150 ? "Focus on scanning blocks of text rather than single words." : "Exceptional reading velocity.",
        score < 100 ? "Refer back to the text to verify specific technical details." : "Perfect comprehension of complex passages."
      ]
    };

    setReport(reportData);
    setPhase('report');

    // Submit attempt to backend
    try {
      api.post('/attempts/submit', {
        taskId: selectedTopic?.id,
        studentAnswers: answers,
        score,
        aiResults: reportData
      });
    } catch (e) {
      console.error("Failed to submit attempt", e);
    }
  };

  if (phase === 'topic') {
    return <TopicSelection title="Reading" topics={topics} onSelect={(t) => { setSelectedTopic(t); startReading() }} onBack={() => window.location.href = '/dashboard'} />;
  }

  if (phase === 'read') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-10">
          <button
            onClick={() => setPhase('topic')}
            className="flex items-center text-gray-500 hover:text-primary-600 transition font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft className="mr-2" size={16} /> Choose Topic
          </button>
          <div className="flex items-center space-x-2 text-primary-600 font-bold bg-primary-50 px-4 py-2 rounded-xl text-sm border border-primary-100">
            <Clock size={16} />
            <span>Timer Active</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="p-12 md:p-16">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpenCheck size={20} />
              </div>
              <span className="font-black text-gray-400 text-xs uppercase tracking-widest">Passage Analysis</span>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-6">{selectedTopic.title}</h2>

            <div className="text-xl text-gray-800 leading-relaxed font-medium mb-12 space-y-4">
              {selectedTopic.passage}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-gray-100">
              <div className="flex items-center space-x-6">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase">Estimated Length</span>
                  <span className="text-lg font-black text-gray-900">{selectedTopic.passage.split(' ').length} Words</span>
                </div>
                <div className="h-8 w-px bg-gray-100"></div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase">Difficulty</span>
                  <span className="text-lg font-black text-gray-900">Intermediate</span>
                </div>
              </div>

              <button
                onClick={finishReading}
                className="px-12 py-5 bg-gray-900 text-white rounded-2xl font-black text-xl hover:bg-black transition transform active:scale-[0.98] shadow-xl shadow-gray-900/20 flex items-center"
              >
                Success, I've Finished <Zap className="ml-3 h-5 w-5 fill-current text-amber-400" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'quiz') return <SmartQuiz questions={selectedTopic.questions} onComplete={handleComplete} />;

  return (
    <DetailedReport
      {...report}
      title="Reading"
      onRetry={() => {
        setPhase('topic');
        setReport(null);
      }}
      onHome={() => window.location.href = '/dashboard'}
    />
  );
};

export default ReadingTest;