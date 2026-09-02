import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { topReasons } from './topReasonsData';

export default function TopTenReasonsBento() {
  const [selected, setSelected] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#071739]" />
          <h3 className="text-lg font-semibold text-[#071739]">Top 10 Reasons for Test Fails</h3>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
        {topReasons.map((reason) => (
          <button
            key={reason.number}
            onClick={() => setSelected(reason)}
            className="flex-none w-40 h-36 snap-start rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 p-4 flex flex-col items-center justify-start text-center shadow-sm pt-5 hover:shadow-md hover:from-rose-200 hover:to-rose-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <div className="w-9 h-9 rounded-full bg-[#071739] flex items-center justify-center mb-2">
              <span className="text-sm font-bold text-[#F7B602]">{reason.number}</span>
            </div>
            <p className="text-xs font-semibold text-rose-950 leading-tight">{reason.title}</p>
          </button>
        ))}
      </div>

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
              <div className="sticky top-0 bg-gradient-to-br from-rose-100 to-rose-200 px-5 py-4 flex items-start justify-between gap-3 border-b border-rose-200">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#071739] flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-[#F7B602]">{selected.number}</span>
                  </div>
                  <h3 className="text-base font-bold text-rose-950 pr-2 leading-tight">{selected.title}</h3>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 -m-1.5 rounded-lg text-rose-900 hover:bg-rose-200/60 transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-bold text-[#071739] uppercase tracking-wide mb-2">What you must be able to do</p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    You must always:
                  </p>
                  <ul className="mt-1 space-y-1">
                    {selected.mustDo.map((item, i) => (
                      <li key={i} className="text-sm text-slate-700 leading-relaxed flex items-start gap-2">
                        <span className="text-rose-500 mt-1 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#071739] uppercase tracking-wide mb-2">Examples of mistakes</p>
                  <div className="space-y-3">
                    {selected.examples.map((ex, i) => (
                      <div key={i} className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                        <p className="text-sm font-semibold text-rose-900 mb-1">{ex.heading}</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{ex.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-400 italic">
                  Source: DVSA — Top 10 reasons for failing the driving test (gov.uk)
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}