import React from 'react';

function getEmbedUrl(url) {
  if (url.includes('youtube') || url.includes('youtu.be')) {
    return url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/');
  }
  if (url.includes('vimeo')) {
    return url.replace('vimeo.com/', 'player.vimeo.com/video/');
  }
  return null;
}

export default function HomeworkVideoPlayer({ videoUrl, title }) {
  if (!videoUrl) return null;
  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div className="space-y-2">
      {title && <p className="text-sm font-medium text-slate-800">{title}</p>}
      {embedUrl ? (
        <div className="aspect-video">
          <iframe src={embedUrl} className="w-full h-full rounded-lg" allowFullScreen />
        </div>
      ) : (
        <video controls src={videoUrl} className="w-full rounded-lg" />
      )}
    </div>
  );
}