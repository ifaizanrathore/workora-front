'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Type,
  Calendar,
  Users,
  Hash,
  Timer,
  Flag,
  CircleDot,
  Target,
  ChevronDown,
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  Plus,
  Check,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// SHARED TYPES
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
  fixed?: boolean;
}

/** Re-export for CellDropdowns / TaskList compatibility */
export interface StatusOption {
  id?: string | number | null;
  status?: string | null;
  color?: string | null;
  type?: string | null;
  orderindex?: number | null;
}

// ============================================================
// DEFAULT COLUMNS — Status moved to position 2 (was position 8)
// ============================================================

export const defaultColumns: Column[] = [
  {
    id: 'name',
    label: 'Name',
    icon: <Type className="h-3.5 w-3.5" />,
    width: 320,
    minWidth: 200,
    maxWidth: 600,
    visible: true,
    resizable: true,
    sortable: true,
    fixed: true,
  },
  {
    id: 'status',
    label: 'Status',
    icon: <CircleDot className="h-3.5 w-3.5" />,
    width: 140,
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
    icon: <Users className="h-3.5 w-3.5" />,
    width: 120,
    minWidth: 80,
    maxWidth: 200,
    visible: true,
    resizable: true,
    fixed: false,
  },
  {
    id: 'dueDate',
    label: 'Due date',
    icon: <Calendar className="h-3.5 w-3.5" />,
    width: 130,
    minWidth: 100,
    maxWidth: 200,
    visible: true,
    resizable: true,
    sortable: true,
    fixed: false,
  },
  {
    id: 'priority',
    label: 'Priority',
    icon: <Flag className="h-3.5 w-3.5" />,
    width: 110,
    minWidth: 90,
    maxWidth: 150,
    visible: true,
    resizable: true,
    sortable: true,
    fixed: false,
  },
  {
    id: 'tags',
    label: 'Tags',
    icon: <Hash className="h-3.5 w-3.5" />,
    width: 160,
    minWidth: 100,
    maxWidth: 300,
    visible: true,
    resizable: true,
    fixed: false,
  },
  {
    id: 'eta',
    label: 'ETA',
    icon: <Timer className="h-3.5 w-3.5" />,
    width: 130,
    minWidth: 100,
    maxWidth: 200,
    visible: true,
    resizable: true,
    sortable: true,
    fixed: false,
  },
  {
    id: 'timer',
    label: 'Timer',
    icon: <Target className="h-3.5 w-3.5" />,
    width: 110,
    minWidth: 90,
    maxWidth: 180,
    visible: true,
    resizable: true,
    fixed: false,
  },
];

// ============================================================
// HOOKS — useColumns with safe localStorage (no React elements)
// ============================================================

const STORAGE_KEY = 'workora-columns-v4';

export const useColumns = (initial: Column[] = defaultColumns) => {
  const [columns, setColumns] = useState<Column[]>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: { id: string; width: number; visible: boolean }[] = JSON.parse(saved);
        return initial.map((defaultCol) => {
          const savedCol = parsed.find((c) => c.id === defaultCol.id);
          if (!savedCol) return defaultCol;
          return {
            ...defaultCol,
            width: typeof savedCol.width === 'number' ? savedCol.width : defaultCol.width,
            visible: typeof savedCol.visible === 'boolean' ? savedCol.visible : defaultCol.visible,
          };
        });
      }
    } catch {
      console.warn('Failed to load columns from localStorage');
    }
    return initial;
  });

  useEffect(() => {
    try {
      const serializable = columns.map((col) => ({ id: col.id, width: col.width, visible: col.visible }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch {
      console.warn('Failed to save columns to localStorage');
    }
  }, [columns]);

  const updateColumns = useCallback((newColumns: Column[]) => setColumns(newColumns), []);

  const resetColumns = useCallback(() => {
    setColumns(initial);
    localStorage.removeItem(STORAGE_KEY);
  }, [initial]);

  const toggleColumn = useCallback((columnId: string) => {
    setColumns((cols) =>
      cols.map((col) => (col.id === columnId && !col.fixed ? { ...col, visible: !col.visible } : col))
    );
  }, []);

  const resizeColumn = useCallback((columnId: string, newWidth: number) => {
    setColumns((cols) =>
      cols.map((col) => {
        if (col.id !== columnId) return col;
        return { ...col, width: Math.max(col.minWidth, Math.min(newWidth, col.maxWidth || 600)) };
      })
    );
  }, []);

  return { columns, updateColumns, resetColumns, toggleColumn, resizeColumn };
};

// ============================================================
// RESIZE HANDLE
// ============================================================

const ResizeHandle: React.FC<{
  columnId: string;
  onResize: (columnId: string, delta: number) => void;
  onResizeEnd: () => void;
}> = ({ columnId, onResize, onResizeEnd }) => {
  const isDragging = useRef(false);
  const startX = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    startX.current = e.clientX;
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      onResize(columnId, ev.clientX - startX.current);
      startX.current = ev.clientX;
    };
    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      onResizeEnd();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div onMouseDown={onMouseDown} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-20 hover:bg-purple-400 transition-colors">
      <div className="absolute -left-1.5 -right-1.5 top-0 bottom-0" />
    </div>
  );
};

// ============================================================
// FIELDS PANEL (ClickUp-style column manager)
// ============================================================

const FieldsPanel: React.FC<{
  columns: Column[];
  onToggle: (id: string) => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
}> = ({ columns, onToggle, onReset, isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleable = columns.filter((c) => !c.fixed);
  const filtered = search
    ? toggleable.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()))
    : toggleable;
  const shown = filtered.filter((c) => c.visible);
  const hidden = filtered.filter((c) => !c.visible);

  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 z-50 w-60 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Search */}
      <div className="p-2 border-b border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search fields..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-400 dark:focus:ring-purple-500 focus:border-purple-400 dark:focus:border-purple-500"
          />
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto py-1">
        {shown.length > 0 && (
          <div>
            <div className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Shown</div>
            {shown.map((col) => (
              <button key={col.id} onClick={() => onToggle(col.id)} className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="w-4 h-4 rounded border-[1.5px] border-purple-500 bg-purple-500 flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                </div>
                <span className="text-gray-700 dark:text-gray-200">{col.label}</span>
              </button>
            ))}
          </div>
        )}
        {hidden.length > 0 && (
          <div className={shown.length > 0 ? 'border-t border-gray-100 dark:border-gray-700 mt-1 pt-1' : ''}>
            <div className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Hidden</div>
            {hidden.map((col) => (
              <button key={col.id} onClick={() => onToggle(col.id)} className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="w-4 h-4 rounded border-[1.5px] border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                <span className="text-gray-400 dark:text-gray-500">{col.label}</span>
              </button>
            ))}
          </div>
        )}
        {filtered.length === 0 && <div className="px-3 py-3 text-center text-sm text-gray-400 dark:text-gray-500">No fields found</div>}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 p-1.5">
        <button onClick={() => { onReset(); onClose(); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to defaults
        </button>
      </div>
    </div>
  );
};

// ============================================================
// MAIN HEADER
// ============================================================

export interface TaskListHeaderProps {
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  allSelected?: boolean;
  someSelected?: boolean;
  onSelectAll?: (selected: boolean) => void;
  taskCount?: number;
}

export const TaskListHeader: React.FC<TaskListHeaderProps> = ({
  columns,
  onColumnsChange,
  onSort,
  sortColumn,
  sortBy,
  sortDirection,
  allSelected,
  someSelected,
  onSelectAll,
}) => {
  const visible = columns.filter((c) => c.visible);
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [showFields, setShowFields] = useState(false);
  const activeSort = sortColumn || sortBy;

  const handleResize = useCallback(
    (colId: string, delta: number) => {
      setResizingCol(colId);
      onColumnsChange(
        columns.map((c) => {
          if (c.id !== colId) return c;
          return { ...c, width: Math.max(c.minWidth, Math.min(c.width + delta, c.maxWidth || 600)) };
        })
      );
    },
    [columns, onColumnsChange]
  );

  const handleSort = (colId: string) => {
    if (!onSort) return;
    const col = columns.find((c) => c.id === colId);
    if (!col?.sortable) return;
    onSort(colId, activeSort === colId && sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const toggleCol = (id: string) => {
    onColumnsChange(columns.map((c) => (c.id === id && !c.fixed ? { ...c, visible: !c.visible } : c)));
  };

  const resetCols = () => {
    onColumnsChange(defaultColumns);
    localStorage.removeItem(STORAGE_KEY);
  };

  const totalW = visible.reduce((s, c) => s + c.width, 0) + 96;

  return (
    <div className="flex items-center bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 transition-colors" style={{ minWidth: totalW }}>
      {/* Checkbox + drag spacer */}
      <div className="w-[60px] flex-shrink-0 flex items-center pl-3 pr-1">
        <button
          onClick={() => onSelectAll?.(!allSelected)}
          className={cn(
            'w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all',
            allSelected ? 'bg-purple-600 border-purple-600' : someSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 bg-white dark:bg-gray-800'
          )}
        >
          {allSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
          {someSelected && !allSelected && <Minus className="h-3 w-3 text-white" strokeWidth={3} />}
        </button>
      </div>

      {visible.map((col) => (
        <div
          key={col.id}
          className={cn(
            'relative flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none flex-shrink-0',
            col.sortable && 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50',
            resizingCol === col.id && 'bg-purple-50 dark:bg-purple-900/30'
          )}
          style={{ width: col.width }}
          onClick={() => col.sortable && handleSort(col.id)}
        >
          <span className="text-gray-400 dark:text-gray-500">{React.isValidElement(col.icon) ? col.icon : null}</span>
          <span className="truncate">{col.label}</span>
          {activeSort === col.id && <span className="text-purple-500 dark:text-purple-400 text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
          {col.resizable && <ResizeHandle columnId={col.id} onResize={handleResize} onResizeEnd={() => setResizingCol(null)} />}
        </div>
      ))}

      {/* + button → Fields panel */}
      <div className="flex items-center px-2 min-w-[36px] flex-shrink-0 relative">
        <button
          onClick={() => setShowFields(!showFields)}
          className={cn('p-1 rounded hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors', showFields ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300')}
          title="Manage columns"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <FieldsPanel columns={columns} onToggle={toggleCol} onReset={resetCols} isOpen={showFields} onClose={() => setShowFields(false)} />
      </div>
    </div>
  );
};

export default TaskListHeader;