import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Check, Video } from 'lucide-react';

export default function InstructorVideoPicker({ instructorId, selectedUrl, onSelect }) {
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['instructorVideoLibrary', instructorId],
    queryFn: async () => {
      const page = await base44.entities.InstructorVideoResource.filter(
        { instructorId },
        { sort: '-created_date', limit: 100 }
      );
      return page?.items || [];
    },
    enabled: !!instructorId
  });

  if (isLoading) {
    return <p className="text-sm text-slate-400 py-3">Loading your videos...</p>;
  }

  if (videos.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-3">
        No videos in your library yet. Add them under Video Resources.
      </p>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto">
      {videos.map((video) => {
        const isSelected = selectedUrl === video.videoUrl;
        return (
          <button
            key={video.id}
            type="button"
            onClick={() => onSelect(video)}
            className={`w-full text-left p-3 flex items-start gap-3 transition-colors ${
              isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'
            }`}
          >
            <div className="p-1.5 rounded-md bg-slate-100 shrink-0">
              <Video className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{video.title}</p>
              {video.topic && (
                <Badge variant="secondary" className="mt-1 text-[10px] font-medium">
                  {video.topic}
                </Badge>
              )}
            </div>
            {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0 mt-1" />}
          </button>
        );
      })}
    </div>
  );
}