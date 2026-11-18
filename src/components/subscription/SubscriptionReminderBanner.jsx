import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Zap } from 'lucide-react';
import { useInstructorSubscription } from '@/hooks/useInstructorSubscription';

export default function SubscriptionReminderBanner({ userId }) {
  const { hasValidSub, isLoading } = useInstructorSubscription(userId);

  if (!userId || isLoading || hasValidSub) return null;

  return (
    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
      <div className="flex items-start gap-2">
        <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-amber-800 text-xs font-medium">
          To create personal events, bookable slots and lessons, select a plan.
        </p>
      </div>
      <Link to="/InstructorSubscription" className="shrink-0">
        <button
          type="button"
          className="flex items-center gap-1.5 bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          Start Free Trial
        </button>
      </Link>
    </div>
  );
}