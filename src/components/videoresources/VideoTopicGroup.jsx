import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Video, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { youtubeThumbnail } from '@/lib/youtube';

export default function VideoTopicGroup({ topic, videos, onToggleVisibility, onEdit, onDelete }) {
  return (
    <Card className="border-t-4 border-t-[#F7B602] shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-[#071739]">
          <Video className="w-4 h-4 text-[#F7B602]" />
          <span className="flex-1 truncate">{topic}</span>
          <span className="text-xs font-normal text-slate-400">
            {videos.length} video{videos.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {videos.map((video) => {
          const thumb = video.videoId
            ? `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`
            : youtubeThumbnail(video.videoUrl);
          return (
            <div key={video.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex gap-3">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={video.title}
                    className="w-24 h-14 rounded-md object-cover shrink-0 bg-slate-100"
                  />
                ) : (
                  <div className="w-24 h-14 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 text-slate-300" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-slate-800 leading-snug">{video.title}</p>
                  {video.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{video.description}</p>
                  )}
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-[#071739] mt-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Open link
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <Switch
                  checked={!!video.visibleToPupils}
                  onCheckedChange={(val) => onToggleVisibility(video, val)}
                />
                <span
                  className={`text-xs font-medium ${
                    video.visibleToPupils ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {video.visibleToPupils ? 'Visible to pupils' : 'Hidden from pupils'}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(video)} className="text-slate-500 hover:text-[#071739]">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(video)}
                    className="text-rose-500 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}