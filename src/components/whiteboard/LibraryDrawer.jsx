import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

const LIBRARY_CATALOG = [
  {
    "id": "shape_square",
    "category": "shapes",
    "name": "Square",
    "defaultSize": { "w": 180, "h": 180 },
    "vector": { "kind": "rect", "radius": 0 },
    "styleDefaults": { "stroke": "#111111", "strokeWidth": 3, "fill": "transparent", "opacity": 1 }
  },
  {
    "id": "shape_rectangle",
    "category": "shapes",
    "name": "Rectangle",
    "defaultSize": { "w": 240, "h": 160 },
    "vector": { "kind": "rect", "radius": 10 },
    "styleDefaults": { "stroke": "#111111", "strokeWidth": 3, "fill": "transparent", "opacity": 1 }
  },
  {
    "id": "shape_circle",
    "category": "shapes",
    "name": "Circle",
    "defaultSize": { "w": 200, "h": 200 },
    "vector": { "kind": "ellipse" },
    "styleDefaults": { "stroke": "#111111", "strokeWidth": 3, "fill": "transparent", "opacity": 1 }
  },
  {
    "id": "shape_triangle",
    "category": "shapes",
    "name": "Triangle",
    "defaultSize": { "w": 220, "h": 200 },
    "vector": { "kind": "triangle" },
    "styleDefaults": { "stroke": "#111111", "strokeWidth": 3, "fill": "transparent", "opacity": 1 }
  },
  {
    "id": "line_straight",
    "category": "lines_arrows",
    "name": "Line",
    "defaultSize": { "w": 260, "h": 10 },
    "vector": { "kind": "line" },
    "styleDefaults": { "stroke": "#111111", "strokeWidth": 5, "fill": "transparent", "opacity": 1, "lineStyle": "solid" }
  },
  {
    "id": "arrow_single",
    "category": "lines_arrows",
    "name": "Arrow",
    "defaultSize": { "w": 260, "h": 80 },
    "vector": { "kind": "arrow" },
    "styleDefaults": { "stroke": "#111111", "strokeWidth": 6, "fill": "transparent", "opacity": 1 }
  }
];

const CATEGORIES = [
  { id: 'shapes', label: 'Shapes' },
  { id: 'lines_arrows', label: 'Lines & Arrows' }
];

export default function LibraryDrawer({ isOpen, onClose, onItemDragStart }) {
  const [activeCategory, setActiveCategory] = useState('shapes');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = LIBRARY_CATALOG.filter(item => {
    const matchesCategory = item.category === activeCategory;
    const matchesSearch = searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDragStart = (e, item) => {
    onItemDragStart?.(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="font-semibold text-lg">Library</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-4 pt-4 border-b border-gray-200 overflow-x-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Items */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {filteredItems.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-8">
                  No items found
                </p>
              ) : (
                filteredItems.map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-move transition-colors"
                  >
                    <p className="font-medium text-sm text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.defaultSize.w} × {item.defaultSize.h}px
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}