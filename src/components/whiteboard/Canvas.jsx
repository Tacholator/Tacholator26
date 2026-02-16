import React, { useRef, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function Canvas({ 
  activeTool, 
  strokeColor, 
  strokeWidth, 
  strokeOpacity,
  snapToGrid,
  showGrid,
  onStrokeStart,
  onStrokeEnd,
  onObjectSelect,
  onObjectChange,
  onHistoryChange,
  historyIndex,
  history,
  readOnly = false,
  draggedLibraryItem
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [objects, setObjects] = useState([]);
  const [strokes, setStrokes] = useState([]);
  const [lastPoint, setLastPoint] = useState(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Update canvas when history changes (undo/redo)
  useEffect(() => {
    if (historyIndex >= 0 && history && history[historyIndex]) {
      const state = history[historyIndex];
      setObjects(state.objects || []);
      setStrokes(state.strokes || []);
      redrawCanvas(state.objects || [], state.strokes || []);
    }
  }, [historyIndex]);

  // Redraw whenever objects or strokes change to preserve on re-renders
  useEffect(() => {
    if (historyIndex >= 0 && history && history[historyIndex]) {
      const state = history[historyIndex];
      setObjects(state.objects || []);
      setStrokes(state.strokes || []);
    }
  }, [historyIndex, history]);

  // Redraw canvas whenever objects/strokes change
  useEffect(() => {
    redrawCanvas(objects, strokes);
  }, [objects, strokes, redrawCanvas]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      setContext(ctx);

      if (showGrid) {
        drawGrid(ctx, canvas);
      }
    };

    resizeCanvas();

    // Watch for resize
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas.parentElement);

    return () => resizeObserver.disconnect();
  }, [showGrid]);

  const redrawCanvas = React.useCallback((canvasObjects, canvasStrokes) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ensure canvas is properly sized
    if (canvas.width === 0 || canvas.height === 0) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showGrid) {
      drawGrid(ctx, canvas);
    }

    canvasStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.strokeStyle = stroke.color;
      ctx.globalAlpha = stroke.opacity || 1;
      ctx.lineWidth = stroke.width;
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
  }, [showGrid]);

  const drawGrid = (ctx, canvas) => {
    const gridSize = 20;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    for (let i = 0; i < canvas.width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }

    for (let i = 0; i < canvas.height; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
  };

  const getMousePos = (e) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getTouchPos = (touch) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  const isPointNearStroke = (point, stroke, threshold = 10) => {
    for (let i = 0; i < stroke.points.length - 1; i++) {
      const p1 = stroke.points[i];
      const p2 = stroke.points[i + 1];
      const dist = pointToLineDistance(point, p1, p2);
      if (dist < threshold) return true;
    }
    return false;
  };

  const pointToLineDistance = (point, lineStart, lineEnd) => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleMouseDown = (e) => {
    if (readOnly) return;
    
    const pos = getMousePos(e);
    if (!pos) return;

    if (activeTool === 'select') {
      const clickedStroke = strokes.find(s => isPointNearStroke(pos, s));
      if (clickedStroke) {
        setSelectedObject(clickedStroke.id);
      } else {
        setSelectedObject(null);
      }
      return;
    }

    if (activeTool === 'text') {
      setIsAddingText(true);
      const textBox = {
        id: Date.now(),
        type: 'text',
        x: pos.x,
        y: pos.y,
        text: '',
        fontSize: 16,
        color: strokeColor
      };
      setObjects(prev => [...prev, textBox]);
      setSelectedObject(textBox.id);
      onHistoryChange?.([...objects, textBox], strokes);
      return;
    }

    setIsDrawing(true);
    setLastPoint(pos);
    onStrokeStart?.();

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      const newStroke = {
        id: Date.now(),
        tool: activeTool,
        color: strokeColor,
        width: strokeWidth,
        opacity: strokeOpacity,
        points: [pos]
      };
      setStrokes(prev => [...prev, newStroke]);
    } else if (activeTool === 'eraser') {
      const toRemove = strokes.filter(s => isPointNearStroke(pos, s));
      const remaining = strokes.filter(s => !toRemove.includes(s));
      setStrokes(remaining);
      redrawCanvas(objects, remaining);
    }
  };

  const handleMouseMove = (e) => {
    if (!context) return;

    const pos = getMousePos(e);
    if (!pos) return;

    if (!isDrawing) return;

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      context.strokeStyle = strokeColor;
      context.globalAlpha = strokeOpacity;
      context.lineWidth = strokeWidth;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      
      context.beginPath();
      context.moveTo(lastPoint.x, lastPoint.y);
      context.lineTo(pos.x, pos.y);
      context.stroke();

      setLastPoint(pos);
      
      setStrokes(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].points.push(pos);
        }
        return updated;
      });
    } else if (activeTool === 'eraser') {
      const toRemove = strokes.filter(s => isPointNearStroke(pos, s));
      const remaining = strokes.filter(s => !toRemove.includes(s));
      setStrokes(remaining);
      redrawCanvas(objects, remaining);
      setLastPoint(pos);
    }

    onObjectChange?.();
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setStrokes(prevStrokes => {
        setTimeout(() => {
          onHistoryChange?.(objects, prevStrokes);
        }, 0);
        return prevStrokes;
      });
    }
    setIsDrawing(false);
    setLastPoint(null);
    setIsDraggingObject(false);
    onStrokeEnd?.();
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    if (readOnly) return;
    const touch = e.touches[0];
    const pos = getTouchPos(touch);
    if (!pos) return;

    if (activeTool === 'select') {
      const clickedStroke = strokes.find(s => isPointNearStroke(pos, s));
      if (clickedStroke) {
        setSelectedObject(clickedStroke.id);
      } else {
        setSelectedObject(null);
      }
      return;
    }

    if (activeTool === 'text') {
      setIsAddingText(true);
      const textBox = {
        id: Date.now(),
        type: 'text',
        x: pos.x,
        y: pos.y,
        text: '',
        fontSize: 16,
        color: strokeColor
      };
      setObjects(prev => [...prev, textBox]);
      setSelectedObject(textBox.id);
      onHistoryChange?.([...objects, textBox], strokes);
      return;
    }

    setIsDrawing(true);
    setLastPoint(pos);
    onStrokeStart?.();

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      const newStroke = {
        id: Date.now(),
        tool: activeTool,
        color: strokeColor,
        width: strokeWidth,
        opacity: strokeOpacity,
        points: [pos]
      };
      setStrokes(prev => [...prev, newStroke]);
    } else if (activeTool === 'eraser') {
      const toRemove = strokes.filter(s => isPointNearStroke(pos, s));
      const remaining = strokes.filter(s => !toRemove.includes(s));
      setStrokes(remaining);
      redrawCanvas(objects, remaining);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!context || !isDrawing) return;

    const touch = e.touches[0];
    const pos = getTouchPos(touch);
    if (!pos || !lastPoint) return;

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      context.strokeStyle = strokeColor;
      context.globalAlpha = strokeOpacity;
      context.lineWidth = strokeWidth;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      
      context.beginPath();
      context.moveTo(lastPoint.x, lastPoint.y);
      context.lineTo(pos.x, pos.y);
      context.stroke();

      setLastPoint(pos);
      
      setStrokes(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].points.push(pos);
        }
        return updated;
      });
    } else if (activeTool === 'eraser') {
      const toRemove = strokes.filter(s => isPointNearStroke(pos, s));
      const remaining = strokes.filter(s => !toRemove.includes(s));
      setStrokes(remaining);
      redrawCanvas(objects, remaining);
      setLastPoint(pos);
    }

    onObjectChange?.();
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    if (isDrawing) {
      setStrokes(prevStrokes => {
        setTimeout(() => {
          onHistoryChange?.(objects, prevStrokes);
        }, 0);
        return prevStrokes;
      });
    }
    setIsDrawing(false);
    setLastPoint(null);
    setIsDraggingObject(false);
    onStrokeEnd?.();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (canvasRef.current) {
      canvasRef.current.style.backgroundColor = '#f0f9ff';
    }
  };

  const handleDragLeave = (e) => {
    if (e.target === canvasRef.current) {
      if (canvasRef.current) {
        canvasRef.current.style.backgroundColor = 'white';
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (canvasRef.current) {
      canvasRef.current.style.backgroundColor = 'white';
    }

    if (!draggedLibraryItem || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - (draggedLibraryItem.defaultSize.w / 2));
    const y = Math.max(0, e.clientY - rect.top - (draggedLibraryItem.defaultSize.h / 2));

    const newObject = {
      id: Date.now(),
      type: 'shape',
      x,
      y,
      width: draggedLibraryItem.defaultSize.w,
      height: draggedLibraryItem.defaultSize.h,
      libraryItemId: draggedLibraryItem.id,
      libraryItem: draggedLibraryItem
    };

    const updatedObjects = [...objects, newObject];
    setObjects(updatedObjects);
    onHistoryChange?.(updatedObjects, strokes);
  };

  const handleDeleteSelected = () => {
    if (!selectedObject) return;

    const isText = objects.some(o => o.id === selectedObject);
    const isStroke = strokes.some(s => s.id === selectedObject);

    if (isText) {
      const updated = objects.filter(o => o.id !== selectedObject);
      setObjects(updated);
      onHistoryChange?.(updated, strokes);
    } else if (isStroke) {
      const updated = strokes.filter(s => s.id !== selectedObject);
      setStrokes(updated);
      redrawCanvas(objects, updated);
      onHistoryChange?.(objects, updated);
    }

    setSelectedObject(null);
  };

  return (
    <div className="flex-1 relative bg-white border border-gray-200 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full h-full transition-colors ${activeTool === 'select' ? 'cursor-pointer' : 'cursor-crosshair'}`}
        style={{ touchAction: 'none' }}
      />
      {/* Text Boxes Layer */}
      {objects.map(obj => obj.type === 'text' && (
        <div key={obj.id}>
          <div
            className={`absolute p-1 border-2 bg-yellow-50 transition-colors ${
              selectedObject === obj.id 
                ? 'border-blue-500 shadow-lg' 
                : 'border-dashed border-gray-400'
            }`}
            style={{
              left: `${obj.x}px`,
              top: `${obj.y}px`,
              minWidth: '100px',
              cursor: activeTool === 'select' ? 'move' : 'crosshair'
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (activeTool === 'select') {
                setSelectedObject(obj.id);
              }
            }}
          >
            <input
              type="text"
              value={obj.text}
              onChange={(e) => {
                setObjects(prev => prev.map(o => 
                  o.id === obj.id ? { ...o, text: e.target.value } : o
                ));
              }}
              placeholder="Type here"
              className="w-full bg-transparent text-sm focus:outline-none placeholder-gray-400"
              onClick={(e) => e.stopPropagation()}
              autoFocus={selectedObject === obj.id}
            />
          </div>
          {activeTool === 'select' && selectedObject === obj.id && (
            <button
              onClick={handleDeleteSelected}
              className="absolute bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors shadow-md"
              style={{
                top: `${obj.y - 16}px`,
                left: `${obj.x + 110}px`
              }}
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}

      {/* Delete button for selected strokes */}
      {selectedObject && strokes.some(s => s.id === selectedObject) && (
        <button
          onClick={handleDeleteSelected}
          className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition-colors flex items-center gap-2"
          title="Delete selected drawing"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      )}
    </div>
  );
}