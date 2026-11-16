import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Youtube } from 'lucide-react';

export default function RouteReorderList({ routes, onReorder, isSaving }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    const items = Array.from(routes);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    onReorder(items);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="route-order">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
            {routes.map((route, index) => (
              <Draggable key={route.id} draggableId={route.id} index={index}>
                {(dragProvided, snapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className={`flex items-center gap-3 rounded-xl border-2 bg-white p-3 ${
                      snapshot.isDragging ? 'border-[#F7B602] shadow-lg' : 'border-slate-100'
                    } ${isSaving ? 'opacity-70' : ''}`}
                  >
                    <span className="w-5 text-sm font-bold text-slate-400 shrink-0">{index + 1}</span>
                    <div className="w-16 h-10 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                      {route.youtubeVideoId ? (
                        <img
                          src={`https://img.youtube.com/vi/${route.youtubeVideoId}/mqdefault.jpg`}
                          alt={route.routeName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Youtube className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <p className="flex-1 text-sm font-medium text-[#071739] truncate">{route.routeName}</p>
                    <GripVertical className="w-5 h-5 text-slate-400 shrink-0" />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}