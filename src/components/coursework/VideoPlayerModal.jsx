import React from 'react';
import { X } from 'lucide-react';

export default function VideoPlayerModal({ videoId, videoName, onClose }) {
  if (!videoId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="relative w-full max-w-3xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-[#071739] px-4 py-3 rounded-t-xl">
          <h3 className="text-white font-semibold text-sm truncate pr-4">{videoName || 'Video Tutorial'}</h3>
          <button onClick={onClose} className="text-white hover:text-[#F7B602] transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={videoName}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full rounded-b-xl"
          />
        </div>
      </div>
    </div>
  );
}