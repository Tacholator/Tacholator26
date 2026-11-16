import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Youtube, ChevronRight } from 'lucide-react';

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

  const leftCount = uniqueRoutes.filter((r) => r.exitDirection === 'left').length;
  const rightCount = uniqueRoutes.filter((r) => r.exitDirection === 'right').length;

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
        ) : uniqueRoutes.length === 0 ? (
          <p className="text-sm text-slate-500 py-3">
            No route videos from your instructor yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 p-3">
              <p className="text-2xl font-bold text-sky-900 leading-none">{leftCount}</p>
              <p className="text-[11px] font-semibold text-sky-700 uppercase tracking-wide mt-1">
                Exiting left
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-3">
              <p className="text-2xl font-bold text-emerald-900 leading-none">{rightCount}</p>
              <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide mt-1">
                Exiting right
              </p>
            </div>
          </div>
        )}

        <Link to={createPageUrl('LearnerFreeTestRoutes')}>
          <Button variant="outline" className="w-full gap-1 mt-4 border-[#F7B602] text-[#071739] hover:bg-amber-50">
            View More <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}