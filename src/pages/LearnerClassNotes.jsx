import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PupilClassNotes from '@/components/classnotes/PupilClassNotes';
import { BookOpen } from 'lucide-react';

export default function LearnerClassNotes() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupilProfile, isLoading } = useQuery({
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
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#071739] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-600" />
            Class Notes
          </h1>
          <p className="text-slate-500 text-sm mt-1">Whiteboard notes saved by your instructor during lessons</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : pupilProfile ? (
          <PupilClassNotes pupilId={pupilProfile.id} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <BookOpen className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium text-slate-500">No class notes yet</p>
            <p className="text-sm mt-1">Your instructor will add notes here during lessons</p>
          </div>
        )}
      </div>
    </div>
  );
}