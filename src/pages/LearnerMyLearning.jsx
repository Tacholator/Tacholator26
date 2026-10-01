import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PupilClassNotes from '@/components/classnotes/PupilClassNotes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Award, TrendingUp, Clock, ChevronRight, ClipboardList, NotebookPen, StickyNote, Scroll } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LearnerMyLearning() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupilProfile } = useQuery({
    queryKey: ['learnerPupilProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byLinkedId.length > 0) return byLinkedId[0];
      const byEmail = await base44.entities.Pupil.filter({ email: user.email });
      return byEmail.length > 0 ? byEmail[0] : null;
    },
    enabled: !!user?.id
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#071739]">My Learning</h1>
          <p className="text-slate-600 mt-2">Track your learning progress and achievements</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Learning Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Your learning statistics and progress will appear here
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="w-5 h-5 text-[#F7B602]" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Track your milestones and achievements
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                View your overall learning progress
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-purple-600" />
                Study Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Track your study hours and practice time
              </p>
            </CardContent>
          </Card>

          {/* Mock Tests card */}
          <Link to="/LearnerMockTests" className="block">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardList className="w-5 h-5 text-[#071739]" />
                  Mock Tests
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  View your mock test reports and results
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Learning Diary card */}
          <Link to="/LearnerDiary" className="block">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <NotebookPen className="w-5 h-5 text-indigo-600" />
                  Learning Diary
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  View notes and feedback from your driving lessons
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Learning Notes card */}
          <Link to="/LearnerLearningNotes" className="block">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <StickyNote className="w-5 h-5 text-orange-500" />
                  Learning Notes
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Your personal notes for all 24 driving skills
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Top 10 Reasons for Test Fails card */}
          <Link to="/TopTenReasons" className="block">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Scroll className="w-5 h-5 text-[#F7B602]" />
                  Top 10 Reasons for Test Fails
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  The most common reasons learners fail their driving test
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Class Notes card */}
          <Link to="/LearnerClassNotes" className="block">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  Class Notes
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  View whiteboard notes saved by your instructor
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Class Notes Section */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#071739] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              Class Notes
            </h2>
            <p className="text-slate-500 text-sm mt-1">Whiteboard notes saved by your instructor during lessons</p>
          </div>
          {pupilProfile ? (
            <PupilClassNotes pupilId={pupilProfile.id} />
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-10 text-center text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No class notes yet — your instructor will add them during lessons</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}