import React from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  LayoutDashboard,
  RotateCcw,
  FileText
} from 'lucide-react';

const DetailedReport = ({ title, score, metrics, mistakes, criteria, recommendations, transcript, onRetry, onHome }) => {
  const isPass = score >= 60;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100"
      >
        {/* Header Section */}
        <div className={`p-12 text-white relative overflow-hidden ${isPass ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-red-600'}`}>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
            <div>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-bold mb-4">
                <Trophy size={16} className="mr-2" />
                Assessment Completed
              </div>
              <h1 className="text-5xl font-black mb-2">{title} Analysis</h1>
              <p className="text-white/80 text-lg font-medium">Comprehensive performance breakdown</p>
            </div>

            <div className="mt-8 md:mt-0 flex flex-col items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] min-w-[200px]">
              <span className="text-6xl font-black leading-none">{score}</span>
              <span className="text-white/60 font-bold uppercase tracking-widest text-sm mt-2">Overall Score</span>
            </div>
          </div>

          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-black/10 rounded-full blur-2xl"></div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 bg-gray-50/50 border-b border-gray-100">
          {metrics.map((m, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{m.label}</span>
              <span className="text-2xl font-black text-gray-900">{m.value}</span>
            </div>
          ))}
        </div>

        <div className="p-12 space-y-12">

          {/* Transcript Section (Optional) */}
          {transcript && (
            <section>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Transcription</h3>
              </div>
              <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 italic text-gray-600 leading-relaxed text-lg">
                "{transcript}"
              </div>
            </section>
          )}

          {/* Criteria Breakdown */}
          {criteria && (
            <section>
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <BarChart3 size={20} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Skill Breakdown</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 bg-white p-10 rounded-[2rem] border border-gray-100">
                {Object.entries(criteria).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between items-end mb-3">
                      <span className="font-bold text-gray-700">{key}</span>
                      <span className="text-sm font-black text-gray-400">{value}%</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                      ></motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Mistakes & Corrections */}
          <section>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Detailed Feedback</h3>
            </div>

            {mistakes.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem] flex items-center space-x-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm shadow-emerald-200/50">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-emerald-900">Flawless Performance!</h4>
                  <p className="text-emerald-700 font-medium">We couldn't find any specific areas for correction in this session.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-100 rounded-[2rem]">
                <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Analysis</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Observed</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Recommended</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mistakes.map((item, index) => (
                      <tr key={index} className="group hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="font-bold text-gray-900">{item.type}</div>
                          <div className="text-xs text-gray-400 font-medium mt-1">{item.question}</div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="inline-block px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-sm font-bold border border-rose-100">
                            {item.userAnswer}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold border border-emerald-100">
                            {item.correctAnswer}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Recommendations / Action Plan */}
          <section>
            <div className="bg-indigo-900 p-10 rounded-[2.5rem] text-white overflow-hidden relative shadow-xl shadow-indigo-900/20">
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center backdrop-blur-md">
                    <Lightbulb size={20} />
                  </div>
                  <h3 className="text-2xl font-bold">Personalized Action Plan</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start space-x-4 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-black underline">
                        {i + 1}
                      </div>
                      <p className="text-white/90 font-medium leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Decorative circle */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
            </div>
          </section>

          {/* Footer Controls */}
          <div className="flex flex-col md:flex-row justify-center gap-6 pt-6">
            <button
              onClick={onHome}
              className="flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-200 transition active:scale-95"
            >
              <LayoutDashboard className="mr-2" size={20} /> Return to Dashboard
            </button>
            <button
              onClick={onRetry}
              className="flex items-center justify-center px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition active:scale-95 shadow-lg shadow-gray-900/20"
            >
              <RotateCcw className="mr-2" size={20} /> Try Another Module
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default DetailedReport;