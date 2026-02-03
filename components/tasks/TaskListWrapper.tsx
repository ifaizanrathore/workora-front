'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// DRAG AND DROP CONTEXT
// ============================================================

interface DragDropContextValue {
  draggedTaskId: string | null;
  dragOverTaskId: string | null;
  dragPosition: 'above' | 'below' | null;
  setDraggedTaskId: (id: string | null) => void;
  setDragOverTaskId: (id: string | null) => void;
  setDragPosition: (position: 'above' | 'below' | null) => void;
}

export const DragDropContext = React.createContext<DragDropContextValue>({
  draggedTaskId: null,
  dragOverTaskId: null,
  dragPosition: null,
  setDraggedTaskId: () => {},
  setDragOverTaskId: () => {},
  setDragPosition: () => {},
});

export const useDragDrop = () => React.useContext(DragDropContext);

// ============================================================
// TASK LIST WRAPPER - With drag-drop, hidden scrollbars
// ============================================================

interface TaskListWrapperProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
  onReorder?: (taskId: string, targetTaskId: string, position: 'above' | 'below') => void;
}

export const TaskListWrapper: React.FC<TaskListWrapperProps> = ({ 
  children, 
  className,
  maxHeight = 'calc(100vh - 280px)',
  onReorder,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);
  
  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'above' | 'below' | null>(null);

  // Check scroll position to show/hide shadows
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftShadow(scrollLeft > 0);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [handleScroll]);

  // Handle drop - call onReorder when drag ends
  useEffect(() => {
    const handleDragEnd = () => {
      if (draggedTaskId && dragOverTaskId && dragPosition && onReorder) {
        onReorder(draggedTaskId, dragOverTaskId, dragPosition);
      }
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      setDragPosition(null);
    };
    
    window.addEventListener('dragend', handleDragEnd);
    return () => window.removeEventListener('dragend', handleDragEnd);
  }, [draggedTaskId, dragOverTaskId, dragPosition, onReorder]);

  const contextValue: DragDropContextValue = {
    draggedTaskId,
    dragOverTaskId,
    dragPosition,
    setDraggedTaskId,
    setDragOverTaskId,
    setDragPosition,
  };

  return (
    <DragDropContext.Provider value={contextValue}>
      <div className={cn('relative flex-1', className)}>
        {/* Left scroll shadow */}
        {showLeftShadow && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        )}
        
        {/* Scrollable container - HIDDEN SCROLLBARS */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={cn(
            "overflow-auto",
            // Tailwind class to hide scrollbar (add to tailwind config or use inline)
            "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          )}
          style={{ maxHeight }}
        >
          <div className="min-w-max">
            {children}
          </div>
        </div>
        
        {/* Right scroll shadow */}
        {showRightShadow && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        )}
      </div>
    </DragDropContext.Provider>
  );
};
    
export default TaskListWrapper;