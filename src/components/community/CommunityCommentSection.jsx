import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';

export default function CommunityCommentSection({ postId, comments, user, userDisplayName, onCommentAdded }) {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await base44.functions.invoke('createCommunityComment', { postId, content: newComment.trim() });
      setNewComment('');
      onCommentAdded();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-2">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-slate-200 text-slate-600 text-xs font-semibold">
              {(comment.userFullName || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="bg-slate-50 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-[#071739]">{comment.userFullName}</span>
                <span className="text-xs text-slate-400 capitalize">{comment.userRole}</span>
              </div>
              <p className="text-sm text-slate-700">{comment.content}</p>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 px-1">
              {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-[#F7B602] to-[#d99f02] text-[#071739] text-xs font-bold">
            {(userDisplayName || user?.full_name || user?.email || 'U')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="text-sm h-8 rounded-full border-slate-200"
          />
          <Button
            type="submit"
            disabled={!newComment.trim() || submitting}
            size="sm"
            className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold h-8 px-3 rounded-full"
          >
            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}