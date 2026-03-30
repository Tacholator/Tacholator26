import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import moment from 'moment';

function ReadOnlyCanvas({ strokes }) {
  const canvasRef = useRef(null);

  const redraw = useCallback((strokesToDraw) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesToDraw.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.globalAlpha = stroke.opacity || 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight || 300;
      redraw(strokes);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { redraw(strokes); }, [strokes, redraw]);

  return (
    <div className="relative rounded-lg border-2 border-slate-100 bg-white" style={{ height: '100%', minHeight: 400 }}>
      <canvas ref={canvasRef} className="w-full h-full" />
      {strokes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-slate-300 text-sm">No drawing</p>
        </div>
      )}
    </div>
  );
}

export default function PupilClassNotes({ pupilId }) {
  const [selectedNote, setSelectedNote] = useState(null);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['whiteboardScribbles', pupilId],
    queryFn: async () => {
      const items = await base44.entities.WhiteboardScribble.filter({ pupilId });
      return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },
    enabled: !!pupilId
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
    </div>
  );

  if (notes.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <BookOpen className="w-12 h-12 mb-3 opacity-30" />
      <p className="font-medium text-slate-500">No class notes yet</p>
      <p className="text-sm mt-1">Your instructor will add whiteboard notes here during lessons</p>
    </div>
  );

  // Full-screen note view
  if (selectedNote) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedNote(null)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Notes
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[#071739]">{selectedNote.topic || 'Untitled note'}</h2>
            <p className="text-xs text-slate-400">{moment(selectedNote.timestamp).format('dddd, D MMMM YYYY [at] HH:mm')}</p>
          </div>
        </div>
        <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm" style={{ minHeight: 500 }}>
          <ReadOnlyCanvas strokes={selectedNote.scribbleData?.strokes || []} />
        </div>
      </div>
    );
  }

  // Notes list
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map(note => (
        <button key={note.id} onClick={() => setSelectedNote(note)}
          className="text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-[#071739] hover:shadow-md transition-all group">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-[#071739]">
                {note.topic || 'Untitled note'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {moment(note.timestamp).format('D MMM YYYY, HH:mm')}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 overflow-hidden" style={{ height: 120, pointerEvents: 'none' }}>
            <ReadOnlyCanvas strokes={note.scribbleData?.strokes || []} />
          </div>
        </button>
      ))}
    </div>
  );
}