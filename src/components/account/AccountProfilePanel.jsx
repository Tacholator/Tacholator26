import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Settings,
  UserCircle,
  FileText,
  Receipt,
  Shield,
  LogOut,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Scale,
  ChevronDown,
  MapPin,
  MessageSquare,
  ThumbsUp,
  Smartphone,
  HelpCircle,
  Rocket,
  CheckCircle2,
  Circle,
  Calendar,
  CreditCard,
  User
} from 'lucide-react';
import ProfileSettingsContent from './ProfileSettingsContent.jsx';

const onboardingSteps = [
  { key: 'onboardingProfileCompleted', label: 'Personal & Business Info', page: 'ProfileSettings', icon: User },
  { key: 'onboardingCalendarCompleted', label: 'Set Up Your Calendar', page: 'InstructorBookingCalendar', icon: Calendar },
  { key: 'onboardingStripeCompleted', label: 'Connect Stripe Payout', page: 'InstructorStripeConnect', icon: CreditCard },
];

export default function AccountProfilePanel({ user, isInstructor, onLogout, onDelete, onClose }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [legalOpen, setLegalOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  const { data: instructor } = useQuery({
    queryKey: ['instructor', user?.id],
    queryFn: async () => {
      if (!user?.email) return null;
      const results = await base44.entities.Instructor.filter({ created_by: user.email });
      return results[0] || null;
    },
    enabled: !!user?.email && isInstructor
  });

  const { data: calendarRules = [] } = useQuery({
    queryKey: ['calendarRules', user?.id],
    queryFn: () => base44.entities.CalendarRule.filter({ instructorId: user.id }),
    enabled: !!user?.id && isInstructor
  });

  // Learner checklist data
  const { data: learnerPupil } = useQuery({
    queryKey: ['learnerPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id || !user?.email) return null;
      const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byLinkedId.length > 0) return byLinkedId[0];
      const byEmail = await base44.entities.Pupil.filter({ email: user.email });
      return byEmail.length > 0 ? byEmail[0] : null;
    },
    enabled: !!user?.id && !!user?.email && !isInstructor
  });

  const { data: learnerBookings = [] } = useQuery({
    queryKey: ['myBookings', learnerPupil?.id],
    queryFn: () => base44.entities.LessonBooking.filter({ pupilId: learnerPupil.id }),
    enabled: !!learnerPupil?.id && !isInstructor
  });

  const { data: learnerLessons = [] } = useQuery({
    queryKey: ['myLessons', learnerPupil?.id],
    queryFn: () => base44.entities.Lesson.filter({ pupilId: learnerPupil.id }),
    enabled: !!learnerPupil?.id && !isInstructor
  });

  const learnerSteps = learnerPupil ? [
    { key: 'profile', label: 'Complete your profile', done: !!(learnerPupil.firstName && learnerPupil.lastName && learnerPupil.phone), page: 'ProfileSettings' },
    { key: 'balance', label: 'Top up your balance', done: (learnerPupil.bulkPaymentBalance || 0) > 0, page: 'LearnerPayments' },
    { key: 'booking', label: 'Book your first lesson', done: learnerBookings.some(b => b.status === 'confirmed'), page: 'LearnerCalendar' },
    { key: 'lesson', label: 'Complete a lesson', done: learnerLessons.some(l => l.status === 'Completed'), page: null },
    { key: 'progress', label: 'Check your progress', done: learnerLessons.some(l => l.status === 'Completed'), page: 'LearnerProgress' },
  ] : [];
  const learnerCompletedCount = learnerSteps.filter(s => s.done).length;
  const learnerPercentage = learnerSteps.length > 0 ? Math.round((learnerCompletedCount / learnerSteps.length) * 100) : 0;
  const hasCompletedLesson = learnerLessons.some(l => l.status === 'Completed');
  const showLearnerSetup = !isInstructor && learnerPupil && !hasCompletedLesson && learnerPercentage < 100;

  const stepCompletion = instructor ? {
    onboardingProfileCompleted: instructor.onboardingProfileCompleted || !!(instructor.name && (instructor.phone || user?.phone)),
    onboardingCalendarCompleted: instructor.onboardingCalendarCompleted || calendarRules.length > 0,
    onboardingStripeCompleted: instructor.onboardingStripeCompleted || instructor.stripeAccountStatus === 'active' || instructor.stripeAccountStatus === 'pending' || !!instructor.stripeAccountId,
  } : {};

  const completedCount = onboardingSteps.filter(s => stepCompletion[s.key]).length;
  const percentage = instructor ? Math.round((completedCount / onboardingSteps.length) * 100) : 0;
  const showSetup = isInstructor && instructor && percentage < 100;

  const menuItems = [
    { icon: UserCircle, label: 'My Account', page: 'ProfileSettings', component: 'profile', iconBg: 'bg-violet-500' },
    { icon: Settings, label: 'Settings', page: 'Settings', iconBg: 'bg-slate-500' },
  ];

  const quickLinks = [
    { icon: MessageSquare, label: 'Contact Support', page: 'ContactSupport', iconBg: 'bg-blue-500' },
    { icon: ThumbsUp, label: 'App Feedback', page: 'AppFeedback', iconBg: 'bg-green-500' },
  ];

  const legalItems = [
    { icon: FileText, label: 'Lesson T&Cs', page: 'LessonTermsAndConditions', iconBg: 'bg-indigo-500' },
    { icon: Receipt, label: 'Subscription T&Cs', page: 'SubscriptionTerms', iconBg: 'bg-emerald-500' },
    { icon: MapPin, label: 'Test Route T&Cs', page: 'TestRouteTerms', iconBg: 'bg-rose-500' },
    { icon: Receipt, label: 'Refund Policy', page: 'RefundPolicy', iconBg: 'bg-amber-500' },
    { icon: FileText, label: 'Terms & Conditions', page: 'TermsAndConditions', iconBg: 'bg-blue-500' },
    { icon: Shield, label: 'Privacy Policy', page: 'PrivacyPolicy', iconBg: 'bg-violet-500' },
  ];

  const userName = user?.firstName 
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.full_name || user?.email;


  return (
    <div className="flex flex-col h-full">
      {/* Profile Card */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-start gap-4 p-4 bg-blue-100 rounded-lg">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-[#F7B602] to-[#d99f02] text-[#071739] font-semibold">
              {user?.firstName?.[0] || user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#071739] truncate">{userName}</h3>
            <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            <p className="text-xs text-slate-400 mt-1">{isInstructor ? 'Instructor' : 'Learner'}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              onClick={() => { window.location.href = createPageUrl(item.page); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <span className={`flex items-center justify-center w-9 h-9 rounded-xl ${item.iconBg} shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}

        {/* Complete Your Setup */}
        {showSetup && (
          <>
            <button
              onClick={() => setSetupOpen(!setupOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#071739] shrink-0">
                <Rocket className="w-4 h-4 text-[#F7B602]" />
              </span>
              <span className="text-sm font-medium flex-1 text-left">Complete Your Setup</span>
              <span className="text-xs font-bold text-[#F7B602] mr-1">{percentage}%</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${setupOpen ? 'rotate-180' : ''}`} />
            </button>
            {setupOpen && (
              <div className="pl-4 space-y-1">
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2 mx-3">
                  <div className="bg-[#F7B602] h-1.5 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                </div>
                {onboardingSteps.map((step) => {
                  const done = !!stepCompletion[step.key];
                  const Icon = step.icon;
                  return (
                    <button
                      key={step.key}
                      onClick={() => { window.location.href = createPageUrl(step.page); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {done
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        : <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                      }
                      <span className={`text-sm ${done ? 'line-through text-slate-400' : ''}`}>{step.label}</span>
                      {!done && <ChevronRight className="w-3 h-3 text-slate-400 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Learner Getting Started */}
        {showLearnerSetup && (
          <>
            <button
              onClick={() => setSetupOpen(!setupOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#071739] shrink-0">
                <Rocket className="w-4 h-4 text-[#F7B602]" />
              </span>
              <span className="text-sm font-medium flex-1 text-left">Getting Started</span>
              <span className="text-xs font-bold text-[#F7B602] mr-1">{learnerPercentage}%</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${setupOpen ? 'rotate-180' : ''}`} />
            </button>
            {setupOpen && (
              <div className="pl-4 space-y-1">
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2 mx-3">
                  <div className="bg-[#F7B602] h-1.5 rounded-full transition-all" style={{ width: `${learnerPercentage}%` }} />
                </div>
                {learnerSteps.map((step) => (
                  <button
                    key={step.key}
                    onClick={() => step.page && (window.location.href = createPageUrl(step.page))}
                    disabled={!step.page}
                    className="w-full flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:cursor-default"
                  >
                    {step.done
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      : <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                    }
                    <span className={`text-sm ${step.done ? 'line-through text-slate-400' : ''}`}>{step.label}</span>
                    {!step.done && step.page && <ChevronRight className="w-3 h-3 text-slate-400 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Quick Links */}
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              onClick={() => { window.location.href = createPageUrl(item.page); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <span className={`flex items-center justify-center w-9 h-9 rounded-xl ${item.iconBg} shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => {
            if (isInstructor) {
              sessionStorage.setItem('openInstructorAppTour', '1');
            } else {
              sessionStorage.setItem('openAppTour', '1');
            }
            window.location.href = '/';
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500 shrink-0">
            <HelpCircle className="w-4 h-4 text-white" />
          </span>
          <span className="text-sm font-medium">App Tour</span>
        </button>

        <a
          href={(() => {
            const ua = navigator.userAgent || '';
            const isIOS = /iPhone|iPad|iPod/i.test(ua);
            const isAndroid = /Android/i.test(ua);
            return isIOS
              ? 'https://apps.apple.com/app/tacholator/id6757146033'
              : isAndroid
              ? 'https://play.google.com/store/apps/details?id=app.base.mobragedrivingschoolced&pcampaignid=web_share'
              : 'https://apps.apple.com/app/tacholator/id6757146033';
          })()}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:flex w-full items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500 shrink-0">
            <Smartphone className="w-4 h-4 text-white" />
          </span>
          <span className="text-sm font-medium">Download our App</span>
        </a>

        {/* Legal Section */}
        <button
          onClick={() => setLegalOpen(!legalOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-500 shrink-0">
            <Scale className="w-4 h-4 text-white" />
          </span>
          <span className="text-sm font-medium flex-1 text-left">Legal</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${legalOpen ? 'rotate-180' : ''}`} />
        </button>
        {legalOpen && (
          <div className="pl-4 space-y-1">
            {legalItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => { window.location.href = createPageUrl(item.page); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <span className={`flex items-center justify-center w-8 h-8 rounded-xl ${item.iconBg} shrink-0`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </span>
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-slate-200 p-3 space-y-2">
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full justify-start gap-3 text-slate-600 hover:text-slate-700"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>

      </div>
    </div>
  );
}