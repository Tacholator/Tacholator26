import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

export default function GoldenRuleCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-gradient-to-br from-sky-200 to-blue-300 p-3 shadow-md"
    >
      <div className="flex items-center gap-2.5">
        <div className="shrink-0 w-7 h-7 rounded-lg bg-[#F7B602] flex items-center justify-center">
          <Crown className="w-4 h-4 text-[#071739]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[11px] font-extrabold text-[#071739] uppercase tracking-wide leading-tight">
            The Golden Rule
          </h3>
          <p className="mt-0.5 text-[#071739] text-xs leading-snug">
            If another road user has to slow down, stop, swerve, or take action because of you, you are probably making a serious fault.
          </p>
        </div>
      </div>
    </motion.div>
  );
}