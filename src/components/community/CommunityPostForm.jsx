import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function CommunityPostForm({ user, onPostCreated }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const res = await base44.integrations.Core.UploadFile({ file: imageFile });
        imageUrl = res.file_url;
      }
      const userRole = user.role === 'admin' ? 'instructor' : 'learner';
      await base44.entities.CommunityPost.create({
        userId: user.id,
        userFullName: user.full_name || user.email,
        userRole,
        content: content.trim(),
        imageUrl,
        likeCount: 0,
        commentCount: 0
      });
      setContent('');
      setImageFile(null);
      setImagePreview(null);
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
            {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="Share something with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="resize-none border-slate-200 focus:border-[#F7B602] focus:ring-[#F7B602] min-h-[80px]"
          />
          {imagePreview && (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="max-h-48 rounded-xl object-cover" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <label className="cursor-pointer flex items-center gap-1.5 text-slate-500 hover:text-[#F7B602] text-sm transition-colors">
              <ImagePlus className="w-5 h-5" />
              <span>Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
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