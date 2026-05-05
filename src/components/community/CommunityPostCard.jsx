import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, BadgeCheck, Trash2, MessageCircle, ChevronDown, ChevronUp, Pencil, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CommunityCommentSection from './CommunityCommentSection';

export default function CommunityPostCard({ post, user, userDisplayName, likedPostIds, onLikeToggled, onPostDeleted }) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await base44.entities.CommunityPost.delete(post.id);
      if (onPostDeleted) onPostDeleted();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const isOwner = user?.id === post.userId;

  const handleEdit = async () => {
    if (!editContent.trim() || editContent.trim() === post.content) { setEditing(false); return; }
    setSaving(true);
    try {
      await base44.entities.CommunityPost.update(post.id, {
        content: editContent.trim(),
        editedAt: new Date().toISOString()
      });
      queryClient.invalidateQueries(['communityPosts']);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

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
            {format(new Date(post.created_date), 'd MMM yyyy, HH:mm')}
            {post.editedAt && <span className="ml-1 italic text-slate-400">(edited)</span>}
          </p>
        </div>
        {isOwner && !editing && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => { setEditContent(post.content); setEditing(true); }}
              className="text-slate-300 hover:text-[#071739] transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-slate-300 hover:text-rose-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <div className="mb-3 space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full text-sm text-slate-700 border border-slate-300 rounded-xl p-3 resize-none focus:outline-none focus:border-[#F7B602] min-h-[80px]"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-full border border-slate-200"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
            <button
              onClick={handleEdit}
              disabled={saving}
              className="flex items-center gap-1 text-xs bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold px-3 py-1.5 rounded-full"
            >
              <Check className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-700 leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>
      )}

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
          userDisplayName={userDisplayName}
          onCommentAdded={() => {
            refetchComments();
            queryClient.invalidateQueries(['communityPosts']);
          }}
        />
      )}
    </div>
  );
}