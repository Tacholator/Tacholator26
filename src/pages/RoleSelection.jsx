import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Loader2, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RoleSelection() {
  const navigate = useNavigate();
  const [selecting, setSelecting] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleSelect = async (role) => {
    setSelecting(role);
    try {
      await base44.auth.updateMe({ userType: role });

      if (role === 'instructor') {
        // Create an Instructor profile for this user
        const fullName = user?.full_name || user?.email?.split('@')[0] || '';
        await base44.entities.Instructor.create({
          name: fullName,
        });
      }

      navigate(createPageUrl('Home'));
    } catch (error) {
      console.error('Failed to set role:', error);
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#071739] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-12"
      >
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928de5cfb626066705b29e3/b4113dc99_MobrageLearner33.png"
          alt="Tacholator"
          className="w-12 h-12 rounded-xl object-cover"
        />
        <span className="font-bold text-2xl text-white">Tacholator</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Welcome! How will you use Tacholator?</h1>
        <p className="text-slate-400 text-lg">Choose your role to get started</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Instructor Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => handleSelect('instructor')}
            disabled={!!selecting}
            className="w-full bg-white rounded-2xl p-8 text-left hover:shadow-2xl hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-[#F7B602] group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#F7B602] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              {selecting === 'instructor' ? (
                <Loader2 className="w-8 h-8 text-[#071739] animate-spin" />
              ) : (
                <Car className="w-8 h-8 text-[#071739]" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-[#071739] mb-2">I'm an Instructor</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Manage your pupils, schedule lessons, track progress, and grow your driving school business.
            </p>
            <div className="mt-6 text-[#F7B602] font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
              Get started as Instructor →
            </div>
          </button>
        </motion.div>

        {/* Learner Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => handleSelect('learner')}
            disabled={!!selecting}
            className="w-full bg-white rounded-2xl p-8 text-left hover:shadow-2xl hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-[#F7B602] group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#071739] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              {selecting === 'learner' ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <BookOpen className="w-8 h-8 text-[#F7B602]" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-[#071739] mb-2">I'm a Learner</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Track your driving progress, view lessons, complete coursework, and prepare for your test.
            </p>
            <div className="mt-6 text-[#071739] font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
              Get started as Learner →
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}