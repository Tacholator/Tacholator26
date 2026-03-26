import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, FileText, CheckCircle, Lock, Video, Plus, Pencil } from 'lucide-react';
import LockedContentDialog from '@/components/coursework/LockedContentDialog';

const extractYoutubeId = (url) => {
  const match = url.match(/(?:v=|embed\/|youtu\.be\/|shorts\/)([\\w-]{11})/);
  return match ? match[1] : null;
};

export default function CourseWorkSubcardSelect({ itemId, content, isInstructor, hasStudyAccess, hasMcqAccess }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showLockedDialog, setShowLockedDialog] = useState(false);
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [videoInput, setVideoInput] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: courseWorkVideo } = useQuery({
    queryKey: ['courseWorkVideo', itemId],
    queryFn: async () => {
      const videos = await base44.entities.CourseWorkVideo.filter({ topicId: itemId });
      return videos[0] || null;
    },
    enabled: !!itemId
  });

  const saveVideoMutation = useMutation({
    mutationFn: async (url) => {
      const videoId = extractYoutubeId(url);
      const data = { topicId: itemId, youtubeUrl: url, youtubeVideoId: videoId || '' };
      if (courseWorkVideo) {
        return base44.entities.CourseWorkVideo.update(courseWorkVideo.id, data);
      }
      return base44.entities.CourseWorkVideo.create({ ...data, instructorId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['courseWorkVideo', itemId]);
      setIsEditingVideo(false);
    }
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async () => {
      if (courseWorkVideo) {
        return base44.entities.CourseWorkVideo.delete(courseWorkVideo.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['courseWorkVideo', itemId])
  });

  const handleSubcardClick = (type) => {
    if (type === 'study' && !hasStudyAccess) { setShowLockedDialog(true); return; }
    if (type === 'practice' && !hasMcqAccess) { setShowLockedDialog(true); return; }
    navigate(createPageUrl('CourseWorkDetail') + `?id=${itemId}&subcard=${type}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('CourseWork')}>
          <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Course Work
          </Button>
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-[#071739]" />
            <h1 className="text-3xl font-bold text-[#071739]">{content.title}</h1>
          </div>
          <p className="text-slate-500 text-sm">Choose a section below</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Study Material Card */}
          <Card
            onClick={() => handleSubcardClick('study')}
            className={`hover:shadow-xl transition-all cursor-pointer h-full border-t-4 border-t-orange-400 hover:border-t-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 relative ${!hasStudyAccess ? 'opacity-75' : ''}`}
          >
            {!hasStudyAccess && !isInstructor && (
              <div className="absolute top-4 right-4 bg-white/90 rounded-full p-2 shadow-sm">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
            )}
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-200 rounded-lg">
                  <FileText className="w-6 h-6 text-orange-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-[#071739] mb-2">Study Material</h3>
                  <p className="text-slate-600">
                    Learn the key concepts, techniques and knowledge for {content.title.toLowerCase()}
                  </p>
                  {!hasStudyAccess && !isInstructor && (
                    <p className="text-sm text-amber-600 mt-2 font-medium">🔒 Ask your instructor for access</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Practice Questions Card */}
          <Card
            onClick={() => handleSubcardClick('practice')}
            className={`hover:shadow-xl transition-all cursor-pointer h-full border-t-4 border-t-rose-400 hover:border-t-rose-500 bg-gradient-to-br from-rose-50 to-pink-50 relative ${!hasMcqAccess ? 'opacity-75' : ''}`}
          >
            {!hasMcqAccess && !isInstructor && (
              <div className="absolute top-4 right-4 bg-white/90 rounded-full p-2 shadow-sm">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
            )}
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-200 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-rose-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-[#071739] mb-2">Practice Questions</h3>
                  <p className="text-slate-600">
                    Test your knowledge with practice questions and assessments
                  </p>
                  {!hasMcqAccess && !isInstructor && (
                    <p className="text-sm text-amber-600 mt-2 font-medium">🔒 Ask your instructor for access</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Video Tutorial Card */}
        {(isInstructor || courseWorkVideo?.youtubeVideoId) && (
          <Card className="border-t-4 border-t-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-200 rounded-lg">
                    <Video className="w-6 h-6 text-blue-700" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#071739]">Video Tutorial</h3>
                </div>
                {isInstructor && !isEditingVideo && (
                  <button
                    onClick={() => { setVideoInput(courseWorkVideo?.youtubeUrl || ''); setIsEditingVideo(true); }}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {courseWorkVideo?.youtubeVideoId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {courseWorkVideo?.youtubeVideoId ? 'Edit' : 'Add Video'}
                  </button>
                )}
              </div>

              {isInstructor && isEditingVideo ? (
                <div className="space-y-3">
                  <Input
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    placeholder="Paste YouTube URL (e.g. https://youtube.com/watch?v=...)"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveVideoMutation.mutate(videoInput)}
                      disabled={!videoInput || saveVideoMutation.isPending}
                      className="px-4 py-2 bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {saveVideoMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setIsEditingVideo(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
                    {courseWorkVideo?.youtubeVideoId && (
                      <button
                        onClick={() => { deleteVideoMutation.mutate(); setIsEditingVideo(false); }}
                        className="px-4 py-2 text-rose-600 hover:text-rose-700 text-sm ml-auto"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ) : courseWorkVideo?.youtubeVideoId ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${courseWorkVideo.youtubeVideoId}`}
                    title="Video Tutorial"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              ) : isInstructor ? (
                <div className="text-center py-8 text-slate-400">
                  <Video className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No video tutorial added yet. Click "Add Video" to add one.</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        <LockedContentDialog open={showLockedDialog} onOpenChange={setShowLockedDialog} />
      </div>
    </div>
  );
}