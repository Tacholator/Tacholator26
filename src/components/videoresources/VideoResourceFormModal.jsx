import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { extractYouTubeId, youtubeThumbnail } from '@/lib/youtube';
import { courseWorkTopics } from '@/components/coursework/topicIndex';

const emptyForm = { title: '', videoUrl: '', topic: '', description: '' };

export default function VideoResourceFormModal({
  open,
  onClose,
  onSave,
  initialVideo,
  saving = false,
}) {
  const [form, setForm] = useState(emptyForm);

  const topicTitles = courseWorkTopics.map((topic) => topic.title);
  const topicOptions =
    initialVideo?.topic && !topicTitles.includes(initialVideo.topic)
      ? [...topicTitles, initialVideo.topic]
      : topicTitles;

  useEffect(() => {
    if (!open) return;
    setForm({
      title: initialVideo?.title || '',
      videoUrl: initialVideo?.videoUrl || '',
      topic: initialVideo?.topic || '',
      description: initialVideo?.description || '',
    });
  }, [open, initialVideo]);

  const canSave = !!(form.title.trim() && form.videoUrl.trim() && form.topic.trim());
  const thumb = youtubeThumbnail(form.videoUrl);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSave || saving) return;
    onSave({
      title: form.title.trim(),
      videoUrl: form.videoUrl.trim(),
      topic: form.topic.trim(),
      description: form.description.trim(),
      videoId: extractYouTubeId(form.videoUrl) || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialVideo ? 'Edit video' : 'Add video'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="videoTitle">Title *</Label>
            <Input
              id="videoTitle"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Parallel parking walkthrough"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="videoUrl">Video link *</Label>
            <Input
              id="videoUrl"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="https://youtu.be/..."
              required
            />
            {thumb && (
              <img src={thumb} alt="Video preview" className="mt-2 w-40 rounded-md border border-slate-200" />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Topic *</Label>
            <Select value={form.topic} onValueChange={(val) => setForm({ ...form, topic: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a skill" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {topicOptions.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="videoDescription">Description</Label>
            <Input
              id="videoDescription"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave || saving} className="bg-[#071739] hover:bg-[#0a2142]">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initialVideo ? 'Save changes' : 'Add video'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}