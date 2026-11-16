import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Film } from 'lucide-react';
import LearnerVideoCard from '@/components/videoresources/LearnerVideoCard';
import { courseWorkTopics } from '@/components/coursework/topicIndex';

const topicRank = (topic) => {
  const index = courseWorkTopics.findIndex((t) => t.title === topic);
  return index === -1 ? courseWorkTopics.length : index;
};

export default function LearnerVideoResources() {
  const [playingId, setPlayingId] = useState(null);

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

  const instructorId = pupilProfile?.instructorId;

  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['learnerInstructorVideos', instructorId],
    queryFn: () =>
      base44.entities.InstructorVideoResource.filter({
        instructorId,
        visibleToPupils: true
      }),
    enabled: !!instructorId
  });

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

  if (pupilLoading || videosLoading) {
    return <div className="p-6 text-center py-12 text-slate-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#071739] mb-1">Video Resources</h1>
          <p className="text-sm sm:text-base text-slate-600">
            Videos your instructor has shared to help with your lessons.
          </p>
        </div>

        {grouped.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Film className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No videos yet</h3>
              <p className="text-slate-500 text-sm">
                Your instructor hasn't shared any video resources with you yet. Check back soon.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.topic}>
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                  <Film className="w-4 h-4 text-[#F7B602]" />
                  <h2 className="text-lg font-semibold text-[#071739]">{group.topic}</h2>
                  <span className="text-xs text-slate-500">({group.items.length})</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {group.items.map((video) => (
                    <LearnerVideoCard
                      key={video.id}
                      video={video}
                      isPlaying={playingId === video.id}
                      onPlay={() => setPlayingId(video.id)}
                      onClose={() => setPlayingId(null)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}