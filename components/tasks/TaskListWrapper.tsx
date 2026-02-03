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
// WRAPPER
// ============================================================

interface TaskListWrapperProps {
  children: React.ReactNode;
  className?: string;
  onReorder?: (taskId: string, targetTaskId: string, position: 'above' | 'below') => void;
}

export const TaskListWrapper: React.FC<TaskListWrapperProps> = ({
  children,
  className,
  onReorder,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'above' | 'below' | null>(null);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftShadow(scrollLeft > 0);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    handleScroll();
    const el = scrollRef.current;
    window.addEventListener('resize', handleScroll);
    el?.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', handleScroll);
      el?.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Handle drag end → reorder
  useEffect(() => {
    const handler = () => {
      if (draggedTaskId && dragOverTaskId && dragPosition && onReorder) {
        onReorder(draggedTaskId, dragOverTaskId, dragPosition);
      }
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      setDragPosition(null);
    };
    window.addEventListener('dragend', handler);
    return () => window.removeEventListener('dragend', handler);
  }, [draggedTaskId, dragOverTaskId, dragPosition, onReorder]);

  return (
    <DragDropContext.Provider value={{ draggedTaskId, dragOverTaskId, dragPosition, setDraggedTaskId, setDragOverTaskId, setDragPosition }}>
      <div className={cn('relative flex-1 overflow-hidden', className)}>
        {/* Left scroll shadow */}
        {showLeftShadow && (
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white/80 to-transparent z-10 pointer-events-none" />
        )}

        {/* Scrollable area — custom thin scrollbar */}
        <div
          ref={scrollRef}
          className="overflow-auto h-full scrollbar-custom"
        >
          <div className="min-w-max">
            {children}
          </div>
        </div>

        {/* Right scroll shadow */}
        {showRightShadow && (
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white/80 to-transparent z-10 pointer-events-none" />
        )}
      </div>
    </DragDropContext.Provider>
  );
};

export default TaskListWrapper;