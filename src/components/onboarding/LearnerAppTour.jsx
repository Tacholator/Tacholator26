import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, Calendar, TrendingUp, BookMarked, 
  Wallet, LayoutDashboard, Navigation, X, ChevronRight, ChevronLeft
} from 'lucide-react';

const steps = [
  {
    icon: LayoutDashboard,
    iconBg: 'bg-[#071739]',
    iconColor: 'text-[#F7B602]',
    title: 'Welcome to Tacholator! 🎉',
    description: "Your personal driving lesson companion. Let's take a quick tour of the key features to help you get the most out of the app.",
    tip: null
  },
  {
    icon: LayoutDashboard,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    title: 'Your Dashboard',
    description: "The home screen gives you an at-a-glance view of everything important — your next lesson, account balance, progress, homework, and notifications.",
    tip: '💡 Check your dashboard daily to stay on top of things.'
  },
  {
    icon: BookOpen,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'My Learning',
    description: "Access your course work, driving progress, homework, class notes, mock tests and study resources all in one place.",
    tip: '💡 Complete assigned coursework before your next lesson to be better prepared.'
  },
  {
    icon: Calendar,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    title: 'Book a Lesson',
    description: "View your instructor's available slots and book lessons directly from the app. You can also cancel or reschedule if needed.",
    tip: '💡 Make sure you have enough balance before booking a lesson.'
  },
  {
    icon: TrendingUp,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    title: 'Track Your Progress',
    description: "See exactly how you're progressing through all 24 DVSA driving skills. Your instructor updates this after each lesson.",
    tip: '💡 Aim to reach "Independent" on every skill before your test.'
  },
  {
    icon: BookMarked,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    title: 'My Bookings',
    description: "View all your upcoming and past lesson bookings in one place. You'll see the date, time, and status of each booking.",
    tip: '💡 Tap any booking to see full details or cancel if needed.'
  },
  {
    icon: Wallet,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    title: 'Payments',
    description: "Top up your lesson balance, view your transaction history, and download invoices. Your balance must be sufficient to book lessons.",
    tip: '💡 Set up a payment method to top up quickly when needed.'
  },
  {
    icon: Navigation,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    title: 'Test Routes',
    description: "Watch video walkthroughs of real test routes near your test centre so you know exactly what to expect on test day.",
    tip: '💡 Watch test route videos in the weeks leading up to your practical test.'
  },
  {
    icon: LayoutDashboard,
    iconBg: 'bg-[#F7B602]/20',
    iconColor: 'text-[#071739]',
    title: "You're all set! 🚗",
    description: "You can revisit this tour anytime by tapping the Help button on your dashboard. Good luck with your lessons!",
    tip: null
  }
];

export default function LearnerAppTour({ open, onClose }) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleClose = () => {
    setStep(0);
    onClose();
  };

  const current = steps[step];
  const Icon = current.icon;
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 pt-5 pb-0">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? 'w-6 bg-[#F7B602]' : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Content */}
            <div className="p-8 pt-6 text-center">
              {/* Icon */}
              <div className={`w-20 h-20 rounded-2xl ${current.iconBg} flex items-center justify-center mx-auto mb-6`}>
                <Icon className={`w-10 h-10 ${current.iconColor}`} />
              </div>

              {/* Step counter */}
              {!isFirst && !isLast && (
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Step {step} of {steps.length - 2}
                </p>
              )}

              <h2 className="text-2xl font-bold text-slate-800 mb-3">{current.title}</h2>
              <p className="text-slate-600 leading-relaxed">{current.description}</p>

              {current.tip && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800 text-left">
                  {current.tip}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="px-8 pb-8 flex gap-3">
              {!isFirst && (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                className={`flex-1 bg-[#071739] hover:bg-[#0a2142] text-white ${isFirst ? 'w-full' : ''}`}
              >
                {isLast ? "Let's Go!" : isFirst ? 'Start Tour' : 'Next'}
                {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}