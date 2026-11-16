import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Loader2, Video } from 'lucide-react';
import VideoResourceFormModal from '@/components/videoresources/VideoResourceFormModal';
import VideoTopicGroup from '@/components/videoresources/VideoTopicGroup';

export default function InstructorVideoTopicDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const topic = new URLSearchParams(window.location.search).get('topic') || '';
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

  const topicVideos = videos
    .filter((video) => (video.topic || 'Other') === topic)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

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

  const handleSave = (payload) => {
    if (editingVideo) updateMutation.mutate({ id: editingVideo.id, data: payload });
    else createMutation.mutate(payload);
  };

  const handleDelete = (video) => {
    if (confirm(`Delete "${video.title}"?`)) deleteMutation.mutate(video.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate('/InstructorVideoResources')}
              className="p-2 -ml-1 rounded-lg text-[#071739] hover:bg-slate-200/60 shrink-0"
              aria-label="Back to topics"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-[#071739] truncate">{topic}</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {topicVideos.length} video{topicVideos.length !== 1 ? 's' : ''}
              </p>
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
        ) : topicVideos.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center">
              <Video className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-500">No videos in this topic yet.</p>
            </CardContent>
          </Card>
        ) : (
          <VideoTopicGroup
            topic={topic}
            videos={topicVideos}
            onToggleVisibility={(video, visible) =>
              updateMutation.mutate({ id: video.id, data: { visibleToPupils: visible } })
            }
            onEdit={(video) => {
              setEditingVideo(video);
              setShowModal(true);
            }}
            onDelete={handleDelete}
          />
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
        defaultTopic={topic}
        saving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}