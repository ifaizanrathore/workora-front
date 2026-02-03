'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Type,
  Calendar,
  Users,
  Hash,
  Timer,
  Flag,
  Circle,
  Target,
  ChevronDown,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// TYPES
// ============================================================

export interface Column {
  id: string;
  label: string;
  icon?: React.ReactNode;
  width: number;
  minWidth: number;
  maxWidth?: number;
  visible: boolean;
  resizable?: boolean;
  sortable?: boolean;
  fixed?: boolean; // If true, column cannot be hidden or reordered
}

export interface TaskListHeaderProps {
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortBy?: string; // Alias for sortColumn (for compatibility)
  sortDirection?: 'asc' | 'desc';
}

// ============================================================
// DEFAULT COLUMNS
// ============================================================

export const defaultColumns: Column[] = [
  {
    id: 'name',
    label: 'Name',
    icon: <Type className="h-4 w-4" />,
    width: 350,
    minWidth: 200,
    maxWidth: 600,
    visible: true,
    resizable: true,
    sortable: true,
    fixed: true, // Name column cannot be hidden
  },
  {
    id: 'dueDate',
    label: 'Due date',
    icon: <Calendar className="h-4 w-4" />,
    width: 130,
    minWidth: 100,
    maxWidth: 200,
    visible: true,
    resizable: true,
    sortable: true,
    fixed: false,
  },
  {
    id: 'assignee',
    label: 'Assignee',
    icon: <Users className="h-4 w-4" />,
    width: 120,
    minWidth: 80,
    maxWidth: 200,
    visible: true,
    resizable: true,
    fixed: false,
  },
  {
    id: 'tags',
    label: 'Tags',
    icon: <Hash className="h-4 w-4" />,
    width: 180,
    minWidth: 100,
    maxWidth: 300,
    visible: true,
    resizable: true,
    fixed: false,
  },
  {
    id: 'eta',
    label: 'ETA',
    icon: <Timer className="h-4 w-4" />,
    width: 150,
    minWidth: 120,
    maxWidth: 200,
    visible: true,
    resizable: true,
    sortable: true,
    fixed: false,
  },
  {
    id: 'timer',
    label: 'Timer',
    icon: <Target className="h-4 w-4" />,
    width: 120,
    minWidth: 100,
    maxWidth: 180,
    visible: true,
    resizable: true,
    fixed: false,
  },
  {
    id: 'priority',
    label: 'Priority',
    icon: <Flag className="h-4 w-4" />,
    width: 110,
    minWidth: 90,
    maxWidth: 150,
    visible: true,
    resizable: true,
    sortable: true,
    fixed: false,
  },
  {
    id: 'status',
    label: 'Status',
    icon: <Circle className="h-4 w-4" />,
    width: 130,
    minWidth: 100,
    maxWidth: 180,
    visible: true,
    resizable: true,
    sortable: true,
    fixed: false,
  },
];

// ============================================================
// HOOKS
// ============================================================

const STORAGE_KEY = 'workora-columns-v3';

// Only these properties are safe to save/load from localStorage
// React elements (icon) MUST NOT be serialized - they become plain objects on JSON.parse
const SERIALIZABLE_COLUMN_KEYS = ['id', 'width', 'visible', 'fixed'] as const;

export const useColumns = (initial: Column[] = defaultColumns) => {
  const [columns, setColumns] = useState<Column[]>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge saved with defaults - ONLY take serializable props from saved data
        // This prevents serialized React elements (icon) from overwriting real ones
        return initial.map(defaultCol => {
          const savedCol = parsed.find((c: any) => c.id === defaultCol.id);
          if (!savedCol) return defaultCol;
          // Only pick safe serializable properties from savedCol
          return {
            ...defaultCol,
            width: typeof savedCol.width === 'number' ? savedCol.width : defaultCol.width,
            visible: typeof savedCol.visible === 'boolean' ? savedCol.visible : defaultCol.visible,
          };
        });
      }
    } catch (e) {
      console.warn('Failed to load columns from localStorage');
    }
    return initial;
  });

  useEffect(() => {
    try {
      // Only save serializable properties - strip out React elements (icon) and functions
      const serializable = columns.map(col => ({
        id: col.id,
        width: col.width,
        visible: col.visible,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch (e) {
      console.warn('Failed to save columns to localStorage');
    }
  }, [columns]);

  const updateColumns = useCallback((newColumns: Column[]) => {
    setColumns(newColumns);
  }, []);

  const resetColumns = useCallback(() => {
    setColumns(initial);
    localStorage.removeItem(STORAGE_KEY);
  }, [initial]);

  const toggleColumn = useCallback((columnId: string) => {
    setColumns(cols =>
      cols.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  }, []);

  const resizeColumn = useCallback((columnId: string, newWidth: number) => {
    setColumns(cols =>
      cols.map(col => {
        if (col.id !== columnId) return col;
        const width = Math.max(col.minWidth, Math.min(newWidth, col.maxWidth || 600));
        return { ...col, width };
      })
    );
  }, []);

  return { columns, updateColumns, resetColumns, toggleColumn, resizeColumn };
};

// ============================================================
// COLUMN RESIZE HANDLE
// ============================================================

interface ResizeHandleProps {
  columnId: string;
  onResize: (columnId: string, delta: number) => void;
  onResizeEnd: () => void;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ columnId, onResize, onResizeEnd }) => {
  const handleRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    startXRef.current = e.clientX;
    onResize(columnId, delta);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    onResizeEnd();
  };

  return (
    <div
      ref={handleRef}
      onMouseDown={handleMouseDown}
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize group/resize z-20 hover:bg-purple-400"
      title="Drag to resize"
    >
      {/* Wider hit area */}
      <div className="absolute -left-1 -right-1 top-0 bottom-0" />
      {/* Visual indicator on hover */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-300 group-hover/resize:bg-purple-500 rounded-full opacity-0 group-hover/resize:opacity-100 transition-opacity" />
    </div>
  );
};

// ============================================================
// COLUMN VISIBILITY DROPDOWN
// ============================================================

interface ColumnVisibilityDropdownProps {
  columns: Column[];
  onToggle: (columnId: string) => void;
  onReset: () => void;
}

const ColumnVisibilityDropdown: React.FC<ColumnVisibilityDropdownProps> = ({
  columns,
  onToggle,
  onReset,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        title="Column settings"
      >
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Show/Hide Columns
          </div>
          
          {columns.map((col) => (
            <button
              key={col.id}
              onClick={() => !col.fixed && onToggle(col.id)}
              disabled={col.fixed}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors",
                col.fixed && "opacity-50 cursor-not-allowed hover:bg-transparent"
              )}
            >
              {col.visible ? (
                <Eye className="h-4 w-4 text-purple-500" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-300" />
              )}
              <span className={col.visible ? 'text-gray-700' : 'text-gray-400'}>
                {col.label}
              </span>
              {col.fixed && (
                <span className="ml-auto text-xs text-gray-400">Required</span>
              )}
            </button>
          ))}

          <div className="border-t border-gray-100 mt-2 pt-2">
            <button
              onClick={() => {
                onReset();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-left text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN HEADER COMPONENT
// ============================================================

export const TaskListHeader: React.FC<TaskListHeaderProps> = ({
  columns,
  onColumnsChange,
  onSort,
  sortColumn,
  sortBy, // Alias for sortColumn
  sortDirection,
}) => {
  const visibleColumns = columns.filter((col) => col.visible);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);

  // Use sortBy as fallback for sortColumn (for compatibility)
  const activeSortColumn = sortColumn || sortBy;

  const handleResize = useCallback((columnId: string, delta: number) => {
    setResizingColumn(columnId);
    const newColumns = columns.map(col => {
      if (col.id !== columnId) return col;
      const newWidth = Math.max(col.minWidth, Math.min(col.width + delta, col.maxWidth || 600));
      return { ...col, width: newWidth };
    });
    onColumnsChange(newColumns);
  }, [columns, onColumnsChange]);

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null);
  }, []);

  const handleSort = (columnId: string) => {
    if (!onSort) return;
    const column = columns.find(c => c.id === columnId);
    if (!column?.sortable) return;
    
    const newDirection = activeSortColumn === columnId && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnId, newDirection);
  };

  const toggleColumn = (columnId: string) => {
    const newColumns = columns.map(col =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    );
    onColumnsChange(newColumns);
  };

  const resetColumns = () => {
    onColumnsChange(defaultColumns);
  };

  // Calculate total width
  const totalWidth = visibleColumns.reduce((sum, col) => sum + col.width, 0) + 70;

  return (
    <div
      className="flex items-center bg-white border-b border-gray-200 sticky top-0 z-20"
      style={{ minWidth: totalWidth }}
    >
      {/* Spacer for drag handle */}
      <div className="w-6 flex-shrink-0" />

      {/* Column headers */}
      {visibleColumns.map((column) => (
        <div
          key={column.id}
          className={cn(
            'relative flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider select-none flex-shrink-0',
            column.sortable && 'cursor-pointer hover:text-gray-700',
            resizingColumn === column.id && 'bg-purple-50'
          )}
          style={{ width: column.width }}
          onClick={() => column.sortable && handleSort(column.id)}
        >
          {React.isValidElement(column.icon) ? column.icon : null}
          <span className="truncate">{column.label}</span>
          
          {/* Sort indicator */}
          {activeSortColumn === column.id && (
            <span className="text-purple-500">
              {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
          )}

          {/* Resize handle */}
          {column.resizable && (
            <ResizeHandle
              columnId={column.id}
              onResize={handleResize}
              onResizeEnd={handleResizeEnd}
            />
          )}
        </div>
      ))}

      {/* Actions column header */}
      <div className="flex items-center gap-1 px-2 min-w-[100px] justify-end flex-shrink-0">
        <ColumnVisibilityDropdown
          columns={columns}
          onToggle={toggleColumn}
          onReset={resetColumns}
        />
      </div>
    </div>
  );
};

export default TaskListHeader;