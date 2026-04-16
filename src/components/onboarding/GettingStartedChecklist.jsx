import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Rocket } from 'lucide-react';

export default function GettingStartedChecklist({ pupil, bookings, lessons, onOpenTour }) {
  const [collapsed, setCollapsed] = useState(false);

  const steps = [
    {
      id: 'profile',
      label: 'Complete your profile',
      description: 'Add your phone number and personal details',
      done: !!(pupil?.firstName && pupil?.lastName && pupil?.phone),
      link: createPageUrl('ProfileSettings')
    },
    {
      id: 'balance',
      label: 'Top up your balance',
      description: 'Add funds to book driving lessons',
      done: (pupil?.bulkPaymentBalance || 0) > 0,
      link: createPageUrl('LearnerPayments')
    },
    {
      id: 'booking',
      label: 'Book your first lesson',
      description: 'Reserve a slot with your instructor',
      done: bookings?.some(b => b.status === 'confirmed') || false,
      link: createPageUrl('LearnerCalendar')
    },
    {
      id: 'lesson',
      label: 'Complete a lesson',
      description: 'Attend your first driving lesson',
      done: lessons?.some(l => l.status === 'Completed') || false,
      link: null
    },
    {
      id: 'progress',
      label: 'Check your progress',
      description: 'See how you\'re developing your driving skills',
      done: lessons?.some(l => l.status === 'Completed') || false,
      link: createPageUrl('LearnerProgress')
    }
  ];

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === steps.length;

  // Hide once everything is complete, or if the learner has already completed a lesson
  const hasCompletedLesson = lessons?.some(l => l.status === 'Completed') || false;
  if (allDone || hasCompletedLesson) return null;

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-[#071739] to-[#0d2a5e] text-white overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Rocket className="w-5 h-5 text-[#F7B602]" />
            Getting Started
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/70">{completedCount}/{steps.length}</span>
            <button
              onClick={() => setCollapsed(c => !c)}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
            >
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
          <div
            className="bg-[#F7B602] h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </CardHeader>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-2 pb-4 space-y-2">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-3">
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5 text-[#F7B602] shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-white/30 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    {step.link && !step.done ? (
                      <Link to={step.link}>
                        <span className={`text-sm font-medium hover:underline ${step.done ? 'text-white/50 line-through' : 'text-white'}`}>
                          {step.label}
                        </span>
                      </Link>
                    ) : (
                      <span className={`text-sm font-medium ${step.done ? 'text-white/50 line-through' : 'text-white'}`}>
                        {step.label}
                      </span>
                    )}
                    {!step.done && (
                      <p className="text-xs text-white/50">{step.description}</p>
                    )}
                  </div>
                </div>
              ))}

              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenTour}
                className="w-full mt-2 text-white/70 hover:text-white hover:bg-white/10 text-xs"
              >
                Re-watch app tour
              </Button>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}