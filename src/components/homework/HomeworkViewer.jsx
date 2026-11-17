import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ExternalLink, FileText, CheckSquare, Image, Video, Music, Link2, Paperclip } from 'lucide-react';
import HomeworkVideoPlayer from './HomeworkVideoPlayer';

export default function HomeworkViewer({ homework, onChecklistUpdate }) {
  const { formatType, formatPayload } = homework;

  const handleChecklistToggle = (index) => {
    if (!onChecklistUpdate) return;
    const items = [...(formatPayload?.items || [])];
    items[index] = { ...items[index], isCompleted: !items[index].isCompleted };
    onChecklistUpdate(items);
  };

  switch (formatType) {
    case 'text':
      return (
        <div className="prose prose-slate max-w-none">
          <p className="whitespace-pre-wrap">{formatPayload?.bodyText}</p>
        </div>
      );

    case 'checklist':
      return (
        <div className="space-y-3">
          {(formatPayload?.items || []).map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <Checkbox
                checked={item.isCompleted}
                onCheckedChange={() => handleChecklistToggle(idx)}
                className="mt-0.5"
              />
              <span className={item.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      );

    case 'image':
      return (
        <div className="space-y-3">
          {formatPayload?.imageUrl && (
            <img 
              src={formatPayload.imageUrl} 
              alt={homework.title} 
              className="max-w-full rounded-lg"
            />
          )}
          {formatPayload?.caption && (
            <p className="text-sm text-slate-500 italic">{formatPayload.caption}</p>
          )}
        </div>
      );

    case 'video': {
      const videos = formatPayload?.videos?.length
        ? formatPayload.videos
        : formatPayload?.videoUrl
        ? [{ videoUrl: formatPayload.videoUrl }]
        : [];

      return (
        <div className="space-y-4">
          {videos.length === 0 && (
            <p className="text-sm text-slate-500">No video attached to this homework yet.</p>
          )}
          {videos.map((video) => (
            <HomeworkVideoPlayer
              key={video.videoUrl}
              videoUrl={video.videoUrl}
              title={video.title}
            />
          ))}
          {formatPayload?.description && (
            <p className="text-sm text-slate-600">{formatPayload.description}</p>
          )}
        </div>
      );
    }

    case 'audio':
      return (
        <div className="space-y-3">
          {formatPayload?.audioUrl && (
            <audio controls src={formatPayload.audioUrl} className="w-full" />
          )}
          {formatPayload?.transcript && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-xs text-slate-400 mb-2">Transcript</p>
              <p className="text-sm text-slate-600">{formatPayload.transcript}</p>
            </div>
          )}
        </div>
      );

    case 'link':
      return (
        <div className="space-y-3">
          <a
            href={formatPayload?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Open Resource
          </a>
          {formatPayload?.description && (
            <p className="text-sm text-slate-600">{formatPayload.description}</p>
          )}
        </div>
      );

    case 'attachment':
      return (
        <div className="space-y-3">
          <a
            href={formatPayload?.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-lg text-teal-600 hover:bg-slate-100 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
            <span className="font-medium">Download Attachment</span>
          </a>
          {formatPayload?.description && (
            <p className="text-sm text-slate-600">{formatPayload.description}</p>
          )}
        </div>
      );

    default:
      return <p className="text-slate-500">Unsupported format</p>;
  }
}