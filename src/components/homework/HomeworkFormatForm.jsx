import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Loader2, Upload, X } from 'lucide-react';
import InstructorVideoPicker from './InstructorVideoPicker';
import VideoLinkAdder from './VideoLinkAdder';

export default function HomeworkFormatForm({ formatType, payload, onChange, instructorId, onVideoSelect }) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange({ ...payload, [field]: file_url });
    } finally {
      setUploading(false);
    }
  };

  const updatePayload = (updates) => {
    onChange({ ...payload, ...updates });
  };

  const addChecklistItem = () => {
    const items = payload?.items || [];
    updatePayload({ items: [...items, { label: '', isCompleted: false }] });
  };

  const updateChecklistItem = (index, label) => {
    const items = [...(payload?.items || [])];
    items[index] = { ...items[index], label };
    updatePayload({ items });
  };

  const removeChecklistItem = (index) => {
    const items = (payload?.items || []).filter((_, i) => i !== index);
    updatePayload({ items });
  };

  switch (formatType) {
    case 'text':
      return (
        <div className="space-y-2">
          <Label>Content</Label>
          <Textarea
            value={payload?.bodyText || ''}
            onChange={(e) => updatePayload({ bodyText: e.target.value })}
            placeholder="Enter homework instructions..."
            rows={5}
          />
        </div>
      );

    case 'checklist':
      return (
        <div className="space-y-3">
          <Label>Checklist Items</Label>
          {(payload?.items || []).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={item.label}
                onChange={(e) => updateChecklistItem(idx, e.target.value)}
                placeholder={`Task ${idx + 1}`}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => removeChecklistItem(idx)}
                className="p-2 text-slate-400 hover:text-rose-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </div>
      );

    case 'image':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Image</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'imageUrl')}
                disabled={uploading}
              />
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
            {payload?.imageUrl && (
              <img src={payload.imageUrl} alt="Preview" className="max-h-40 rounded-lg mt-2" />
            )}
          </div>
          <div className="space-y-2">
            <Label>Caption (optional)</Label>
            <Input
              value={payload?.caption || ''}
              onChange={(e) => updatePayload({ caption: e.target.value })}
              placeholder="Image description..."
            />
          </div>
        </div>
      );

    case 'video': {
      const selectedVideos =
        payload?.videos ??
        (payload?.videoUrl
          ? [{ videoUrl: payload.videoUrl, title: '', description: payload?.description || '' }]
          : []);
      const toggleVideo = (video) => {
        const exists = selectedVideos.some((v) => v.videoUrl === video.videoUrl);
        const next = exists
          ? selectedVideos.filter((v) => v.videoUrl !== video.videoUrl)
          : [
              ...selectedVideos,
              { videoUrl: video.videoUrl, title: video.title, description: video.description || '' }
            ];
        updatePayload({ videos: next });
        if (!exists && onVideoSelect) onVideoSelect(video);
      };
      const addLink = (url) => {
        if (selectedVideos.some((v) => v.videoUrl === url)) return;
        updatePayload({ videos: [...selectedVideos, { videoUrl: url, title: '', description: '' }] });
      };
      const removeVideo = (url) =>
        updatePayload({ videos: selectedVideos.filter((v) => v.videoUrl !== url) });

      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pick from your videos</Label>
            <InstructorVideoPicker
              instructorId={instructorId}
              selectedUrls={selectedVideos.map((v) => v.videoUrl)}
              onToggle={toggleVideo}
            />
          </div>
          {selectedVideos.length > 0 && (
            <div className="space-y-2">
              <Label>Selected videos ({selectedVideos.length})</Label>
              <div className="space-y-1">
                {selectedVideos.map((video) => (
                  <div
                    key={video.videoUrl}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg"
                  >
                    <span className="flex-1 text-sm text-slate-700 truncate">
                      {video.title || video.videoUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVideo(video.videoUrl)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Or add a video by link</Label>
            <VideoLinkAdder onAdd={addLink} />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={payload?.description || ''}
              onChange={(e) => updatePayload({ description: e.target.value })}
              placeholder="What to focus on..."
              rows={2}
            />
          </div>
        </div>
      );
    }

    case 'audio':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Audio File</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="audio/*"
                onChange={(e) => handleFileUpload(e, 'audioUrl')}
                disabled={uploading}
              />
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
            {payload?.audioUrl && (
              <audio controls src={payload.audioUrl} className="mt-2 w-full" />
            )}
          </div>
          <div className="space-y-2">
            <Label>Transcript (optional)</Label>
            <Textarea
              value={payload?.transcript || ''}
              onChange={(e) => updatePayload({ transcript: e.target.value })}
              placeholder="Audio transcript..."
              rows={2}
            />
          </div>
        </div>
      );

    case 'link':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              value={payload?.url || ''}
              onChange={(e) => updatePayload({ url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={payload?.description || ''}
              onChange={(e) => updatePayload({ description: e.target.value })}
              placeholder="What this resource covers..."
              rows={2}
            />
          </div>
        </div>
      );

    case 'attachment':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>File</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept=".pdf,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload(e, 'fileUrl')}
                disabled={uploading}
              />
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
            {payload?.fileUrl && (
              <a href={payload.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-600 hover:underline">
                View uploaded file
              </a>
            )}
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={payload?.description || ''}
              onChange={(e) => updatePayload({ description: e.target.value })}
              placeholder="File description..."
              rows={2}
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}