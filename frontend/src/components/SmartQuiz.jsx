import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, ArrowRight, CheckCircle2 } from 'lucide-react';

const SmartQuiz = ({ questions, onComplete }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questions[0].time || 30);
  const [answers, setAnswers] = useState({});

  useEffect(() => { setTimeLeft(questions[currentQ].time || 30); }, [currentQ, questions]);

  const handleNext = React.useCallback(() => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      onComplete(answers);
    }
  }, [currentQ, questions, onComplete, answers]);

  useEffect(() => {
    if (timeLeft === 0) { handleNext(); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleNext]);

  const q = questions[currentQ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Progress Header */}
      <div className="mb-10">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-sm font-bold text-primary-600 tracking-wider uppercase">Question {currentQ + 1} of {questions.length}</span>
            <div className="h-1.5 w-64 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                className="h-full bg-primary-500 rounded-full"
              ></motion.div>
            </div>
          </div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-2xl font-bold bg-white shadow-sm border ${timeLeft < 10 ? 'text-red-500 border-red-100 animate-pulse' : 'text-gray-700 border-gray-100'}`}>
            <Timer size={18} />
            <span>{timeLeft}s</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-8 leading-tight">{q.questionText || q.text}</h2>

          <div className="space-y-4 mb-10">
            {(q.options || q.opts || []).map((opt, idx) => (
              <motion.div
                key={opt}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                className={`group flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${answers[q.id] === opt
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-50 bg-gray-50 hover:border-gray-200 hover:bg-white'
                  }`}
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 font-bold ${answers[q.id] === opt ? 'bg-primary-500 text-white' : 'bg-white text-gray-400 group-hover:text-primary-500'
                    }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className={`text-lg transition-colors ${answers[q.id] === opt ? 'text-primary-900 font-bold' : 'text-gray-600 font-medium'
                    }`}>
                    {opt}
                  </span>
                </div>
                {answers[q.id] === opt && <CheckCircle2 className="text-primary-500" size={24} />}
              </motion.div>
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center py-5 bg-gray-900 text-white rounded-2xl font-bold text-xl hover:bg-black transition transform active:scale-[0.98] shadow-lg shadow-gray-900/20"
          >
            {currentQ === questions.length - 1 ? "Complete Assessment" : "Next Question"}
            <ArrowRight className="ml-2 h-6 w-6" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SmartQuiz;