import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { PlayCircle, Video } from 'lucide-react';
import { youtubeThumbnail } from '@/lib/youtube';
import TestRoutesSection from '@/components/dashboard/TestRoutesSection';

export default function VideoResourcesBento() {
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['learnerVideos'],
    queryFn: async () => {
      const all = await base44.entities.LearnerVideo.filter({ published: true });
      return all.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  });

  if (!isLoading && videos.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100"
    >
      {/* Navy header with gold accent */}
      <div className="bg-[#071739] px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#F7B602] flex items-center justify-center shrink-0">
          <Video className="w-5 h-5 text-[#071739]" />
        </div>
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-base">Video Resources</h3>
        </div>
      </div>

      {/* Video cards row */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-3 px-2 scrollbar-thin">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-44 h-28 rounded-xl bg-slate-100 animate-pulse shrink-0" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-3 px-2 scrollbar-thin snap-x snap-mandatory">
            {videos.map((v) => {
              const thumb = v.youtubeVideoId
                ? `https://img.youtube.com/vi/${v.youtubeVideoId}/hqdefault.jpg`
                : youtubeThumbnail(v.youtubeUrl);
              return (
                <a
                  key={v.id}
                  href={v.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-44 shrink-0 snap-start"
                >
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100">
                    {thumb ? (
                      <img src={thumb} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayCircle className="w-10 h-10 text-slate-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <PlayCircle className="w-10 h-10 text-white opacity-90 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-800 line-clamp-2">{v.title}</p>
                  {v.description && (
                    <p className="text-xs text-slate-500 line-clamp-1">{v.description}</p>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Subtle divider before Test Routes */}
      <div className="mx-6 border-t border-slate-100" />

      <TestRoutesSection />
    </motion.div>
  );
}