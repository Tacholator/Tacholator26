import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  BookOpen,
  CreditCard,
  Bell,
  BarChart2,
  MessageCircle,
  Map,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

const steps = [
  {
    icon: Calendar,
    color: 'bg-emerald-100 text-emerald-700',
    title: 'Your Calendar',
    description: 'Manage your working hours, create bookable slots, and view all your upcoming lessons in one place.',
    tip: 'Go to Calendar → Booking Calendar to set your availability.',
  },
  {
    icon: Users,
    color: 'bg-blue-100 text-blue-700',
    title: 'Pupil Management',
    description: 'Add and manage your pupils, track their progress, update balances, and view their lesson history.',
    tip: 'Find all your pupils under the Pupils section in the sidebar.',
  },
  {
    icon: BookOpen,
    color: 'bg-purple-100 text-purple-700',
    title: 'Teaching Hub',
    description: 'Assign study material, quizzes, and homework to your pupils. Track their engagement and scores.',
    tip: 'Use Teaching Hub to assign topics and monitor study progress.',
  },
  {
    icon: BarChart2,
    color: 'bg-orange-100 text-orange-700',
    title: 'Progress Tracking',
    description: 'Track each pupil\'s driving skills across all DVSA categories and mark progress after every lesson.',
    tip: 'Open a pupil\'s profile and go to the Progress tab.',
  },
  {
    icon: MessageCircle,
    color: 'bg-teal-100 text-teal-700',
    title: 'Chats',
    description: 'Send and receive messages with your pupils directly in the app. Get notified in real time.',
    tip: 'Tap Chats in the sidebar to start a conversation.',
  },
  {
    icon: CreditCard,
    color: 'bg-amber-100 text-amber-700',
    title: 'Payments',
    description: 'Manage pupil balances, record payments, and connect your Stripe account to receive online payments.',
    tip: 'Set up Stripe in Profile → Stripe Connect to accept online top-ups.',
  },
  {
    icon: Bell,
    color: 'bg-rose-100 text-rose-700',
    title: 'Notifications',
    description: 'Stay on top of new bookings, pupil messages, and lesson updates via the Notifications centre.',
    tip: 'Customise which alerts you receive in Settings → Notifications.',
  },
  {
    icon: Map,
    color: 'bg-indigo-100 text-indigo-700',
    title: 'Test Routes',
    description: 'Upload and share test route videos with pupils. Grant access per pupil or for your whole group.',
    tip: 'Go to Test Routes in the sidebar to manage route videos.',
  },
];

export default function InstructorAppTour({ open, onClose }) {
  const [step, setStep] = useState(0);

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  const handleClose = () => {
    setStep(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden" hideClose>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            App Tour · {step + 1} / {steps.length}
          </p>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100 mx-5 rounded-full mb-4">
          <div
            className="h-1 bg-[#F7B602] rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="px-5 pb-6"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${current.color}`}>
              <Icon className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-[#071739] mb-2">{current.title}</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">{current.description}</p>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Tip: </span>
                {current.tip}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between px-5 pb-5 pt-2 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="gap-1 text-slate-500"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>

          {isLast ? (
            <Button
              size="sm"
              onClick={handleClose}
              className="bg-[#071739] hover:bg-[#0e2a5a] text-white gap-1"
            >
              Done
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setStep(s => s + 1)}
              className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}