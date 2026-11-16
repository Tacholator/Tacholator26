import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Loader2, Video } from 'lucide-react';
import VideoResourceFormModal from '@/components/videoresources/VideoResourceFormModal';
import VideoTopicGroup from '@/components/videoresources/VideoTopicGroup';
import { courseWorkTopics } from '@/components/coursework/topicIndex';

const topicRank = (topic) => {
  const index = courseWorkTopics.findIndex((t) => t.title === topic);
  return index === -1 ? courseWorkTopics.length : index;
};

export default function InstructorVideoResources() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['instructorVideoResources', user?.id],
    queryFn: () => base44.entities.InstructorVideoResource.filter({ instructorId: user.id }),
    enabled: !!user?.id,
  });

  const invalidate = () => queryClient.invalidateQueries(['instructorVideoResources']);

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.InstructorVideoResource.create({
        ...data,
        instructorId: user.id,
        instructorEmail: user.email,
        visibleToPupils: false,
      }),
    onSuccess: () => {
      invalidate();
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InstructorVideoResource.update(id, data),
    onSuccess: () => {
      invalidate();
      setShowModal(false);
      setEditingVideo(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InstructorVideoResource.delete(id),
    onSuccess: invalidate,
  });

  const toggleVisibility = (video, visible) =>
    updateMutation.mutate({ id: video.id, data: { visibleToPupils: visible } });

  const handleDelete = (video) => {
    if (confirm(`Delete "${video.title}"?`)) deleteMutation.mutate(video.id);
  };

  const handleSave = (payload) => {
    if (editingVideo) updateMutation.mutate({ id: editingVideo.id, data: payload });
    else createMutation.mutate(payload);
  };

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

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7B602] flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-[#071739]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#071739]">Video Resources</h1>
              <p className="text-xs sm:text-sm text-slate-500">Group your video links by topic</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingVideo(null);
              setShowModal(true);
            }}
            className="bg-[#071739] hover:bg-[#0a2142] shrink-0"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add video</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
          </div>
        ) : grouped.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center">
              <Video className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-500">No videos yet. Add your first video under a topic.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {grouped.map((group) => (
              <VideoTopicGroup
                key={group.topic}
                topic={group.topic}
                videos={group.items}
                onToggleVisibility={toggleVisibility}
                onEdit={(video) => {
                  setEditingVideo(video);
                  setShowModal(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <VideoResourceFormModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingVideo(null);
        }}
        onSave={handleSave}
        initialVideo={editingVideo}
        saving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}