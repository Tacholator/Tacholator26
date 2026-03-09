import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Youtube, Lock } from 'lucide-react';

export default function LearnerTestRoutes() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupilProfile, isLoading: pupilLoading } = useQuery({
    queryKey: ['learnerPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      const allPupils = await base44.entities.Pupil.list();
      let match = allPupils.find(p => p.linkedUserId === user.id);
      if (!match) match = allPupils.find(p => p.email && p.email.toLowerCase() === user.email.toLowerCase());
      return match || null;
    },
    enabled: !!user?.id
  });

  const { data: centres = [], isLoading: centresLoading } = useQuery({
    queryKey: ['testRouteCentresByInstructor', pupilProfile?.instructorId],
    queryFn: () => base44.entities.TestRouteCentre.filter({ createdByInstructorId: pupilProfile.instructorId }),
    enabled: !!pupilProfile?.instructorId && pupilProfile?.testRoutesAccessEnabled === true
  });

  if (pupilLoading || centresLoading) {
    return <div className="p-6 text-center py-12 text-slate-500">Loading...</div>;
  }

  if (!pupilProfile?.testRoutesAccessEnabled) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#071739] mb-2">Test Routes</h1>
          </div>
          <Card>
            <CardContent className="py-16 text-center">
              <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Not Yet Enabled</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                Your instructor hasn't enabled test route videos for you yet. They'll let you know when access is ready.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#071739] mb-2">Test Routes</h1>
          <p className="text-slate-600">Watch route videos and practice for your driving test</p>
        </div>

        {centres.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No routes added yet</h3>
              <p className="text-slate-600">Your instructor hasn't added any test routes yet. Check back soon.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {centres.map(centre => (
              <Link key={centre.id} to={createPageUrl(`LearnerTestRouteDetail?centreId=${centre.id}`)}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-[#F7B602] mt-0.5 flex-shrink-0" />
                      <span>{centre.centreName}</span>
                    </CardTitle>
                    <CardDescription>{centre.subLocation}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Youtube className="w-4 h-4 text-rose-500" />
                      <span>View routes & videos</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}