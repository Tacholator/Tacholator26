import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Youtube, Lock, Play, X, Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LearnerFreeTestRoutes() {
  const navigate = useNavigate();
  const [playingId, setPlayingId] = useState(null);
  const [search, setSearch] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupilProfile, isLoading: pupilLoading } = useQuery({
    queryKey: ['learnerPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id) return null;
      const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byLinkedId.length > 0) return byLinkedId[0];
      if (user?.email) {
        const byEmail = await base44.entities.Pupil.filter({ email: user.email });
        if (byEmail.length > 0) return byEmail[0];
      }
      return null;
    },
    enabled: !!user?.id
  });

  const accessEnabled = !!pupilProfile?.testRoutesAccessEnabled;

  // Instructor's own route videos
  const { data: instructorRoutes = [], isLoading: instructorRoutesLoading } = useQuery({
    queryKey: ['learnerFreeInstructorRoutes', pupilProfile?.instructorId],
    queryFn: () => base44.entities.TestRoute.filter({ instructorId: pupilProfile.instructorId }),
    enabled: accessEnabled && !!pupilProfile?.instructorId
  });

  // Admin-managed city routes (no centreId, city set)
  const { data: adminRoutes = [], isLoading: adminRoutesLoading } = useQuery({
    queryKey: ['learnerFreeAdminCityRoutes'],
    queryFn: async () => {
      const all = await base44.entities.TestRoute.list();
      return all.filter(r => !r.centreId && r.city);
    },
    enabled: accessEnabled
  });

  const isLoading = pupilLoading || (accessEnabled && (instructorRoutesLoading || adminRoutesLoading));

  const mergedRoutes = useMemo(() => {
    const seen = new Set();
    const combined = [];
    const push = (r) => {
      if (!r || !r.youtubeVideoId) return;
      const key = r.youtubeVideoId + '|' + (r.routeName || '');
      if (seen.has(key)) return;
      seen.add(key);
      combined.push({ ...r, source: r.instructorId ? 'instructor' : 'catalogue' });
    };
    instructorRoutes.forEach(push);
    adminRoutes.forEach(push);
    return combined;
  }, [instructorRoutes, adminRoutes]);

  const filteredRoutes = useMemo(() => {
    if (!search.trim()) return mergedRoutes;
    const q = search.toLowerCase();
    return mergedRoutes.filter(r =>
      (r.routeName || '').toLowerCase().includes(q) ||
      (r.city || '').toLowerCase().includes(q)
    );
  }, [mergedRoutes, search]);

  if (isLoading) {
    return <div className="p-6 text-center py-12 text-slate-500">Loading...</div>;
  }

  if (!accessEnabled) {
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
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-[#071739]">Test Routes</h1>
            <Badge className="bg-emerald-500 text-white font-semibold text-xs">FREE</Badge>
          </div>
          <p className="text-slate-600">
            Free route walkthroughs from your instructor and the national catalogue.
          </p>
        </div>

        {mergedRoutes.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search routes by name or city..."
              className="pl-9"
            />
          </div>
        )}

        {filteredRoutes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Youtube className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {mergedRoutes.length === 0 ? 'No routes yet' : 'No matches found'}
              </h3>
              <p className="text-slate-500 text-sm">
                {mergedRoutes.length === 0
                  ? 'No test route videos are available right now. Check back soon.'
                  : 'Try a different search term.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredRoutes.map(route => (
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
                      <div className="p-3 flex items-center justify-between gap-2">
                        <p className="font-semibold text-[#071739] truncate">{route.routeName}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 shrink-0"
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
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[#071739] truncate">{route.routeName}</p>
                          {route.city && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400 shrink-0">
                              <MapPin className="w-3 h-3" />
                              {route.city}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {route.source === 'instructor' ? 'From your instructor' : 'National catalogue'}
                        </p>
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