import React, { useState } from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useInstructorSubscription } from '@/hooks/useInstructorSubscription';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, FileText, CheckCircle, Lock, Video, Plus, Trash2, Youtube, ExternalLink, Pencil, Play } from 'lucide-react';
import LockedContentDialog from '@/components/coursework/LockedContentDialog';
import VideoPlayerModal from '@/components/coursework/VideoPlayerModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function extractYouTubeId(url) {
  if (!url) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/,
    /youtube\.com\/embed\/([^&?/]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return '';
}

export default function CourseWorkSubcardSelect({ itemId, content, isInstructor, hasStudyAccess, hasMcqAccess }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showLockedDialog, setShowLockedDialog] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVideo, setNewVideo] = useState({ videoName: '', youtubeUrl: '' });
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingUrl, setEditingUrl] = useState({});
  const [editingName, setEditingName] = useState({});
  const [activeVideo, setActiveVideo] = useState(null); // { videoId, videoName }

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Always fetch subscription status directly — never rely on prop default
  const { hasValidSub: isSubscribed, isLoading: subLoading } = useInstructorSubscription(isInstructor ? user?.id : null);

  // For instructors, check if they have platform access override
  const { data: instructorProfile } = useQuery({
    queryKey: ['subcardInstructorProfile', user?.email, isInstructor],
    queryFn: async () => {
      if (!isInstructor || !user?.email) return null;
      const results = await base44.entities.Instructor.filter({ created_by: user.email });
      return results[0] || null;
    },
    enabled: !!isInstructor && !!user?.email
  });

  const hasFullAccess = isInstructor && (isSubscribed || instructorProfile?.platformAccessOverride);

  // For learners, get their pupil record to find instructorId
  const { data: pupilProfile } = useQuery({
    queryKey: ['subCardPupilProfile', user?.id, user?.email],
    queryFn: async () => {
      const byLinkedId = await base44.entities.Pupil.filter({ linkedUserId: user.id });
      if (byLinkedId.length > 0) return byLinkedId[0];
      // Fallback: match by email in case linkedUserId is stale
      const byEmail = await base44.entities.Pupil.filter({ email: user.email });
      return byEmail[0] || null;
    },
    enabled: !!user?.id && !isInstructor
  });

  // instructorId to filter videos by — fall back to created_by if instructorId not set
  const videoInstructorId = isInstructor ? user?.id : (pupilProfile?.instructorId || pupilProfile?.created_by);

  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['courseWorkVideos', itemId, videoInstructorId],
    queryFn: async () => {
      const results = await base44.entities.CourseWorkVideo.filter({ topicId: itemId, instructorId: videoInstructorId });
      // Client-side safety: only show videos that exactly match this instructor
      return results.filter(v => v.instructorId === videoInstructorId);
    },
    enabled: !!itemId && !!videoInstructorId
  });

  const addVideoMutation = useMutation({
    mutationFn: (data) => base44.entities.CourseWorkVideo.create({
      ...data,
      topicId: itemId,
      instructorId: user?.id,
      youtubeVideoId: extractYouTubeId(data.youtubeUrl)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['courseWorkVideos', itemId, videoInstructorId]);
      setShowAddForm(false);
      setNewVideo({ videoName: '', youtubeUrl: '' });
    }
  });

  const updateVideoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CourseWorkVideo.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['courseWorkVideos', itemId, videoInstructorId])
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (id) => base44.entities.CourseWorkVideo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['courseWorkVideos', itemId, videoInstructorId]);
      setDeleteTargetId(null);
    }
  });

  const handleSaveUrl = (videoId) => {
    const url = editingUrl[videoId] ?? '';
    updateVideoMutation.mutate({ id: videoId, data: { youtubeUrl: url, youtubeVideoId: extractYouTubeId(url) } });
    setEditingUrl(prev => { const u = { ...prev }; delete u[videoId]; return u; });
  };

  const handleSaveName = (videoId) => {
    const name = editingName[videoId]?.trim();
    if (!name) return;
    updateVideoMutation.mutate({ id: videoId, data: { videoName: name } });
    setEditingName(prev => { const u = { ...prev }; delete u[videoId]; return u; });
  };

  const handleAddVideo = (e) => {
    e.preventDefault();
    if (!newVideo.videoName.trim()) return;
    addVideoMutation.mutate(newVideo);
  };

  const handleSubcardClick = (type) => {
    if (isInstructor && !hasFullAccess && !subLoading) { navigate('/InstructorSubscription'); return; }
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

        {/* Study Material + Practice Questions */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card
            onClick={() => handleSubcardClick('study')}
            className={`hover:shadow-xl transition-all cursor-pointer h-full border-t-4 border-t-orange-400 hover:border-t-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 relative ${(!hasStudyAccess && !isInstructor) || (isInstructor && !hasFullAccess) ? 'opacity-75' : ''}`}
              >
                {((!hasStudyAccess && !isInstructor) || (isInstructor && !hasFullAccess)) && (
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
                  {isInstructor && !hasFullAccess && (
                    <p className="text-sm text-amber-600 mt-2 font-medium">🔒 Subscription required</p>
                  )}
                  </div>
                  </div>
                  </CardContent>
                  </Card>

                  <Card
                  onClick={() => handleSubcardClick('practice')}
            className={`hover:shadow-xl transition-all cursor-pointer h-full border-t-4 border-t-rose-400 hover:border-t-rose-500 bg-gradient-to-br from-rose-50 to-pink-50 relative ${(!hasMcqAccess && !isInstructor) || (isInstructor && !hasFullAccess) ? 'opacity-75' : ''}`}
            >
              {((!hasMcqAccess && !isInstructor) || (isInstructor && !hasFullAccess)) && (
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
                  {isInstructor && !hasFullAccess && (
                    <p className="text-sm text-amber-600 mt-2 font-medium">🔒 Subscription required</p>
                  )}
                  </div>
                  </div>
                  </CardContent>
                  </Card>
                  </div>

                  {/* Video Tutorials Section */}
        {(isInstructor || videos.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#071739] flex items-center gap-2">
                <Video className="w-5 h-5 text-[#F7B602]" />
                Video Tutorials ({videos.length})
              </h2>
              {isInstructor && hasFullAccess && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
              )}
            </div>

            {/* Add Form */}
            {isInstructor && showAddForm && (
              <Card className="border-[#F7B602] border-2 mb-4">
                <CardHeader>
                  <CardTitle className="text-base">Add New Video</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddVideo} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Video Name</Label>
                        <Input
                          placeholder="e.g. Introduction to Legal Responsibilities"
                          value={newVideo.videoName}
                          onChange={(e) => setNewVideo({ ...newVideo, videoName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>YouTube URL</Label>
                        <Input
                          placeholder="https://youtube.com/watch?v=..."
                          value={newVideo.youtubeUrl}
                          onChange={(e) => setNewVideo({ ...newVideo, youtubeUrl: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                      <Button
                        type="submit"
                        disabled={addVideoMutation.isPending}
                        className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739]"
                      >
                        {addVideoMutation.isPending ? 'Adding...' : 'Add Video'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Video List */}
            {videosLoading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : videos.length === 0 ? (
              isInstructor && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Youtube className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No video tutorials yet</p>
                    <p className="text-sm text-slate-400 mt-1">Click "Add Video" to add your first tutorial</p>
                  </CardContent>
                </Card>
              )
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {videos.map(video => {
                  const isEditingThisUrl = editingUrl[video.id] !== undefined;
                  const currentUrl = isEditingThisUrl ? editingUrl[video.id] : (video.youtubeUrl || '');
                  const videoId = extractYouTubeId(currentUrl) || video.youtubeVideoId;

                  return (
                    <Card key={video.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div
                          className="relative group cursor-pointer"
                          onClick={() => !isInstructor && videoId && setActiveVideo({ videoId, videoName: video.videoName })}
                        >
                          {videoId ? (
                            <img
                              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                              alt={video.videoName}
                              className="w-full h-44 object-cover"
                            />
                          ) : (
                            <div className="w-full h-44 bg-slate-100 flex items-center justify-center">
                              <Youtube className="w-10 h-10 text-slate-300" />
                            </div>
                          )}
                          {!isInstructor && videoId && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                <Play className="w-6 h-6 text-[#071739] ml-1" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-3 space-y-2">
                          {isInstructor && editingName[video.id] !== undefined ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editingName[video.id]}
                                onChange={(e) => setEditingName(prev => ({ ...prev, [video.id]: e.target.value }))}
                                className="h-7 text-xs font-semibold"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveName(video.id);
                                  if (e.key === 'Escape') setEditingName(prev => { const u = { ...prev }; delete u[video.id]; return u; });
                                }}
                              />
                              <Button size="sm" onClick={() => handleSaveName(video.id)} disabled={updateVideoMutation.isPending} className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] h-7 text-xs px-2">Save</Button>
                            </div>
                          ) : (
                            <p className="font-semibold text-[#071739] text-sm line-clamp-2">{video.videoName || 'Untitled Video'}</p>
                          )}

                          {isInstructor && (
                            <div className="space-y-1">
                              <Input
                                placeholder="https://youtube.com/watch?v=..."
                                value={currentUrl}
                                onChange={(e) => setEditingUrl(prev => ({ ...prev, [video.id]: e.target.value }))}
                                className="h-7 text-xs"
                              />
                              <div className="flex gap-1 justify-end">
                                {isEditingThisUrl && (
                                  <Button size="sm" onClick={() => handleSaveUrl(video.id)} disabled={updateVideoMutation.isPending} className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] h-7 text-xs px-2">Save URL</Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[#F7B602]" onClick={() => setEditingName(prev => ({ ...prev, [video.id]: video.videoName || '' }))}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-500" onClick={() => setDeleteTargetId(video.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <LockedContentDialog open={showLockedDialog} onOpenChange={setShowLockedDialog} />

        {activeVideo && (
          <VideoPlayerModal
            videoId={activeVideo.videoId}
            videoName={activeVideo.videoName}
            onClose={() => setActiveVideo(null)}
          />
        )}

        <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Video?</AlertDialogTitle>
              <AlertDialogDescription>This video tutorial will be permanently deleted.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteVideoMutation.mutate(deleteTargetId)}
                className="bg-rose-600 hover:bg-rose-700"
                disabled={deleteVideoMutation.isPending}
              >
                {deleteVideoMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}