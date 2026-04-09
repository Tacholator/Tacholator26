import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Youtube, Lock, Play, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LearnerTestRoutes() {
  const navigate = useNavigate();
  const [playingId, setPlayingId] = useState(null);

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

  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ['learnerTestRoutes', pupilProfile?.instructorId],
    queryFn: () => base44.entities.TestRoute.filter({ instructorId: pupilProfile.instructorId }),
    enabled: !!pupilProfile?.instructorId && !!pupilProfile?.testRoutesAccessEnabled
  });

  const videosOnly = routes.filter(r => r.youtubeVideoId);

  if (pupilLoading || routesLoading) {
    return <div className="p-6 text-center py-12 text-slate-500">Loading...</div>;
  }

  if (!pupilProfile?.testRoutesAccessEnabled) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <Card className="max-w-sm w-full">
          <CardContent className="py-16 text-center">
            <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Not Yet Enabled</h3>
            <p className="text-slate-500 text-sm">
              Your instructor hasn't enabled test route videos for you yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/TestReadiness')} className="text-slate-500 hover:text-[#071739]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="text-sm text-slate-500 cursor-pointer hover:text-[#071739]" onClick={() => navigate('/TestReadiness')}>Test Readiness</span>
          </div>
          <h1 className="text-3xl font-bold text-[#071739] mb-2">Test Route Videos</h1>
          <p className="text-slate-600">Watch your instructor's test route videos to prepare for your driving test</p>
        </div>

        {videosOnly.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Youtube className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No videos yet</h3>
              <p className="text-slate-500 text-sm">Your instructor hasn't added any route videos yet. Check back soon.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {videosOnly.map(route => (
              <Card key={route.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {playingId === route.id ? (
                    <div>
                      <div className="relative" style={{ paddingTop: '56.25%' }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${route.youtubeVideoId}?autoplay=1`}
                          title={route.routeName}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        />
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <p className="font-semibold text-[#071739]">{route.routeName}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400"
                          onClick={() => setPlayingId(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="w-full text-left group"
                      onClick={() => setPlayingId(route.id)}
                    >
                      <div className="relative">
                        <img
                          src={`https://img.youtube.com/vi/${route.youtubeVideoId}/mqdefault.jpg`}
                          alt={route.routeName}
                          className="w-full h-44 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                            <Play className="w-6 h-6 text-[#071739] ml-1" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-[#071739]">{route.routeName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Tap to watch</p>
                      </div>
                    </button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}