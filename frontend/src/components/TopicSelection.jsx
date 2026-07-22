import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Layers, 
  Headphones, 
  Mic, 
  BookOpen, 
  PenTool, 
  Clock, 
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const getTheme = (title) => {
  const norm = (title || '').toLowerCase();
  if (norm.includes('listen')) {
    return {
      gradient: 'from-emerald-500 to-teal-600',
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100/50',
      icon: Headphones
    };
  }
  if (norm.includes('speak')) {
    return {
      gradient: 'from-rose-500 to-pink-600',
      text: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100/50',
      icon: Mic
    };
  }
  if (norm.includes('read')) {
    return {
      gradient: 'from-indigo-500 to-violet-600',
      text: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100/50',
      icon: BookOpen
    };
  }
  // Default to Writing / Other
  return {
    gradient: 'from-amber-500 to-orange-600',
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100/50',
    icon: PenTool
  };
};

const getSubtypeStyle = (subtype) => {
  const norm = (subtype || '').toLowerCase();
  
  if (norm.includes('essay')) {
    return 'bg-blue-50 text-blue-600 border-blue-100/70';
  }
  if (norm.includes('report')) {
    return 'bg-cyan-50 text-cyan-600 border-cyan-100/70';
  }
  if (norm.includes('grammar') || norm.includes('correct')) {
    return 'bg-purple-50 text-purple-600 border-purple-100/70';
  }
  if (norm.includes('summar')) {
    return 'bg-indigo-50 text-indigo-600 border-indigo-100/70';
  }
  if (norm.includes('letter') || norm.includes('email') || norm.includes('leave')) {
    return 'bg-pink-50 text-pink-600 border-pink-100/70';
  }
  if (norm.includes('story') || norm.includes('complete')) {
    return 'bg-violet-50 text-violet-600 border-violet-100/70';
  }
  if (norm.includes('intro') || norm.includes('self')) {
    return 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100/70';
  }
  if (norm.includes('picture') || norm.includes('desc')) {
    return 'bg-rose-50 text-rose-600 border-rose-100/70';
  }
  if (norm.includes('read') || norm.includes('aloud')) {
    return 'bg-teal-50 text-teal-600 border-teal-100/70';
  }
  
  return 'bg-slate-50 text-slate-600 border-slate-100/70';
};

const formatSubtype = (val) => {
  if (!val) return '';
  return val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const TopicSelection = ({ title, topics, onSelect, onBack }) => {
  const theme = getTheme(title);
  const IconComponent = theme.icon;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <button
        onClick={onBack}
        className="flex items-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-xl transition mb-10 font-bold"
      >
        <ArrowLeft className="mr-2 h-5 w-5" /> Back to Dashboard
      </button>

      <div className="text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-primary-400/5 to-purple-400/5 blur-3xl rounded-full -z-10" />
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-full mb-4 shadow-sm">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-black uppercase tracking-wider text-gray-500">Practice Modules</span>
        </div>
        <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-3">
          Select a <span className={`bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>{title}</span> Topic
        </h1>
        <p className="text-gray-500 font-medium text-lg italic max-w-xl mx-auto">
          Choose a curriculum module to begin your automated assessment.
        </p>
      </div>

      {topics.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm max-w-2xl mx-auto mt-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mb-6 border border-gray-100">
            <Layers size={40} />
          </div>
          <p className="text-gray-900 font-black text-2xl mb-2">No Assigned Modules</p>
          <p className="text-gray-400 font-medium max-w-sm">
            Check back later when your teacher assigns new {title.toLowerCase()} tasks to your profile or group.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {topics.map((t, idx) => {
            const diffLevel = t.difficultyLevel || t.difficulty || 'Intermediate';
            const timeVal = t.timeLimit ? (t.timeLimit >= 60 ? `${Math.round(t.timeLimit / 60)} Mins` : `${t.timeLimit} Secs`) : '30 Secs';
            const qCount = t.questions ? t.questions.length : 0;

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group flex flex-col h-[440px]"
              >
                <div
                  className={`h-32 w-full bg-gradient-to-br ${theme.gradient} relative overflow-hidden p-8 flex items-end`}
                >
                  <div className="w-32 h-32 rounded-full bg-white/10 absolute -top-8 -right-8 blur-md" />
                  <div className="w-20 h-20 rounded-full bg-white/5 absolute -bottom-8 -left-4 blur-sm" />
                  
                  {/* Floating category icon */}
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg absolute -bottom-7 left-8 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className={theme.text} size={28} />
                  </div>
                </div>

                <div className="pt-10 px-8 pb-8 flex flex-col justify-between flex-grow">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`text-[9px] font-black uppercase tracking-wider ${theme.text} ${theme.bg} px-2.5 py-1 rounded-lg border ${theme.border} inline-block shadow-sm`}>
                        {t.type || t.lsrwComponent || 'Writing'}
                      </span>
                      {(t.assessmentType || t.subType) && (
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border inline-block shadow-sm ${getSubtypeStyle(t.assessmentType || t.subType)}`}>
                          {formatSubtype(t.assessmentType || t.subType)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition" title={t.title}>
                      {t.title}
                    </h3>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed line-clamp-3 mb-6 min-h-[60px]" title={t.desc}>
                      {t.desc || "No description provided for this evaluation module."}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Meta information row */}
                    <div className="flex items-center justify-between border-t border-gray-50 pt-4 text-xs font-bold text-gray-500">
                      <span className={`px-3 py-1.5 rounded-full ${theme.bg} ${theme.text} uppercase tracking-wider text-[10px]`}>
                        {diffLevel}
                      </span>
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" /> {timeVal}
                        </span>
                        {qCount > 0 && (
                          <span className="flex items-center">
                            <HelpCircle className="w-3.5 h-3.5 mr-1" /> {qCount} Qs
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelect(t)}
                      className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black flex items-center justify-center transition-all shadow-md group-hover:shadow-lg active:scale-[0.98]"
                    >
                      Start Assessment 
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TopicSelection;