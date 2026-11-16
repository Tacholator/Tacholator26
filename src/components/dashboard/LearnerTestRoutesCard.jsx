import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Youtube, ChevronRight, Play } from 'lucide-react';

const routesUrl = () => createPageUrl('LearnerFreeTestRoutes');

export default function LearnerTestRoutesCard({ pupil }) {
  const accessEnabled = !!pupil?.testRoutesAccessEnabled;

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['dashboardTestRoutes', pupil?.instructorId],
    queryFn: () => base44.entities.TestRoute.filter({ instructorId: pupil.instructorId }),
    enabled: accessEnabled && !!pupil?.instructorId,
  });

  const uniqueRoutes = React.useMemo(() => {
    const seen = new Set();
    return routes.filter((r) => {
      if (!r?.youtubeVideoId || seen.has(r.youtubeVideoId)) return false;
      seen.add(r.youtubeVideoId);
      return true;
    });
  }, [routes]);

  const previewRoutes = uniqueRoutes.slice(0, 2);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ring-1 ring-[#F7B602]/20">
      <div className="bg-[#071739] px-4 py-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#F7B602] flex items-center justify-center shrink-0">
          <Youtube className="w-5 h-5 text-[#071739]" />
        </div>
        <h3 className="text-lg font-semibold text-white">Test Route Videos</h3>
        {accessEnabled && !isLoading && uniqueRoutes.length > 0 && (
          <span className="ml-auto text-xs font-semibold text-[#F7B602]">
            {uniqueRoutes.length} route{uniqueRoutes.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="p-4">
        {!accessEnabled ? (
          <p className="text-sm text-slate-500 py-3">
            Your instructor hasn't enabled test route videos for you yet.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-slate-400 py-4">Loading...</p>
        ) : previewRoutes.length === 0 ? (
          <p className="text-sm text-slate-500 py-3">
            No route videos from your instructor yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {previewRoutes.map((route) => (
              <Link
                key={route.id}
                to={routesUrl()}
                className="group block rounded-xl overflow-hidden bg-slate-50 border border-slate-100"
              >
                <div className="relative">
                  <img
                    src={`https://img.youtube.com/vi/${route.youtubeVideoId}/mqdefault.jpg`}
                    alt={route.routeName}
                    className="w-full h-20 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-4 h-4 text-[#071739] ml-0.5" />
                    </div>
                  </div>
                </div>
                <p className="p-2 text-xs font-semibold text-[#071739] leading-snug line-clamp-2 min-h-[2.25rem]">
                  {route.routeName}
                </p>
              </Link>
            ))}
          </div>
        )}

        <Link to={routesUrl()}>
          <Button className="w-full gap-1 mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
            View More <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}