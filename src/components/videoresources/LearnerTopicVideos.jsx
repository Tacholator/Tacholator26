import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Loader2, ExternalLink } from 'lucide-react';
import { youtubeThumbnail } from '@/lib/youtube';
import { courseWorkTopics } from '@/components/coursework/topicIndex';

const topicRank = (topic) => {
  const index = courseWorkTopics.findIndex((t) => t.title === topic);
  return index === -1 ? courseWorkTopics.length : index;
};

export default function LearnerTopicVideos({ instructorId }) {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!instructorId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    base44.entities.InstructorVideoResource
      .filter({ instructorId, visibleToPupils: true })
      .then((items) => {
        if (active) setVideos(items);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [instructorId]);

  const grouped = useMemo(() => {
    const map = new Map();
    [...videos]
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
      .forEach((video) => {
        const key = video.topic || 'Other';
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(video);
      });
    return Array.from(map, ([topic, items]) => ({ topic, items })).sort(
      (a, b) => topicRank(a.topic) - topicRank(b.topic)
    );
  }, [videos]);

  if (isLoading) return null;
  if (grouped.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-lg font-semibold text-slate-800">Videos from your instructor</h2>
      {grouped.map((group) => (
        <Card key={group.topic} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-[#071739] mb-3 flex items-center gap-2">
              <Video className="w-4 h-4 text-[#F7B602]" />
              {group.topic}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.items.map((video) => {
                const thumb = video.videoId
                  ? `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`
                  : youtubeThumbnail(video.videoUrl);
                return (
                  <a
                    key={video.id}
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 p-2 rounded-xl border border-slate-200 hover:border-[#F7B602] transition-colors"
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={video.title}
                        className="w-24 h-14 rounded-md object-cover shrink-0 bg-slate-100"
                      />
                    ) : (
                      <div className="w-24 h-14 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                        <Video className="w-5 h-5 text-slate-300" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 leading-snug">{video.title}</p>
                      {video.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{video.description}</p>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-[#071739] font-medium mt-1">
                        <ExternalLink className="w-3 h-3" /> Watch
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}