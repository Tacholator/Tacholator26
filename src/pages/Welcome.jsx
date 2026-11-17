import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { CalendarDays, CreditCard, Map, ShieldCheck, TrendingUp } from 'lucide-react';

const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928de5cfb626066705b29e3/b4113dc99_MobrageLearner33.png';

const markers = [
  { icon: ShieldCheck, label: 'DVSA syllabus' },
  { icon: CalendarDays, label: 'Book lessons' },
  { icon: TrendingUp, label: 'Track progress' },
  { icon: Map, label: 'Test route videos' },
  { icon: CreditCard, label: 'Secure payments' },
];

const rise = (delay) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.2, 0.7, 0.2, 1] },
});

export default function Welcome() {
  const goToSignIn = () => base44.auth.redirectToLogin();

  return (
    <section className="relative isolate w-full min-h-screen overflow-hidden bg-[#071739] text-white">
      <style>{`
        .welcome-rings {
          background: repeating-radial-gradient(circle at 50% 50%,
            rgba(247, 182, 2, 0) 0 12px,
            rgba(247, 182, 2, 0.38) 13px 14px,
            rgba(247, 182, 2, 0) 14.5px 15px);
          -webkit-mask-image: radial-gradient(closest-side, #000 20%, rgba(0,0,0,0) 100%);
          mask-image: radial-gradient(closest-side, #000 20%, rgba(0,0,0,0) 100%);
        }
        .welcome-rings--live { animation: welcome-breathe 8s ease-in-out infinite; }
        @keyframes welcome-breathe {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50%      { transform: scale(1.05); opacity: 1; }
        }
        .welcome-btn {
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 48px; min-width: 180px; padding: 14px 32px;
          border-radius: 999px; font-size: 0.9375rem; font-weight: 600;
          letter-spacing: 0.01em; line-height: 1; white-space: nowrap;
          cursor: pointer; transition: background-color .2s ease, color .2s ease, border-color .2s ease;
        }
        .welcome-btn:focus-visible { outline: 2px solid #F7B602; outline-offset: 3px; }
        .welcome-btn--solid { background: #F7B602; color: #071739; border: 1px solid #F7B602; }
        .welcome-btn--solid:hover { background: #ffc93a; border-color: #ffc93a; }
        .welcome-btn--ghost { background: transparent; color: #ffffff; border: 1px solid rgba(255,255,255,0.55); }
        .welcome-btn--ghost:hover { background: #F7B602; color: #071739; border-color: #F7B602; }
      `}</style>

      {/* Background scene: navy gradient with a yellow ripple vortex */}
      <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(22% 15% at 50% 60%, rgba(247,182,2,0.28) 0%, rgba(247,182,2,0.08) 55%, rgba(247,182,2,0) 100%),' +
              'linear-gradient(180deg, #123061 0%, #0d2450 28%, #0a1d40 52%, #081834 74%, #071739 100%)',
          }}
        />
        <div className="absolute left-1/2 top-[60%] aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2 [transform:perspective(720px)_rotateX(62deg)]">
          <div className="welcome-rings welcome-rings--live absolute inset-[-25%]" />
        </div>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-between gap-10 px-5 pb-10 pt-14 sm:px-10 sm:pt-20 lg:px-20">
        {/* Headline, intro and buttons */}
        <div className="flex w-full max-w-3xl flex-col items-center gap-6 text-center sm:gap-7">
          <motion.div {...rise(0)} className="flex items-center gap-3">
            <img src={LOGO} alt="Tacholator" className="h-11 w-11 rounded-xl object-cover" />
            <span className="text-xl font-bold tracking-tight text-white">Tacholator</span>
          </motion.div>

          <motion.h1
            {...rise(0.06)}
            className="text-balance text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Learn to drive.<br className="hidden sm:inline" /> Pass with confidence.
          </motion.h1>

          <motion.p {...rise(0.12)} className="max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Everything your driving lessons need in one place. Book lessons with your instructor,
            follow your progress and get test-day ready.
          </motion.p>

          <motion.div {...rise(0.18)} className="mt-2 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <button type="button" onClick={goToSignIn} className="welcome-btn welcome-btn--solid">
              Get Started
            </button>
            <button type="button" onClick={goToSignIn} className="welcome-btn welcome-btn--ghost">
              Sign In
            </button>
          </motion.div>
        </div>

        {/* Bottom strip of app markers */}
        <motion.div
          {...rise(0.26)}
          aria-label="What's inside Tacholator"
          className="grid w-full max-w-5xl grid-cols-2 justify-items-center gap-y-7 gap-x-4 text-slate-300 sm:flex sm:flex-wrap sm:items-center sm:justify-between"
        >
          {markers.map(({ icon: Icon, label }, index) => (
            <div
              key={label}
              className={`flex items-center gap-2 ${index === 4 ? 'col-span-2' : ''}`}
            >
              <Icon className="h-4 w-4 shrink-0 text-[#F7B602]" aria-hidden="true" />
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}