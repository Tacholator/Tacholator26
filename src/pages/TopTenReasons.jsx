import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { topReasons } from '@/components/dashboard/topReasonsData';

export default function TopTenReasons() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link
          to={createPageUrl('LearnerDashboard')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#071739] transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-[#071739]" />
            <h1 className="text-xl font-bold text-[#071739]">Top 10 Reasons for Test Fails</h1>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            The DVSA's top 10 reasons people fail the driving test. Read each one carefully — knowing the common mistakes helps you avoid them on test day.
          </p>
        </motion.div>

        <div className="space-y-4">
          {topReasons.map((reason, idx) => (
            <motion.div
              key={reason.number}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
            >
              <div className="bg-gradient-to-br from-rose-100 to-rose-200 px-5 py-4 flex items-start gap-3 border-b border-rose-200">
                <div className="w-9 h-9 rounded-full bg-[#071739] flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#F7B602]">{reason.number}</span>
                </div>
                <h2 className="text-base font-bold text-rose-950 leading-tight pt-1">{reason.title}</h2>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-bold text-[#071739] uppercase tracking-wide mb-2">
                    What you must be able to do
                  </p>
                  <p className="text-sm text-slate-700 mb-1">You must always:</p>
                  <ul className="space-y-1.5">
                    {reason.mustDo.map((item, i) => (
                      <li key={i} className="text-sm text-slate-700 leading-relaxed flex items-start gap-2">
                        <span className="text-rose-500 mt-1 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#071739] uppercase tracking-wide mb-2">
                    Examples of mistakes
                  </p>
                  <div className="space-y-3">
                    {reason.examples.map((ex, i) => (
                      <div key={i} className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                        <p className="text-sm font-semibold text-rose-900 mb-1">{ex.heading}</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{ex.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-slate-400 italic mt-6 text-center">
          Source: DVSA — Top 10 reasons for failing the driving test (gov.uk)
        </p>
      </div>
    </div>
  );
}