import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Trash2, Pen, Eraser, RotateCcw, BookOpen } from 'lucide-react';
import moment from 'moment';

function WhiteboardCanvas({ strokes, onStrokesChange, readOnly = false }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);
  const [activeTool, setActiveTool] = useState('pen');
  const [strokeColor, setStrokeColor] = useState('#1e293b');
  const [strokeWidth, setStrokeWidth] = useState(3);

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

  useEffect(() => { redraw(strokes); }, [strokes, redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const data = canvas.toDataURL();
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight || 400;
      redraw(strokes);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const isNearStroke = (pt, stroke) => {
    for (let i = 0; i < stroke.points.length - 1; i++) {
      const p1 = stroke.points[i], p2 = stroke.points[i + 1];
      const A = pt.x - p1.x, B = pt.y - p1.y, C = p2.x - p1.x, D = p2.y - p1.y;
      const dot = A * C + B * D, len = C * C + D * D;
      const param = len ? dot / len : -1;
      const nx = param < 0 ? p1.x : param > 1 ? p2.x : p1.x + param * C;
      const ny = param < 0 ? p1.y : param > 1 ? p2.y : p1.y + param * D;
      if (Math.hypot(pt.x - nx, pt.y - ny) < 12) return true;
    }
    return false;
  };

  const onDown = (e) => {
    if (readOnly) return;
    e.preventDefault();
    const pos = getPos(e);
    setIsDrawing(true);
    setLastPoint(pos);
    if (activeTool === 'eraser') {
      const remaining = strokes.filter(s => !isNearStroke(pos, s));
      onStrokesChange(remaining);
      redraw(remaining);
    } else {
      const newStroke = { id: Date.now(), color: strokeColor, width: strokeWidth, opacity: 1, points: [pos] };
      onStrokesChange([...strokes, newStroke]);
    }
  };

  const onMove = (e) => {
    if (!isDrawing || readOnly) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (activeTool === 'eraser') {
      const remaining = strokes.filter(s => !isNearStroke(pos, s));
      onStrokesChange(remaining);
      redraw(remaining);
    } else if (ctx && lastPoint) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      onStrokesChange(prev => {
        const updated = [...prev];
        if (updated.length > 0) updated[updated.length - 1].points.push(pos);
        return updated;
      });
    }
    setLastPoint(pos);
  };

  const onUp = () => setIsDrawing(false);

  const colors = ['#1e293b', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ffffff'];

  return (
    <div className="flex flex-col gap-2">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 rounded-lg border">
          <button onClick={() => setActiveTool('pen')} className={`p-2 rounded-lg transition-colors ${activeTool === 'pen' ? 'bg-[#071739] text-white' : 'bg-white border text-slate-600'}`}><Pen className="w-4 h-4" /></button>
          <button onClick={() => setActiveTool('eraser')} className={`p-2 rounded-lg transition-colors ${activeTool === 'eraser' ? 'bg-[#071739] text-white' : 'bg-white border text-slate-600'}`}><Eraser className="w-4 h-4" /></button>
          <div className="w-px h-6 bg-slate-300" />
          {colors.map(c => (
            <button key={c} onClick={() => { setStrokeColor(c); setActiveTool('pen'); }}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${strokeColor === c ? 'scale-125 border-slate-600' : 'border-slate-300'}`}
              style={{ backgroundColor: c }} />
          ))}
          <div className="w-px h-6 bg-slate-300" />
          {[2, 4, 8].map(w => (
            <button key={w} onClick={() => setStrokeWidth(w)} className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${strokeWidth === w ? 'bg-[#071739] text-white' : 'bg-white text-slate-600'}`}>
              <div className="rounded-full bg-current" style={{ width: w + 4, height: w + 4 }} />
            </button>
          ))}
        </div>
      )}
      <div className="relative rounded-lg border-2 border-slate-200 bg-white" style={{ height: 380 }}>
        <canvas
          ref={canvasRef}
          className={`w-full h-full ${readOnly ? 'cursor-default' : activeTool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'}`}
          style={{ touchAction: 'none' }}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        />
        {!readOnly && strokes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-300 text-sm">Start drawing...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClassNotesTab({ pupilId, instructorId }) {
  const queryClient = useQueryClient();
  const [selectedNote, setSelectedNote] = useState(null);
  const [topic, setTopic] = useState('');
  const [strokes, setStrokes] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['whiteboardScribbles', pupilId],
    queryFn: async () => {
      const items = await base44.entities.WhiteboardScribble.filter({ pupilId });
      return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },
    enabled: !!pupilId
  });

  const saveMutation = useMutation({
    mutationFn: (data) => selectedNote
      ? base44.entities.WhiteboardScribble.update(selectedNote.id, data)
      : base44.entities.WhiteboardScribble.create(data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries(['whiteboardScribbles', pupilId]);
      setSelectedNote(saved);
      setIsCreating(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WhiteboardScribble.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['whiteboardScribbles', pupilId]);
      setSelectedNote(null);
      setStrokes([]);
      setTopic('');
      setIsCreating(false);
    }
  });

  const handleNewNote = () => {
    setSelectedNote(null);
    setStrokes([]);
    setTopic('');
    setIsCreating(true);
  };

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setTopic(note.topic || '');
    setStrokes(note.scribbleData?.strokes || []);
    setIsCreating(false);
  };

  const handleSave = () => {
    saveMutation.mutate({
      pupilId,
      instructorId,
      topic: topic || 'Untitled note',
      scribbleData: { strokes },
      timestamp: new Date().toISOString()
    });
  };

  const handleClear = () => setStrokes([]);

  const showEditor = isCreating || selectedNote;

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Sidebar: list of notes */}
      <div className="lg:w-64 shrink-0 space-y-2">
        <Button onClick={handleNewNote} className="w-full bg-[#071739] hover:bg-[#0a2142] text-white gap-2">
          <Plus className="w-4 h-4" /> New Note
        </Button>
        {isLoading && <p className="text-sm text-slate-400 text-center py-4">Loading...</p>}
        {!isLoading && notes.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No class notes yet</p>
          </div>
        )}
        {notes.map(note => (
          <button key={note.id} onClick={() => handleSelectNote(note)}
            className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedNote?.id === note.id ? 'bg-[#071739] text-white border-[#071739]' : 'bg-white hover:bg-slate-50 border-slate-200'}`}>
            <p className={`text-sm font-medium truncate ${selectedNote?.id === note.id ? 'text-white' : 'text-slate-800'}`}>
              {note.topic || 'Untitled note'}
            </p>
            <p className={`text-xs mt-0.5 ${selectedNote?.id === note.id ? 'text-slate-300' : 'text-slate-400'}`}>
              {moment(note.timestamp).format('D MMM YYYY, HH:mm')}
            </p>
          </button>
        ))}
      </div>

      {/* Editor / Preview */}
      <div className="flex-1">
        {showEditor ? (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Note title (e.g. Cockpit Drill)"
                  className="text-base font-semibold flex-1"
                />
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={handleClear} className="gap-1 text-slate-600">
                    <RotateCcw className="w-3.5 h-3.5" /> Clear
                  </Button>
                  {selectedNote && (
                    <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(selectedNote.id)}
                      disabled={deleteMutation.isPending} className="gap-1 text-rose-600 hover:bg-rose-50 border-rose-200">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  )}
                  <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}
                    className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold gap-1">
                    <Save className="w-3.5 h-3.5" /> Save
                  </Button>
                </div>
              </div>
              {selectedNote && (
                <p className="text-xs text-slate-400">Last saved {moment(selectedNote.timestamp).format('D MMM YYYY, HH:mm')}</p>
              )}
            </CardHeader>
            <CardContent>
              <WhiteboardCanvas strokes={strokes} onStrokesChange={setStrokes} />
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <BookOpen className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Select a note or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}