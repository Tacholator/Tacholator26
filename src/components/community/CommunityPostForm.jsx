import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getUserDisplayName } from '@/lib/userName';

export default function CommunityPostForm({ user, userDisplayName, onPostCreated }) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const userRole = user.email === 'fasobah@gmail.com' ? 'admin' : (user.role === 'admin' ? 'instructor' : 'learner');
      const displayName = userDisplayName || getUserDisplayName(user, user.email).split(' ')[0];
      await base44.entities.CommunityPost.create({
        userId: user.id,
        userFullName: displayName,
        userRole,
        content: content.trim(),
        likeCount: 0,
        commentCount: 0
      });
      setContent('');
      onPostCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-[#F7B602] to-[#d99f02] text-[#071739] font-bold">
            {(userDisplayName || user?.full_name?.split(' ')[0] || user?.email || 'U')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="Share something with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="resize-none border-slate-200 focus:border-[#F7B602] focus:ring-[#F7B602] min-h-[80px]"
          />
          <div className="flex items-center justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold px-5"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}