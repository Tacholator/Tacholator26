import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, ListOrdered, MessageCircleQuestion, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QA_ITEMS = [
  { question: 'What could happen if your seating position is too far from the pedals?', answer: 'You may not be able to press the pedals fully or react quickly in an emergency.' },
  { question: 'Why is it important to check the doors before driving away?', answer: 'An open or poorly closed door could be dangerous for passengers, pedestrians, cyclists, or other road users.' },
  { question: 'How can poor mirror adjustment affect your driving?', answer: 'It can reduce your awareness and increase the risk of missing vehicles, cyclists, pedestrians, or hazards around you.' },
  { question: 'Why must the seatbelt be worn correctly and not twisted?', answer: 'A twisted or poorly fitted seatbelt may not protect you properly in a crash or sudden stop.' },
  { question: 'Why is it important to feel comfortable and in control before moving off?', answer: 'If you are uncomfortable or badly positioned, your focus, steering, braking, and decision-making can be affected.' },
  { question: 'What danger could poor steering position create?', answer: 'It could make it harder to steer smoothly, react quickly, or control the vehicle in tight spaces or emergencies.' },
  { question: 'Why should the driver check their seating and mirrors after someone else has used the car?', answer: 'Because the previous driver\u2019s settings may not suit them, which could affect visibility, comfort, and control.' },
  { question: 'How can skipping the cockpit drill affect the whole drive?', answer: 'It can lead to poor control, reduced awareness, discomfort, and a higher risk of mistakes or accidents.' },
];

function QaItem({ index, item }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0 py-4">
      <div className="flex items-start gap-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#071739] text-white font-bold text-sm shrink-0">{index}</span>
        <p className="flex-1 text-sm font-medium text-[#071739] pt-0.5">{item.question}</p>
        <button
          onClick={() => setRevealed(!revealed)}
          className={`shrink-0 p-2 rounded-lg transition-colors ${revealed ? 'bg-[#F7B602] text-[#071739]' : 'text-slate-400 hover:bg-slate-100 hover:text-[#F7B602]'}`}
          title={revealed ? 'Hide answer' : 'Reveal answer'}
        >
          <Lightbulb className="w-5 h-5" />
        </button>
      </div>
      {revealed && (
        <p className="mt-3 ml-10 text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100">{item.answer}</p>
      )}
    </div>
  );
}

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
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-slate-700">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F7B602] text-[#071739] font-bold text-sm shrink-0">D</span>
                <span className="pt-0.5">Doors</span>
              </li>
              <li className="flex gap-3 text-sm text-slate-700">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F7B602] text-[#071739] font-bold text-sm shrink-0">S</span>
                <span className="pt-0.5">Seat</span>
              </li>
              <li className="flex gap-3 text-sm text-slate-700">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F7B602] text-[#071739] font-bold text-sm shrink-0">S</span>
                <span className="pt-0.5">Steering</span>
              </li>
              <li className="flex gap-3 text-sm text-slate-700">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F7B602] text-[#071739] font-bold text-sm shrink-0">S</span>
                <span className="pt-0.5">Seatbelt</span>
              </li>
              <li className="flex gap-3 text-sm text-slate-700">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F7B602] text-[#071739] font-bold text-sm shrink-0">M</span>
                <span className="pt-0.5">Mirrors</span>
              </li>
            </ul>
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
            {QA_ITEMS.map((item, i) => (
              <QaItem key={i} index={i + 1} item={item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}