import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { FileText, Notebook, Lock, ClipboardList, BookOpen, Pen, Scroll } from 'lucide-react';

const teachingCards = [
  { name: 'Whiteboards', icon: Pen, page: 'InstructorWhiteboardLibrary', color: 'from-cyan-500 to-cyan-600' },
  { name: 'Course Work', icon: FileText, page: 'CourseWork', color: 'from-blue-500 to-blue-600' },
  { name: 'Pupil Notes', icon: Notebook, page: 'InstructorPupilNotes', color: 'from-purple-500 to-purple-600' },
  { name: 'Topic Access', icon: Lock, page: 'InstructorTopicAssignment', color: 'from-amber-500 to-amber-600' },
  { name: 'MCQ Reports', icon: ClipboardList, page: 'InstructorMcqReporting', color: 'from-rose-500 to-rose-600' },
  { name: 'Resources', icon: BookOpen, page: 'InstructorResources', color: 'from-teal-500 to-teal-600' },
  { name: 'Homework', icon: ClipboardList, page: 'HomeworkLibrary', color: 'from-indigo-500 to-indigo-600' },
  { name: 'Ten Commandments', icon: Scroll, page: 'TenCommandments', color: 'from-amber-500 to-amber-700' }
];

export default function InstructorTeachingHub() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-6xl mx-auto">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" className="mb-6 gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-2">My Teaching</h1>
          <p className="text-slate-600">Access your teaching materials and pupil information</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {teachingCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.page}
                to={createPageUrl(card.page)}
                className="group"
              >
                <div className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 h-40 flex flex-col items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                  <Icon className="w-10 h-10 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold text-center text-sm lg:text-base">{card.name}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}