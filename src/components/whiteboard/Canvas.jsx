import React, { useRef, useEffect, useState } from 'react';

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
  readOnly = false 
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [objects, setObjects] = useState([]);
  const [strokes, setStrokes] = useState([]);
  const [lastPoint, setLastPoint] = useState(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);

  // Update canvas when history changes (undo/redo)
  useEffect(() => {
    if (historyIndex >= 0 && history && history[historyIndex]) {
      const state = history[historyIndex];
      setObjects(state.objects || []);
      setStrokes(state.strokes || []);
      redrawCanvas(state.objects || [], state.strokes || []);
    }
  }, [historyIndex]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    // Set canvas size to window
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const ctx = canvas.getContext('2d');
    setContext(ctx);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, canvas);
    }
  }, [showGrid]);

  const redrawCanvas = (canvasObjects, canvasStrokes) => {
    if (!context || !canvasRef.current) return;
    const canvas = canvasRef.current;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    if (showGrid) {
      drawGrid(context, canvas);
    }
    
    canvasStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      context.strokeStyle = stroke.color;
      context.globalAlpha = stroke.opacity || 1;
      context.lineWidth = stroke.width;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      
      context.beginPath();
      context.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        context.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      context.stroke();
    });
    
    context.globalAlpha = 1;
  };

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

  const handleMouseDown = (e) => {
    if (readOnly) return;
    
    const pos = getMousePos(e);
    if (!pos) return;

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
      context.clearRect(pos.x - strokeWidth / 2, pos.y - strokeWidth / 2, strokeWidth, strokeWidth);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !context) return;

    const pos = getMousePos(e);
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
      context.clearRect(pos.x - strokeWidth / 2, pos.y - strokeWidth / 2, strokeWidth, strokeWidth);
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
    onStrokeEnd?.();
  };

  return (
    <div className="flex-1 relative bg-white border border-gray-200 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-crosshair"
        style={{ touchAction: 'none' }}
      />
      {/* Text Boxes Layer */}
      {objects.map(obj => obj.type === 'text' && (
        <div
          key={obj.id}
          className="absolute p-1 border border-dashed border-gray-400 bg-yellow-50"
          style={{
            left: `${obj.x}px`,
            top: `${obj.y}px`,
            minWidth: '100px',
            cursor: 'move'
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setSelectedObject(obj.id);
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
            className="w-full bg-transparent text-sm focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ))}
    </div>
  );
}