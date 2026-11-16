import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Film, ChevronRight } from 'lucide-react';
import useLearnerInstructorVideos from '@/hooks/useLearnerInstructorVideos';

export default function LearnerVideoResourcesCard() {
  const { groups, isLoading } = useLearnerInstructorVideos();
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ring-1 ring-[#F7B602]/20">
      <div className="bg-[#071739] px-4 py-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#F7B602] flex items-center justify-center shrink-0">
          <Film className="w-5 h-5 text-[#071739]" />
        </div>
        <h3 className="text-lg font-semibold text-white">Video Resources</h3>
        {!isLoading && total > 0 && (
          <span className="ml-auto text-xs font-semibold text-[#F7B602]">
            {total} video{total === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="p-4">
        {isLoading ? (
          <p className="text-sm text-slate-400 py-4">Loading...</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-slate-500 py-3">
            Your instructor hasn't shared any videos yet.
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {groups.map((group) => (
              <div
                key={group.topic}
                className="flex-none w-40 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-3"
              >
                <p className="text-xs font-semibold text-amber-950 leading-snug line-clamp-2 min-h-[2rem]">
                  {group.topic}
                </p>
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mt-2">
                  {group.items.length} video{group.items.length === 1 ? '' : 's'}
                </p>
              </div>
            ))}
          </div>
        )}

        <Link to={createPageUrl('LearnerVideoResources')}>
          <Button variant="outline" className="w-full gap-1 mt-4 border-[#F7B602] text-[#071739] hover:bg-amber-50">
            View More <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}