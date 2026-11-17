import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Pen, BookOpen, Save, RotateCcw, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import moment from 'moment';
import ToolBar from '@/components/whiteboard/ToolBar';
import Canvas from '@/components/whiteboard/Canvas';
import PropertiesPanel from '@/components/whiteboard/PropertiesPanel';

export default function ClassNotesTab({ pupilId, instructorId }) {
  const queryClient = useQueryClient();

  // List state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null); // null = new note

  // Editor canvas state
  const [topic, setTopic] = useState('');
  const [activeTool, setActiveTool] = useState('pen');
  const [strokeColor, setStrokeColor] = useState('#111111');
  const [strokeWidth, setStrokeWidth] = useState(6);
  const [strokeOpacity, setStrokeOpacity] = useState(1);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Linked learner user id — stored on each note so the learner's Class Notes page can see it
  const { data: pupilRecord } = useQuery({
    queryKey: ['classNotesPupil', pupilId],
    queryFn: () => base44.entities.Pupil.get(pupilId),
    enabled: !!pupilId
  });

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['whiteboardScribbles', pupilId],
    queryFn: async () => {
      const items = await base44.entities.WhiteboardScribble.filter({ pupilId });
      return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },
    enabled: !!pupilId
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editingNote
      ? base44.entities.WhiteboardScribble.update(editingNote.id, data)
      : base44.entities.WhiteboardScribble.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['whiteboardScribbles', pupilId]);
      closeEditor();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WhiteboardScribble.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['whiteboardScribbles', pupilId])
  });

  const openNew = () => {
    setEditingNote(null);
    setTopic('');
    const empty = { objects: [], strokes: [] };
    setHistory([empty]);
    setHistoryIndex(0);
    setEditorOpen(true);
  };

  const openEdit = (note) => {
    setEditingNote(note);
    setTopic(note.topic || '');
    const state = { objects: [], strokes: note.scribbleData?.strokes || [] };
    setHistory([state]);
    setHistoryIndex(0);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingNote(null);
  };

  const handleHistoryChange = (objects, strokes) => {
    const newState = { objects, strokes, timestamp: Date.now() };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => { if (historyIndex > 0) setHistoryIndex(historyIndex - 1); };
  const handleRedo = () => { if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1); };

  const handleSave = () => {
    const currentState = history[historyIndex] || { objects: [], strokes: [] };
    const payload = {
      pupilId,
      instructorId,
      topic: topic || 'Untitled note',
      scribbleData: { strokes: currentState.strokes || [] },
      timestamp: new Date().toISOString()
    };
    if (pupilRecord?.linkedUserId) payload.pupilUserId = pupilRecord.linkedUserId;
    saveMutation.mutate(payload);
  };

  const handleClearAll = () => {
    const emptyState = { objects: [], strokes: [] };
    setHistory([emptyState]);
    setHistoryIndex(0);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Sidebar */}
      <div className="lg:w-64 shrink-0 space-y-2">
        <Button onClick={openNew} className="w-full bg-[#071739] hover:bg-[#0a2142] text-white gap-2">
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
          <div key={note.id} className="group relative">
            <button
              onClick={() => openEdit(note)}
              className="w-full text-left p-3 rounded-xl border transition-colors bg-white hover:bg-slate-50 border-slate-200"
            >
              <p className="text-sm font-medium truncate text-slate-800">{note.topic || 'Untitled note'}</p>
              <p className="text-xs mt-0.5 text-slate-400">{moment(note.timestamp).format('D MMM YYYY, HH:mm')}</p>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(note.id); }}
              disabled={deleteMutation.isPending}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Placeholder when nothing selected */}
      <div className="flex-1 hidden lg:flex flex-col items-center justify-center py-16 text-slate-400">
        <BookOpen className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">Select a note or create a new one</p>
      </div>

      {/* Whiteboard-style full-screen editor dialog */}
      <Dialog open={editorOpen} onOpenChange={closeEditor}>
        <DialogContent hideClose className="max-w-none w-screen h-screen p-0 flex flex-col rounded-none border-0" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={closeEditor}>
                <X className="w-4 h-4" />
              </Button>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Note title (e.g. Cockpit Drill)"
                className="text-base font-semibold w-64"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClearAll} className="gap-2 text-slate-600">
                <RotateCcw className="w-4 h-4" /> Clear All
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-[#F7B602] hover:bg-[#d99f02] text-[#071739] font-semibold gap-2"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>

          {/* Toolbar */}
          <ToolBar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />

          {/* Canvas + Properties */}
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-col flex-1 min-w-0">
              <Canvas
                activeTool={activeTool}
                strokeColor={strokeColor}
                strokeWidth={strokeWidth}
                strokeOpacity={strokeOpacity}
                snapToGrid={snapToGrid}
                showGrid={showGrid}
                onStrokeStart={() => {}}
                onStrokeEnd={() => {}}
                onObjectSelect={() => {}}
                onObjectChange={() => {}}
                onHistoryChange={handleHistoryChange}
                historyIndex={historyIndex}
                history={history}
                draggedLibraryItem={null}
              />
            </div>
            <PropertiesPanel
              activeTool={activeTool}
              strokeWidth={strokeWidth}
              strokeColor={strokeColor}
              strokeOpacity={strokeOpacity}
              snapToGrid={snapToGrid}
              showGrid={showGrid}
              onStrokeWidthChange={setStrokeWidth}
              onStrokeColorChange={setStrokeColor}
              onStrokeOpacityChange={setStrokeOpacity}
              onSnapToGridChange={setSnapToGrid}
              onShowGridChange={setShowGrid}
              onResetView={() => {}}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}