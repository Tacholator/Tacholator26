import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Scroll } from 'lucide-react';

export default function GoldenRuleCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-[#071739] to-[#0e2a5c] p-5 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-[#F7B602] flex items-center justify-center">
          <Crown className="w-5 h-5 text-[#071739]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#F7B602] uppercase tracking-wide">
            The Golden Rule
          </h3>
          <p className="mt-1 text-white text-sm leading-relaxed">
            If another road user has to slow down, stop, swerve, or take action because of you,
            you are probably making a serious fault.
          </p>
          <Link
            to="/TenCommandments"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#F7B602] px-4 py-2 text-xs font-semibold text-[#071739] hover:bg-[#d99f02] transition-colors"
          >
            <Scroll className="w-4 h-4" />
            View Ten Commandments
          </Link>
        </div>
      </div>
    </motion.div>
  );
}