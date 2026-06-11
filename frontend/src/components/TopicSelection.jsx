import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Layers } from 'lucide-react';

const TopicSelection = ({ title, topics, onSelect, onBack }) => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <button
        onClick={onBack}
        className="flex items-center text-gray-500 hover:text-primary-600 transition mb-8 font-medium"
      >
        <ArrowLeft className="mr-2 h-5 w-5" /> Back to Dashboard
      </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Select a {title} Topic</h1>
        <p className="text-gray-500 text-lg">Choose a module to begin your assessment</p>
      </div>

      {topics.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100 max-w-2xl mx-auto mt-8">
          <Layers size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-lg">No assigned {title} modules</p>
          <p className="text-gray-500 font-medium mt-2">Check back later when your teacher assigns new tasks.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {topics.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow group flex flex-col"
            >
              <div
                className="h-32 w-full transition-transform group-hover:scale-105 duration-500"
                style={{ background: t.color || '#0ea5e9' }}
              ></div>
              <div className="p-8 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t.title}</h3>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed flex-grow">{t.desc}</p>
                <button
                  onClick={() => onSelect(t)}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center hover:bg-black transition transform active:scale-[0.98]"
                >
                  Start Module <Play className="ml-2 h-4 w-4 fill-current" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopicSelection;