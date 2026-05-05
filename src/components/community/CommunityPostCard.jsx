import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, ChevronDown, ChevronUp, BadgeCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import CommunityCommentSection from './CommunityCommentSection';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function CommunityPostCard({ post, user, likedPostIds, onLikeToggled }) {
  const [showComments, setShowComments] = useState(false);
  const [toggling, setToggling] = useState(false);
  const queryClient = useQueryClient();

  const isLiked = likedPostIds.has(post.id);

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['communityComments', post.id],
    queryFn: () => base44.entities.CommunityComment.filter({ postId: post.id }, '-created_date'),
    enabled: showComments
  });

  const handleLike = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      await base44.functions.invoke('toggleCommunityLike', { postId: post.id });
      onLikeToggled();
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  const isAdmin = post.userRole === 'admin';
  const roleColor = isAdmin
    ? 'bg-[#071739] text-white'
    : post.userRole === 'instructor'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-emerald-100 text-emerald-700';
  const roleLabel = isAdmin ? 'Admin' : post.userRole;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 font-bold">
            {(post.userFullName || 'U')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#071739] text-sm">{post.userFullName}</span>
            {isAdmin && <BadgeCheck className="w-4 h-4 text-[#F7B602] fill-[#071739]" />}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${roleColor}`}>
              {roleLabel}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-slate-700 leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>

      {/* Image */}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post attachment"
          className="w-full rounded-xl object-cover max-h-80 mb-3"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
        <button
          onClick={handleLike}
          disabled={toggling}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
          <span>{post.likeCount || 0}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#071739] transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentCount || 0}</span>
          {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommunityCommentSection
          postId={post.id}
          comments={comments}
          user={user}
          onCommentAdded={() => {
            refetchComments();
            queryClient.invalidateQueries(['communityPosts']);
          }}
        />
      )}
    </div>
  );
}