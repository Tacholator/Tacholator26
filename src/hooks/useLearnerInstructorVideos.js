import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { courseWorkTopics } from '@/components/coursework/topicIndex';

const topicRank = (topic) => {
  const index = courseWorkTopics.findIndex((t) => t.title === topic);
  return index === -1 ? courseWorkTopics.length : index;
};

/**
 * Loads the videos an instructor has made visible to the signed-in learner,
 * grouped by topic and ordered by the coursework topic index.
 */
export default function useLearnerInstructorVideos() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
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
    enabled: !!user?.id,
  });

  const instructorId = pupilProfile?.instructorId;
  const instructorEmail = pupilProfile?.instructorEmail;

  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['learnerInstructorVideos', instructorId, instructorEmail],
    queryFn: async () => {
      if (instructorId) {
        return base44.entities.InstructorVideoResource.filter({
          instructorId,
          visibleToPupils: true,
        });
      }
      // Fallback for pupils linked only by instructor email
      if (instructorEmail) {
        return base44.entities.InstructorVideoResource.filter({
          instructorEmail,
          visibleToPupils: true,
        });
      }
      return [];
    },
    enabled: !!instructorId || !!instructorEmail,
  });

  const groups = useMemo(() => {
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

  return { groups, isLoading: !user || pupilLoading || videosLoading };
}