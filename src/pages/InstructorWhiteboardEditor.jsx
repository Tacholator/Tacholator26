import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Save } from 'lucide-react';
import ToolBar from '@/components/whiteboard/ToolBar';
import Canvas from '@/components/whiteboard/Canvas';
import PropertiesPanel from '@/components/whiteboard/PropertiesPanel';

export default function InstructorWhiteboardEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const boardId = searchParams.get('boardId');

  // Board state
  const [boardTitle, setBoardTitle] = useState('New Whiteboard');
  const [boardTags, setBoardTags] = useState([]);
  const [isSharedWithPupil, setIsSharedWithPupil] = useState(false);
  const [allowPupilNotes, setAllowPupilNotes] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Canvas state
  const [activeTool, setActiveTool] = useState('select');
  const [strokeColor, setStrokeColor] = useState('#111111');
  const [strokeWidth, setStrokeWidth] = useState(6);
  const [strokeOpacity, setStrokeOpacity] = useState(1);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: board, isLoading } = useQuery({
    queryKey: ['whiteboard', boardId],
    queryFn: () => boardId ? base44.entities.WhiteboardBoard.read(boardId) : null,
    enabled: !!boardId
  });

  useEffect(() => {
    if (board) {
      setBoardTitle(board.title);
      setBoardTags(board.topicTags || []);
      setIsSharedWithPupil(board.isSharedWithPupil);
      setAllowPupilNotes(board.allowPupilNotes);
    }
  }, [board]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const boardData = {
        ownerInstructorId: user.id,
        title: boardTitle,
        topicTags: boardTags,
        isSharedWithPupil,
        allowPupilNotes,
        stepsEnabled: false
      };

      if (boardId) {
        await base44.entities.WhiteboardBoard.update(boardId, boardData);
      } else {
        const result = await base44.entities.WhiteboardBoard.create(boardData);
        return result.id;
      }
    },
    onSuccess: (newBoardId) => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard'] });
      if (newBoardId) {
        navigate(`/InstructorWhiteboardEditor?boardId=${newBoardId}`);
      }
    }
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleHistoryChange = (objects, strokes) => {
    const newState = { objects, strokes, timestamp: Date.now() };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/InstructorWhiteboardLibrary')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <Input
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                placeholder="Whiteboard title"
                className="text-lg font-semibold"
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1">
          <ToolBar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
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
    </div>
  );
}