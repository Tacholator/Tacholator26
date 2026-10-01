import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck, ClipboardList, ArrowRight, StickyNote, Scroll } from 'lucide-react';

export default function InstructorMyTeaching() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#071739]">My Teaching</h1>
          <p className="text-slate-600 mt-2">Manage your teaching resources and tools</p>
        </div>

        <div className="grid gap-4">
          <Link to={createPageUrl('InstructorTeachingNotes')}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                      <StickyNote className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-800">Teaching Notes</h3>
                      <p className="text-sm text-slate-500">Personal notes and reminders for teaching</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl('TopTenReasons')}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#071739] flex items-center justify-center">
                      <Scroll className="w-6 h-6 text-[#F7B602]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-800">Top 10 Reasons for Test Fails</h3>
                      <p className="text-sm text-slate-500">The most common reasons learners fail their driving test</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl('AdminDailyQuizzes')}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <ClipboardCheck className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-800">Daily Quizzes</h3>
                      <p className="text-sm text-slate-500">Manage quiz questions and schedule</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}