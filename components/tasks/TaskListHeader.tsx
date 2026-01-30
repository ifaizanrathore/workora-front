'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Plus,
  GripVertical,
  ChevronDown,
  Eye,
  EyeOff,
  Calendar,
  User,
  Hash,
  Timer,
  Flag,
  CircleDot,
  Type,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// TYPES
// ============================================================

export interface Column {
  id: string;
  label: string;
  icon: React.ReactNode;
  width: number;
  minWidth: number;
  visible: boolean;
  fixed?: boolean; // Name column is fixed
  sortable?: boolean;
}

export interface TaskListHeaderProps {
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  className?: string;
}

// ============================================================
// DEFAULT COLUMNS
// ============================================================

export const defaultColumns: Column[] = [
  {
    id: 'name',
    label: 'Name',
    icon: <Type className="h-4 w-4" />,
    width: 400,
    minWidth: 200,
    visible: true,
    fixed: true,
    sortable: true,
  },
  {
    id: 'dueDate',
    label: 'Due date',
    icon: <Calendar className="h-4 w-4" />,
    width: 140,
    minWidth: 100,
    visible: true,
    sortable: true,
  },
  {
    id: 'assignee',
    label: 'Assignee',
    icon: <User className="h-4 w-4" />,
    width: 120,
    minWidth: 80,
    visible: true,
    sortable: true,
  },
  {
    id: 'tags',
    label: 'Tags',
    icon: <Hash className="h-4 w-4" />,
    width: 120,
    minWidth: 80,
    visible: true,
    sortable: false,
  },
  {
    id: 'timer',
    label: 'Timer',
    icon: <Timer className="h-4 w-4" />,
    width: 140,
    minWidth: 100,
    visible: true,
    sortable: true,
  },
  {
    id: 'priority',
    label: 'Priority',
    icon: <Flag className="h-4 w-4" />,
    width: 120,
    minWidth: 80,
    visible: true,
    sortable: true,
  },
  {
    id: 'status',
    label: 'Status',
    icon: <CircleDot className="h-4 w-4" />,
    width: 130,
    minWidth: 100,
    visible: true,
    sortable: true,
  },
];

// ============================================================
// COLUMN HEADER ITEM
// ============================================================

interface ColumnHeaderItemProps {
  column: Column;
  index: number;
  isDragging: boolean;
  isOver: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  onResize: (columnId: string, width: number) => void;
  onSort?: (columnId: string) => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

const ColumnHeaderItem: React.FC<ColumnHeaderItemProps> = ({
  column,
  index,
  isDragging,
  isOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onResize,
  onSort,
  sortBy,
  sortDirection,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(column.width);
  const headerRef = useRef<HTMLDivElement>(null);

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(column.width);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX;
      const newWidth = Math.max(column.minWidth, startWidth + diff);
      onResize(column.id, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startX, startWidth, column.id, column.minWidth, onResize]);

  const isSorted = sortBy === column.id;

  return (
    <div
      ref={headerRef}
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-500 select-none',
        'border-r border-gray-100 last:border-r-0',
        'transition-colors duration-150',
        !column.fixed && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 bg-gray-100',
        isOver && 'bg-purple-50 border-l-2 border-l-purple-400',
        column.sortable && 'hover:text-gray-700 hover:bg-gray-50'
      )}
      style={{ width: column.width, minWidth: column.minWidth }}
      draggable={!column.fixed}
      onDragStart={(e) => {
        if (column.fixed) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(index);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!column.fixed) {
          onDragOver(index);
        }
      }}
      onDragEnd={onDragEnd}
      onClick={() => column.sortable && onSort?.(column.id)}
    >
      {/* Drag Handle (hidden for fixed columns) */}
      {!column.fixed && (
        <GripVertical className="h-3.5 w-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
      )}

      {/* Column Label */}
      <span className="truncate">{column.label}</span>

      {/* Sort Indicator */}
      {isSorted && (
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-gray-400 transition-transform',
            sortDirection === 'asc' && 'rotate-180'
          )}
        />
      )}

      {/* Resize Handle */}
      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 w-1 cursor-col-resize',
          'hover:bg-purple-400 transition-colors',
          isResizing && 'bg-purple-400'
        )}
        onMouseDown={handleResizeStart}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

// ============================================================
// ADD COLUMN DROPDOWN
// ============================================================

interface AddColumnDropdownProps {
  columns: Column[];
  onToggleColumn: (columnId: string) => void;
  onAddCustomColumn?: () => void;
}

const AddColumnDropdown: React.FC<AddColumnDropdownProps> = ({
  columns,
  onToggleColumn,
  onAddCustomColumn,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hiddenColumns = columns.filter((c) => !c.visible && !c.fixed);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded',
          'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
          'transition-colors'
        )}
      >
        <Plus className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
            Show/Hide Columns
          </div>

          {columns
            .filter((c) => !c.fixed)
            .map((column) => (
              <button
                key={column.id}
                onClick={() => onToggleColumn(column.id)}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="text-gray-400">{column.icon}</span>
                <span className="flex-1 text-left">{column.label}</span>
                {column.visible ? (
                  <Eye className="h-4 w-4 text-purple-500" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-300" />
                )}
              </button>
            ))}

          {onAddCustomColumn && (
            <>
              <div className="border-t border-gray-100 my-2" />
              <button
                onClick={onAddCustomColumn}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-purple-600 hover:bg-purple-50"
              >
                <Plus className="h-4 w-4" />
                <span>Add Custom Field</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN TASK LIST HEADER COMPONENT
// ============================================================

export const TaskListHeader: React.FC<TaskListHeaderProps> = ({
  columns,
  onColumnsChange,
  onSort,
  sortBy,
  sortDirection,
  className,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Handle drag start
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((index: number) => {
    setOverIndex(index);
  }, []);

  // Handle drag end - reorder columns
  const handleDragEnd = useCallback(() => {
    if (draggedIndex === null || overIndex === null || draggedIndex === overIndex) {
      setDraggedIndex(null);
      setOverIndex(null);
      return;
    }

    const visibleColumns = columns.filter((c) => c.visible);
    const newColumns = [...visibleColumns];
    const [draggedColumn] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(overIndex, 0, draggedColumn);

    // Merge back with hidden columns
    const hiddenColumns = columns.filter((c) => !c.visible);
    onColumnsChange([...newColumns, ...hiddenColumns]);

    setDraggedIndex(null);
    setOverIndex(null);
  }, [draggedIndex, overIndex, columns, onColumnsChange]);

  // Handle column resize
  const handleResize = useCallback(
    (columnId: string, width: number) => {
      const newColumns = columns.map((col) =>
        col.id === columnId ? { ...col, width } : col
      );
      onColumnsChange(newColumns);
    },
    [columns, onColumnsChange]
  );

  // Handle column visibility toggle
  const handleToggleColumn = useCallback(
    (columnId: string) => {
      const newColumns = columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      );
      onColumnsChange(newColumns);
    },
    [columns, onColumnsChange]
  );

  // Handle sort
  const handleSort = useCallback(
    (columnId: string) => {
      if (!onSort) return;
      const newDirection =
        sortBy === columnId && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(columnId, newDirection);
    },
    [onSort, sortBy, sortDirection]
  );

  const visibleColumns = columns.filter((c) => c.visible);

  return (
    <div
      className={cn(
        'flex items-center bg-white border-b border-gray-200',
        'sticky top-0 z-10',
        className
      )}
    >
      {/* Checkbox Column */}
      <div className="flex items-center justify-center w-10 px-2 py-2.5 border-r border-gray-100">
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
      </div>

      {/* Column Headers */}
      {visibleColumns.map((column, index) => (
        <ColumnHeaderItem
          key={column.id}
          column={column}
          index={index}
          isDragging={draggedIndex === index}
          isOver={overIndex === index && draggedIndex !== index}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onResize={handleResize}
          onSort={handleSort}
          sortBy={sortBy}
          sortDirection={sortDirection}
        />
      ))}

      {/* Add Column Button */}
      <div className="flex items-center px-2 py-2.5">
        <AddColumnDropdown
          columns={columns}
          onToggleColumn={handleToggleColumn}
        />
      </div>
    </div>
  );
};

// ============================================================
// HOOK FOR COLUMN MANAGEMENT
// ============================================================

const STORAGE_KEY = 'workora-columns';

export function useColumns(initialColumns: Column[] = defaultColumns) {
  const [columns, setColumns] = useState<Column[]>(() => {
    // Try to load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Merge with defaults to handle new columns
          return initialColumns.map((defaultCol) => {
            const savedCol = parsed.find((c: Column) => c.id === defaultCol.id);
            return savedCol
              ? { ...defaultCol, ...savedCol, icon: defaultCol.icon }
              : defaultCol;
          });
        } catch {
          return initialColumns;
        }
      }
    }
    return initialColumns;
  });

  // Save to localStorage on change
  useEffect(() => {
    const toSave = columns.map(({ icon, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [columns]);

  const updateColumns = useCallback((newColumns: Column[]) => {
    setColumns(newColumns);
  }, []);

  const resetColumns = useCallback(() => {
    setColumns(initialColumns);
    localStorage.removeItem(STORAGE_KEY);
  }, [initialColumns]);

  const showColumn = useCallback((columnId: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, visible: true } : col))
    );
  }, []);

  const hideColumn = useCallback((columnId: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, visible: false } : col))
    );
  }, []);

  const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
    setColumns((prev) => {
      const visible = prev.filter((c) => c.visible);
      const hidden = prev.filter((c) => !c.visible);
      const [moved] = visible.splice(fromIndex, 1);
      visible.splice(toIndex, 0, moved);
      return [...visible, ...hidden];
    });
  }, []);

  return {
    columns,
    updateColumns,
    resetColumns,
    showColumn,
    hideColumn,
    moveColumn,
  };
}

export default TaskListHeader;