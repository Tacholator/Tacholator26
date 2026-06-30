import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, ListOrdered, MessageCircleQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PupilTopicDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const topicName = urlParams.get('topic') || 'Topic';
  const pupilId = urlParams.get('pupilId');
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/PupilProfile?id=${pupilId}&tab=topics`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-[#071739]">{topicName}</h1>
      </div>

      <div className="space-y-6">
        {/* Learning Objectives */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F7B602]/15 text-[#071739]">
              <Target className="w-5 h-5 text-[#F7B602]" />
            </div>
            <h2 className="text-lg font-semibold text-[#071739]">Learning Objectives</h2>
          </div>
          <div className="p-5">
            <p className="text-sm font-medium text-[#071739] mb-3">By the end of the lesson:</p>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-slate-700">
                <span className="text-[#F7B602] font-bold mt-0.5">•</span>
                <span>The learner will understand the purpose of cockpit drills and how they help prepare the driver and vehicle safely before moving off.</span>
              </li>
              <li className="flex gap-3 text-sm text-slate-700">
                <span className="text-[#F7B602] font-bold mt-0.5">•</span>
                <span>The learner will be able to carry out the full cockpit drill routine independently: <strong className="text-[#071739]">Doors, Seat, Steering, Seatbelt and Mirrors</strong>.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Procedure - D S S S M */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F7B602]/15 text-[#071739]">
              <ListOrdered className="w-5 h-5 text-[#F7B602]" />
            </div>
            <h2 className="text-lg font-semibold text-[#071739]">Procedure - D S S S M</h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-slate-500">Content coming soon</p>
          </div>
        </section>

        {/* Q&A */}
        <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F7B602]/15 text-[#071739]">
              <MessageCircleQuestion className="w-5 h-5 text-[#F7B602]" />
            </div>
            <h2 className="text-lg font-semibold text-[#071739]">Q&A</h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-slate-500">Content coming soon</p>
          </div>
        </section>
      </div>
    </div>
  );
}