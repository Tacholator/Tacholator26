import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play, X, Video, ExternalLink } from 'lucide-react';
import { extractYouTubeId, youtubeThumbnail } from '@/lib/youtube';

export default function LearnerVideoCard({ video, isPlaying, onPlay, onClose }) {
  const videoId = video.videoId || extractYouTubeId(video.videoUrl);
  const thumb = youtubeThumbnail(videoId || video.videoUrl);

  if (isPlaying && videoId) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative" style={{ paddingTop: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
          <div className="p-3 flex items-center justify-between gap-2">
            <p className="font-semibold text-[#071739] truncate">{video.title}</p>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 shrink-0"
              aria-label="Close video"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Videos that don't resolve to a YouTube ID open directly in a new tab
  if (!videoId) {
    return (
      <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="block">
        <Card className="overflow-hidden hover:border-[#F7B602] transition-colors">
          <CardContent className="p-3 flex gap-3 items-center">
            <div className="w-24 h-14 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-slate-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-800 text-sm leading-snug">{video.title}</p>
              {video.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{video.description}</p>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-[#071739] font-medium mt-1">
                <ExternalLink className="w-3 h-3" /> Watch
              </span>
            </div>
          </CardContent>
        </Card>
      </a>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <button type="button" className="w-full text-left group" onClick={onPlay}>
          <div className="relative">
            {thumb ? (
              <img src={thumb} alt={video.title} className="w-full h-40 object-cover bg-slate-100" />
            ) : (
              <div className="w-full h-40 bg-slate-100" />
            )}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 text-[#071739] ml-1" />
              </div>
            </div>
          </div>
          <div className="p-3">
            <p className="font-semibold text-[#071739] leading-snug">{video.title}</p>
            {video.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{video.description}</p>
            )}
          </div>
        </button>
      </CardContent>
    </Card>
  );
}