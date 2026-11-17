import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Loader2, Upload } from 'lucide-react';
import InstructorVideoPicker from './InstructorVideoPicker';

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

    case 'video':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pick from your videos</Label>
            <InstructorVideoPicker
              instructorId={instructorId}
              selectedUrl={payload?.videoUrl}
              onSelect={(video) => {
                updatePayload({
                  videoUrl: video.videoUrl,
                  description: payload?.description || video.description || ''
                });
                if (onVideoSelect) onVideoSelect(video);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Or paste a video URL</Label>
            <Input
              value={payload?.videoUrl || ''}
              onChange={(e) => updatePayload({ videoUrl: e.target.value })}
              placeholder="YouTube, Vimeo, or direct video URL"
            />
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