import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function PropertiesPanel({
  activeTool,
  strokeWidth,
  strokeColor,
  strokeOpacity,
  snapToGrid,
  showGrid,
  onStrokeWidthChange,
  onStrokeColorChange,
  onStrokeOpacityChange,
  onSnapToGridChange,
  onShowGridChange,
  onResetView,
  onClose
}) {
  const [quickExpanded, setQuickExpanded] = useState(true);
  const showStrokeProps = activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser';

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 space-y-6 overflow-y-auto relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 hover:opacity-60 z-10"
        title="Close panel"
      >
        <ChevronDown className="w-4 h-4 rotate-90" />
      </button>
      {/* Quick Actions */}
      <div className="pt-2">
        <button
          onClick={() => setQuickExpanded(!quickExpanded)}
          className="flex items-center justify-between w-full font-semibold text-sm mb-3 hover:opacity-70"
        >
          <span>Quick</span>
          {quickExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {quickExpanded && (
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <Checkbox 
                checked={snapToGrid}
                onCheckedChange={onSnapToGridChange}
              />
              <span className="text-sm">Snap to grid</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox 
                checked={showGrid}
                onCheckedChange={onShowGridChange}
              />
              <span className="text-sm">Show grid</span>
            </label>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={onResetView}
            >
              Reset view
            </Button>
          </div>
        )}
      </div>

      {/* Stroke Properties */}
      {showStrokeProps && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Stroke</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Thickness: {strokeWidth}px</Label>
              <Slider
                value={[strokeWidth]}
                onValueChange={(val) => onStrokeWidthChange(val[0])}
                min={1}
                max={18}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-xs">Color</Label>
              <div className="flex gap-2 mt-2">
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => onStrokeColorChange(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input
                  value={strokeColor}
                  onChange={(e) => onStrokeColorChange(e.target.value)}
                  className="text-sm flex-1"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Opacity: {Math.round(strokeOpacity * 100)}%</Label>
              <Slider
                value={[strokeOpacity]}
                onValueChange={(val) => onStrokeOpacityChange(val[0])}
                min={0.1}
                max={1}
                step={0.05}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}