import React from 'react';
import { Button } from '@/components/ui/button';
import { Pen, Highlighter, Eraser, Square, Type, Undo2, Redo2, MousePointer } from 'lucide-react';

export default function ToolBar({ 
  activeTool, 
  onToolChange,
  onUndo,
  onRedo 
}) {
  const tools = [
    { id: 'select', label: 'Select', icon: MousePointer },
    { id: 'pen', label: 'Pen', icon: Pen },
    { id: 'highlighter', label: 'Highlighter', icon: Highlighter },
    { id: 'eraser', label: 'Eraser', icon: Eraser },
    { id: 'shape', label: 'Shape', icon: Square },
    { id: 'text', label: 'Text', icon: Type }
  ];

  return (
    <div className="flex items-center gap-2 p-4 bg-white border-b border-gray-200 rounded-t-lg">
      <div className="flex gap-1 border-r border-gray-300 pr-3">
        {tools.map(tool => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
            className="w-10 h-10"
          >
            <tool.icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onUndo}
          title="Undo"
          className="w-10 h-10"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRedo}
          title="Redo"
          className="w-10 h-10"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}