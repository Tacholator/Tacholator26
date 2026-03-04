import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Car, ExternalLink } from 'lucide-react';
import PupilProgressTracker from '@/components/progress/PupilProgressTracker';
import RestrictedAccessMessage from '@/components/access/RestrictedAccessMessage';
import NotLinkedBanner from '@/components/learner/NotLinkedBanner';

export default function LearnerProgress() {
  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupil, isLoading } = useQuery({
    queryKey: ['myPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user) return null;
      if (user.id) {
        const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
        if (byLinkedId.length > 0) return byLinkedId[0];
      }
      if (user.email) {
        const allPupils = await base44.entities.Pupil.list();
        const matchingPupil = allPupils.find(p => 
          p.email?.toLowerCase() === user.email.toLowerCase()
        );
        return matchingPupil || null;
      }
      return null;
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F7B602]" />
      </div>
    );
  }

  if (!pupil) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 p-6">
        <Card className="max-w-md text-center p-8">
          <Car className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Account Not Linked</h2>
          <p className="text-slate-500">
            Your account hasn't been linked to a pupil profile yet.
          </p>
        </Card>
      </div>
    );
  }

  if (!pupil.instructorId) {
    return <NotLinkedBanner />;
  }

  // Restrict access for non-active pupils
  if (pupil.status !== 'Active') {
    return <RestrictedAccessMessage pupilStatus={pupil.status} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(createPageUrl('LearnerLearningHub'))}
            className="gap-2 lg:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-[#071739]">Driving Progress</h1>
          <div className="w-32"></div>
        </div>

        {pupil.googleSheetUrl && (
          <Card className="mb-6 border-l-4 border-l-[#F7B602]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">View your detailed progress sheet</p>
                <a href={pupil.googleSheetUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Open Google Sheet
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        <PupilProgressTracker 
          pupilId={pupil.id} 
          instructorId={pupil.instructorId}
          isInstructor={false}
        />
      </div>
    </div>
  );
}