import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Plus, X } from 'lucide-react';
import CommunityPostForm from '@/components/community/CommunityPostForm';
import CommunityPostCard from '@/components/community/CommunityPostCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Community() {
  const queryClient = useQueryClient();
  const [showPostModal, setShowPostModal] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isInstructor = user?.role === 'admin';

  // For learners: fetch pupil profile for firstName. For instructors: fetch Instructor entity for name.
  const { data: userProfile } = useQuery({
    queryKey: ['communityUserProfile', user?.id, user?.email, isInstructor],
    queryFn: async () => {
      if (isInstructor) {
        const results = await base44.entities.Instructor.filter({ created_by: user.email });
        return results[0] || null;
      } else {
        const pupils = await base44.entities.Pupil.filter({ linkedUserId: user.id });
        return pupils[0] || null;
      }
    },
    enabled: !!user?.id && !!user?.email
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['communityPosts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date', 50)
  });

  const { data: myLikes = [], refetch: refetchLikes } = useQuery({
    queryKey: ['myLikes', user?.id],
    queryFn: () => user?.id ? base44.entities.CommunityLike.filter({ userId: user.id }) : [],
    enabled: !!user?.id
  });

  const likedPostIds = new Set(myLikes.map(l => l.postId));

  // Resolve display name: instructor uses Instructor.name first word, learner uses Pupil.firstName
  const userDisplayName = (() => {
    if (!user) return '';
    if (user.email === 'fasobah@gmail.com') return 'Tacholator Admin';
    if (isInstructor) return userProfile?.name?.split(' ')[0] || user.full_name?.split(' ')[0] || user.email;
    return userProfile?.firstName || user.full_name?.split(' ')[0] || user.email;
  })();

  const handleRefresh = () => {
    queryClient.invalidateQueries(['communityPosts']);
    refetchLikes();
  };

  const handlePostCreated = () => {
    handleRefresh();
    setShowPostModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#071739] flex items-center justify-center">
            <Users className="w-5 h-5 text-[#F7B602]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#071739]">Community</h1>
            <p className="text-sm text-slate-500">Share thoughts with instructors & learners</p>
          </div>
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-full" />
                  <div className="h-3 bg-slate-200 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No posts yet</p>
            <p className="text-sm">Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <CommunityPostCard
                key={post.id}
                post={post}
                user={user}
                userDisplayName={userDisplayName}
                likedPostIds={likedPostIds}
                onLikeToggled={handleRefresh}
                onPostDeleted={handleRefresh}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {user && (
        <button
          onClick={() => setShowPostModal(true)}
          className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-[#F7B602] text-[#071739] shadow-lg flex items-center justify-center hover:bg-[#d99f02] transition-colors lg:bottom-8"
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
      )}

      {/* New Post Modal */}
      <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
        <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-[#071739]">New Post</DialogTitle>
          </DialogHeader>
          <CommunityPostForm user={user} userDisplayName={userDisplayName} onPostCreated={handlePostCreated} />
        </DialogContent>
      </Dialog>
    </div>
  );
}