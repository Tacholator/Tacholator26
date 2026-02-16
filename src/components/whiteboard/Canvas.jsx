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
  readOnly = false 
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [objects, setObjects] = useState([]);
  const [strokes, setStrokes] = useState([]);
  const [lastPoint, setLastPoint] = useState(null);

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
      
      // Update last stroke with new point
      setStrokes(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].points.push(pos);
        }
        return updated;
      });
    }

    onObjectChange?.();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastPoint(null);
    onStrokeEnd?.();
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="flex-1 bg-white border border-gray-200 rounded-lg cursor-crosshair"
      style={{ touchAction: 'none' }}
    />
  );
}