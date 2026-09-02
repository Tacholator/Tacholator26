import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, MessageSquareText, Eye, X } from 'lucide-react';
import { tellMeQuestions, showMeQuestions } from './showMeTellMeData';

export default function ShowMeTellMeBento() {
  const [selected, setSelected] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ring-1 ring-[#F7B602]/20"
    >
      <div className="bg-[#071739] px-4 py-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#F7B602] flex items-center justify-center shrink-0">
          <HelpCircle className="w-5 h-5 text-[#071739]" />
        </div>
        <h3 className="text-lg font-semibold text-white">Show Me, Tell Me Questions</h3>
      </div>

      <p className="text-xs text-slate-500 mb-3 px-4 pt-3 leading-relaxed">
        You'll be asked 2 vehicle safety questions on your test. Tap a card to see the answer.
      </p>

      {/* Tell Me questions */}
      <div className="flex items-center gap-1.5 mb-2 px-4">
        <MessageSquareText className="w-4 h-4 text-[#071739]" />
        <p className="text-sm font-bold text-[#071739]">Tell Me Questions</p>
        <span className="text-xs text-slate-400">(14 questions)</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 px-4 scrollbar-thin snap-x snap-mandatory">
        {tellMeQuestions.map((q) => (
          <button
            key={`tell-${q.number}`}
            onClick={() => setSelected(q)}
            className="flex-none w-44 h-44 snap-start rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 p-4 flex flex-col items-start justify-start text-left shadow-sm hover:shadow-md hover:from-amber-100 hover:to-amber-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <div className="w-8 h-8 rounded-full bg-[#071739] flex items-center justify-center mb-2 shrink-0">
              <span className="text-xs font-bold text-[#F7B602]">{q.number}</span>
            </div>
            <p className="text-xs font-semibold text-amber-950 leading-snug line-clamp-6">{q.question}</p>
            <span className="mt-auto text-[10px] font-bold text-amber-700 uppercase tracking-wide pt-2">Tap for answer</span>
          </button>
        ))}
      </div>

      <div className="h-px bg-slate-100 mx-4 my-2" />

      {/* Show Me questions */}
      <div className="flex items-center gap-1.5 mb-2 px-4">
        <Eye className="w-4 h-4 text-[#071739]" />
        <p className="text-sm font-bold text-[#071739]">Show Me Questions</p>
        <span className="text-xs text-slate-400">(7 questions)</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 px-4 scrollbar-thin snap-x snap-mandatory">
        {showMeQuestions.map((q) => (
          <button
            key={`show-${q.number}`}
            onClick={() => setSelected(q)}
            className="flex-none w-44 h-44 snap-start rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 p-4 flex flex-col items-start justify-start text-left shadow-sm hover:shadow-md hover:from-sky-100 hover:to-sky-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <div className="w-8 h-8 rounded-full bg-[#071739] flex items-center justify-center mb-2 shrink-0">
              <span className="text-xs font-bold text-[#F7B602]">{q.number}</span>
            </div>
            <p className="text-xs font-semibold text-sky-950 leading-snug line-clamp-6">{q.question}</p>
            <span className="mt-auto text-[10px] font-bold text-sky-700 uppercase tracking-wide pt-2">Tap for details</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 italic px-4 pb-4 pt-1">
        Source: DVSA — Show me, tell me vehicle safety questions (gov.uk)
      </p>

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
            >
              <div className={`sticky top-0 px-5 py-4 flex items-start justify-between gap-3 border-b ${
                selected.type === 'tell' ? 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-200' : 'bg-gradient-to-br from-sky-100 to-sky-200 border-sky-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#071739] flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-[#F7B602]">{selected.number}</span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${
                      selected.type === 'tell' ? 'text-amber-700' : 'text-sky-700'
                    }`}>
                      {selected.type === 'tell' ? 'Tell Me' : 'Show Me'}
                    </span>
                    <h3 className={`text-base font-bold leading-tight pr-2 ${
                      selected.type === 'tell' ? 'text-amber-950' : 'text-sky-950'
                    }`}>{selected.question}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 -m-1.5 rounded-lg hover:bg-black/5 transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="p-5">
                {selected.answer ? (
                  <div>
                    <p className="text-xs font-bold text-[#071739] uppercase tracking-wide mb-2">Answer</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{selected.answer}</p>
                  </div>
                ) : (
                  <div className="bg-sky-50 rounded-xl p-3 border border-sky-100">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      This is a 'show me' question asked while you're driving. The examiner will ask you to demonstrate this when it's safe to do so. Practise operating these controls so you can do them smoothly without taking your attention off the road.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}