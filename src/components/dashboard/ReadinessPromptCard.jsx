import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, XCircle, ClipboardList, ChevronRight } from 'lucide-react';

export default function ReadinessPromptCard({ pupilId }) {
  const { data: checks = [], isLoading } = useQuery({
    queryKey: ['readinessPrompt', pupilId],
    queryFn: () => base44.entities.TestReadinessCheck.filter({ learner_id: pupilId }, '-created_date', 1),
    enabled: !!pupilId
  });

  const latest = checks[0];

  const resultConfig = {
    'Ready for Test': {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      ring: 'ring-emerald-200',
      bg: 'from-emerald-50 to-teal-50',
      accent: 'text-emerald-700',
      label: 'You\'re test ready!'
    },
    'Almost Ready': {
      icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
      ring: 'ring-amber-200',
      bg: 'from-amber-50 to-yellow-50',
      accent: 'text-amber-700',
      label: 'Almost there!'
    },
    'Not Ready Yet': {
      icon: <XCircle className="w-5 h-5 text-rose-500" />,
      ring: 'ring-rose-200',
      bg: 'from-rose-50 to-pink-50',
      accent: 'text-rose-700',
      label: 'Keep practising'
    }
  };

  if (isLoading) return null;

  const config = latest ? resultConfig[latest.readiness_result] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 }}
    >
      <Link to={createPageUrl('TestReadinessChecker')}>
        <div className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${config ? config.bg : 'from-[#071739] to-[#0d2a5e]'} ring-1 ${config ? config.ring : 'ring-[#071739]'} cursor-pointer hover:shadow-md transition-shadow`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config ? 'bg-white/60' : 'bg-[#F7B602]'}`}>
            {config ? config.icon : <ClipboardList className="w-5 h-5 text-[#071739]" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${config ? config.accent : 'text-white'}`}>
              {config ? config.label : 'Test Readiness Check'}
            </p>
            <p className={`text-xs ${config ? 'text-slate-500' : 'text-white/70'}`}>
              {latest
                ? `Score: ${latest.readiness_score ?? '—'}/100 — tap to update`
                : 'See how close you are to test standard'}
            </p>
          </div>
          <ChevronRight className={`w-5 h-5 shrink-0 ${config ? 'text-slate-400' : 'text-[#F7B602]'}`} />
        </div>
      </Link>
    </motion.div>
  );
}