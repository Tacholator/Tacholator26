import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PlayCircle, MapPin } from 'lucide-react';
import { youtubeThumbnail } from '@/lib/youtube';
import { EXIT_DIRECTION_LABELS, sortRoutesByExitDirection } from '@/lib/routeGroups';

export default function TestRoutesSection() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pupilProfile } = useQuery({
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

  const { data: instructorRoutes = [] } = useQuery({
    queryKey: ['learnerFreeInstructorRoutes', pupilProfile?.instructorId],
    queryFn: () => base44.entities.TestRoute.filter({ instructorId: pupilProfile.instructorId }),
    enabled: accessEnabled && !!pupilProfile?.instructorId
  });

  const { data: adminRoutes = [] } = useQuery({
    queryKey: ['learnerFreeAdminCityRoutes'],
    queryFn: async () => {
      const all = await base44.entities.TestRoute.list();
      return all.filter(r => !r.centreId && r.city);
    },
    enabled: accessEnabled
  });

  const routes = useMemo(() => {
    // Catalogue routes carry the exit direction; instructor copies of the same
    // video often don't, so inherit it to keep the left/right grouping intact.
    const catalogueExitByVideo = {};
    adminRoutes.forEach(r => {
      if (r.youtubeVideoId && r.exitDirection) catalogueExitByVideo[r.youtubeVideoId] = r.exitDirection;
    });
    const seen = new Set();
    const combined = [];
    const push = (r) => {
      if (!r || !r.youtubeVideoId) return;
      if (seen.has(r.youtubeVideoId)) return;
      seen.add(r.youtubeVideoId);
      combined.push({ ...r, exitDirection: r.exitDirection || catalogueExitByVideo[r.youtubeVideoId] || null });
    };
    instructorRoutes.forEach(push);
    adminRoutes.forEach(push);
    return sortRoutesByExitDirection(combined);
  }, [instructorRoutes, adminRoutes]);

  const groups = useMemo(() => {
    const keys = [...new Set(routes.map(r => r.exitDirection || 'none'))];
    return keys.map(key => ({
      key,
      label: EXIT_DIRECTION_LABELS[key],
      routes: routes.filter(r => (r.exitDirection || 'none') === key)
    }));
  }, [routes]);

  if (!accessEnabled || routes.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center gap-2 mb-3 px-2">
        <MapPin className="w-4 h-4 text-[#F7B602]" />
        <h4 className="text-sm font-semibold text-[#071739]">Test Routes</h4>
      </div>
      {groups.map((group) => (
        <div key={group.key} className="mb-3 last:mb-0">
          <div className="flex items-center gap-2 px-2 mb-2">
            <span className="text-xs font-semibold text-[#071739]">{group.label}</span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
              {group.routes.length}
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 px-2 scrollbar-thin snap-x snap-mandatory">
            {group.routes.map((r) => {
              const thumb = r.youtubeVideoId
                ? `https://img.youtube.com/vi/${r.youtubeVideoId}/hqdefault.jpg`
                : youtubeThumbnail(r.youtubeUrl);
              const href = r.youtubeUrl || (r.youtubeVideoId ? `https://www.youtube.com/watch?v=${r.youtubeVideoId}` : null);
              return (
                <a
                  key={r.id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-44 shrink-0 snap-start"
                >
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100">
                    {thumb ? (
                      <img src={thumb} alt={r.routeName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayCircle className="w-10 h-10 text-slate-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <PlayCircle className="w-10 h-10 text-white opacity-90 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-800 line-clamp-1">{r.routeName}</p>
                  {r.city && (
                    <p className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {r.city}
                    </p>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}