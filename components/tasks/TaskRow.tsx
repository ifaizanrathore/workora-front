'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  GripVertical,
  Play,
  Pause,
  MoreHorizontal,
  User,
  Flag,
  Clock,
  Check,
  X,
  ChevronDown,
  Trash2,
  Copy,
  ExternalLink,
  Archive,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Column } from './TaskListHeader';
import type { Task } from '@/types';

// ============================================================
// DRAG & DROP CONTEXT
// ============================================================

interface DragDropContextValue {
  draggedTaskId: string | null;
  dragOverTaskId: string | null;
  dragPosition: 'above' | 'below' | null;
  setDraggedTaskId: (id: string | null) => void;
  setDragOverTaskId: (id: string | null) => void;
  setDragPosition: (pos: 'above' | 'below' | null) => void;
}

const DragDropContext = React.createContext<DragDropContextValue | null>(null);
export { DragDropContext };

const useDragDrop = (): DragDropContextValue => {
  const ctx = React.useContext(DragDropContext);
  if (!ctx) return { draggedTaskId: null, dragOverTaskId: null, dragPosition: null, setDraggedTaskId: () => {}, setDragOverTaskId: () => {}, setDragPosition: () => {} };
  return ctx;
};

// ============================================================
// GENERIC TYPES
// ============================================================

interface GenericStatus { id?: string | number | null; status?: string | null; color?: string | null; type?: string | null; orderindex?: number | null; [key: string]: any; }
interface GenericPriority { id?: string | number | null; priority?: string | null; color?: string | null; [key: string]: any; }
interface GenericAssignee { id: string | number; username?: string | null; email?: string | null; profilePicture?: string | null; initials?: string | null; color?: string | null; [key: string]: any; }
interface GenericTag { name: string; tag_bg?: string | null; tag_fg?: string | null; [key: string]: any; }

// ============================================================
// PROPS
// ============================================================

interface TaskRowProps {
  task: Task;
  columns: Column[];
  accountability?: any;
  availableStatuses?: GenericStatus[];
  availablePriorities?: GenericPriority[];
  availableAssignees?: GenericAssignee[];
  availableTags?: GenericTag[];
  isSelected?: boolean;
  onClick?: (task: Task) => void;
  onUpdate?: (taskId: string, field: string, value: any) => void;
  onDelete?: (taskId: string) => void;
  onDuplicate?: (taskId: string) => void;
  onTimerToggle?: (taskId: string) => void;
  onOpenInClickUp?: (taskId: string) => void;
  onSelect?: (taskId: string, selected: boolean) => void;
  onNameChange?: (taskId: string, name: string) => Promise<void>;
  onStatusChange?: (taskId: string, status: any) => Promise<void>;
  onPriorityChange?: (taskId: string, priority: number | null) => Promise<void>;
  onDueDateChange?: (taskId: string, timestamp: number | null) => Promise<void>;
  onAssigneesChange?: (taskId: string, action: { add?: number[]; rem?: number[] }) => Promise<void>;
  onTimerStart?: (taskId: string) => Promise<void>;
  onTimerStop?: (taskId: string) => Promise<void>;
  isTimerRunning?: boolean;
  timerElapsed?: number;
  availableUsers?: GenericAssignee[];
  isUpdating?: boolean;
  onComplete?: (taskId: string) => Promise<void>;
  onArchive?: (taskId: string) => Promise<void>;
}

// ============================================================
// HELPERS
// ============================================================

/** Contrast text for a hex background */
const contrastText = (hex?: string | null): string => {
  if (!hex || typeof hex !== 'string') return '#ffffff';
  const h = hex.replace('#', '');
  if (h.length !== 6) return '#ffffff';
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '#ffffff';
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1f2937' : '#ffffff';
};

/** Safe color with fallback */
const safeColor = (c: any, fallback: string): string => (typeof c === 'string' && c ? c : fallback);

/** Parse a due_date value (timestamp string, unix ms, or ISO) into ms */
const parseDateToMs = (value?: string | null): number | null => {
  if (!value) return null;
  const parsed = parseInt(value);
  if (!isNaN(parsed) && parsed > 1000000000) {
    return parsed > 9999999999 ? parsed : parsed * 1000;
  }
  const d = new Date(value).getTime();
  return isNaN(d) ? null : d;
};

// ============================================================
// INLINE EDIT: TEXT
// ============================================================

const InlineTextInput: React.FC<{
  value: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}> = ({ value, onSave, onCancel }) => {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <input
      ref={ref}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSave(text); if (e.key === 'Escape') onCancel(); }}
      onBlur={() => onSave(text)}
      placeholder="Task name..."
      className="w-full px-2 py-1 text-sm border border-purple-400 dark:border-purple-600 rounded outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 bg-white dark:bg-gray-800 dark:text-white"
    />
  );
};

// ============================================================
// INLINE EDIT: DATE
// ============================================================

const InlineDatePicker: React.FC<{
  value?: string;
  onSave: (v: string | null) => void;
  onCancel: () => void;
}> = ({ value, onSave, onCancel }) => {
  const toInputDate = (v?: string) => {
    if (!v) return '';
    const d = new Date(parseInt(v) || v);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };
  const [dateStr, setDateStr] = useState(toInputDate(value));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const save = () => { onSave(dateStr ? new Date(dateStr).getTime().toString() : null); };
  return (
    <input
      ref={ref}
      type="date"
      value={dateStr}
      onChange={(e) => setDateStr(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onCancel(); }}
      className="px-2 py-1 text-sm border border-purple-400 dark:border-purple-600 rounded outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 bg-white dark:bg-gray-800 dark:text-white"
    />
  );
};

// ============================================================
// INLINE SELECT DROPDOWN
// ============================================================

function InlineSelect<T>({
  options,
  onSelect,
  onCancel,
  renderOption,
  getKey,
}: {
  options: T[];
  onSelect: (o: T) => void;
  onCancel: () => void;
  renderOption: (o: T) => React.ReactNode;
  getKey: (o: T) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onCancel(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onCancel]);
  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 z-50 min-w-[160px] max-h-60 overflow-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
      {options.map((o) => (
        <button key={getKey(o)} onClick={() => onSelect(o)} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white transition-colors">
          {renderOption(o)}
        </button>
      ))}
      {options.length === 0 && <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No options</div>}
    </div>
  );
}

// ============================================================
// CELL: NAME
// FIX: Single click → opens task detail (no stopPropagation)
//      Double click → inline edit
//      Pencil icon on hover → inline edit
// ============================================================

const NameCell: React.FC<{
  task: Task;
  accountability?: any;
  width: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (v: string) => void;
  onCancel: () => void;
}> = ({ task, accountability, width, isEditing, onStartEdit, onSave, onCancel }) => {

  const checklistProgress = useMemo(() => {
    const cls = (task as any).checklists;
    if (!cls?.length) return null;
    let total = 0, done = 0;
    cls.forEach((c: any) => c.items?.forEach((i: any) => { total++; if (i.resolved) done++; }));
    return total > 0 ? { done, total } : null;
  }, [(task as any).checklists]);

  const circleColor = (i: number) => {
    if (!accountability) return 'bg-gray-200';
    const { status, strikeCount } = accountability;
    if (status === 'GREEN') return i === 0 ? 'bg-green-500' : 'bg-gray-200';
    if (status === 'ORANGE') return i < strikeCount ? 'bg-orange-500' : 'bg-gray-200';
    if (status === 'RED') return 'bg-red-500';
    return 'bg-gray-200';
  };

  if (isEditing) {
    return (
      <div className="flex-shrink-0 px-3 py-2" style={{ width }} onClick={(e) => e.stopPropagation()}>
        <InlineTextInput value={task.name} onSave={onSave} onCancel={onCancel} />
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 px-3 py-2 flex items-center gap-2 cursor-pointer group/name"
      style={{ width }}
      // Single click: does NOT stop propagation → bubbles to row → opens task detail modal
      // Double click: stops propagation + enters inline edit mode
      onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(); }}
    >
      <span className="text-sm text-gray-800 dark:text-gray-200 truncate font-medium group-hover/name:text-purple-700 dark:group-hover/name:text-purple-400 transition-colors">{task.name}</span>

      {/* Pencil icon: click to rename (visible on hover) */}
      <button
        onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
        className="opacity-0 group-hover/name:opacity-100 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex-shrink-0"
        title="Rename task"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-gray-500">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          <path d="m15 5 4 4"/>
        </svg>
      </button>

      {accountability && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn('w-1.5 h-1.5 rounded-full transition-colors', circleColor(i), accountability.isCompleted && 'opacity-50')} />
          ))}
        </div>
      )}
      {checklistProgress && (
        <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums">☰ {checklistProgress.done}/{checklistProgress.total}</span>
      )}
    </div>
  );
};

// ============================================================
// CELL: STATUS — COLORED PILL (ClickUp style)
// ============================================================

const StatusCell: React.FC<{
  status: any;
  availableStatuses?: GenericStatus[];
  width: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onSelect: (s: GenericStatus) => void;
  onCancel: () => void;
}> = ({ status, availableStatuses = [], width, isEditing, onStartEdit, onSelect, onCancel }) => {
  const text = status?.status || 'No status';
  const color = safeColor(status?.color, '#87909e');

  return (
    <div className="flex-shrink-0 px-3 py-2 relative" style={{ width }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onStartEdit}
        className="px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wide truncate max-w-full transition-opacity hover:opacity-80"
        style={{ backgroundColor: color, color: contrastText(color) }}
        title={text}
      >
        {text}
      </button>

      {isEditing && (
        <InlineSelect
          options={availableStatuses}
          onSelect={onSelect}
          onCancel={onCancel}
          getKey={(s) => String(s.id ?? s.status ?? Math.random())}
          renderOption={(s) => {
            const c = safeColor(s.color, '#87909e');
            return (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: c }} />
                <span className="capitalize">{s.status ?? 'Unknown'}</span>
              </div>
            );
          }}
        />
      )}
    </div>
  );
};

// ============================================================
// CELL: PRIORITY — Muted flag for null, clickable "Set" placeholder
// ============================================================

const PriorityCell: React.FC<{
  priority?: any;
  availablePriorities?: GenericPriority[];
  width: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onSelect: (p: GenericPriority | null) => void;
  onCancel: () => void;
}> = ({ priority, availablePriorities = [], width, isEditing, onStartEdit, onSelect, onCancel }) => {
  const hasPriority = priority && priority.priority;

  const pillClass = (() => {
    if (!hasPriority) return 'bg-transparent text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800';
    const name = (priority.priority ?? '').toLowerCase();
    if (name === 'urgent') return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    if (name === 'high') return 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
    if (name === 'normal') return 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    return 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400';
  })();

  return (
    <div className="flex-shrink-0 px-3 py-2 relative" style={{ width }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onStartEdit}
        className={cn('flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors', pillClass)}
      >
        <Flag className="w-3 h-3" style={{ color: safeColor(priority?.color, '#d1d5db') }} />
        {hasPriority ? <span className="capitalize">{priority.priority}</span> : <span className="text-[11px]">Set</span>}
      </button>

      {isEditing && (
        <InlineSelect
          options={availablePriorities}
          onSelect={onSelect}
          onCancel={onCancel}
          getKey={(p) => String(p.id ?? p.priority ?? Math.random())}
          renderOption={(p) => (
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4" style={{ color: safeColor(p.color, '#6b7280') }} />
              <span className="capitalize">{p.priority ?? 'No priority'}</span>
            </div>
          )}
        />
      )}
    </div>
  );
};

// ============================================================
// CELL: DUE DATE — Urgency colors, "Set date" placeholder
// ============================================================

const DueDateCell: React.FC<{
  value?: string | null;
  width: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (v: string | null) => void;
  onCancel: () => void;
}> = ({ value, width, isEditing, onStartEdit, onSave, onCancel }) => {
  const urgency = useMemo(() => {
    if (!value) return null;
    const ts = parseDateToMs(value);
    if (!ts) return null;

    const d = new Date(ts);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (diffDays < 0) return { label: formatted, text: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500', level: 'overdue' as const };
    if (diffDays === 0) return { label: 'Today', text: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500', level: 'today' as const };
    if (diffDays === 1) return { label: 'Tomorrow', text: 'text-orange-500', bg: 'bg-transparent', dot: '', level: 'soon' as const };
    if (diffDays <= 7) return { label: formatted, text: 'text-blue-600', bg: 'bg-transparent', dot: '', level: 'week' as const };
    return { label: formatted, text: 'text-gray-600', bg: 'bg-transparent', dot: '', level: 'future' as const };
  }, [value]);

  if (isEditing) {
    return (
      <div className="flex-shrink-0 px-3 py-2 relative" style={{ width }} onClick={(e) => e.stopPropagation()}>
        <InlineDatePicker value={value ?? undefined} onSave={onSave} onCancel={onCancel} />
      </div>
    );
  }

  if (!urgency) {
    return (
      <div className="flex-shrink-0 px-3 py-2 cursor-pointer group/date" style={{ width }} onClick={(e) => { e.stopPropagation(); onStartEdit(); }}>
        <span className="text-[11px] text-gray-300 dark:text-gray-600 group-hover/date:text-gray-400 dark:group-hover/date:text-gray-500 transition-colors">Set date</span>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 px-3 py-2 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50" style={{ width }} onClick={(e) => { e.stopPropagation(); onStartEdit(); }}>
      <span className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium px-1.5 py-0.5 rounded',
        urgency.text,
        urgency.bg
      )}>
        {urgency.dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', urgency.dot)} />}
        {urgency.label}
      </span>
    </div>
  );
};

// ============================================================
// CELL: ASSIGNEE — "Assign" placeholder
// ============================================================

const AssigneeCell: React.FC<{
  assignees?: any[];
  availableAssignees?: GenericAssignee[];
  width: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onSelect: (a: GenericAssignee) => void;
  onCancel: () => void;
}> = ({ assignees, availableAssignees = [], width, isEditing, onStartEdit, onSelect, onCancel }) => {
  const list = assignees ?? [];
  const initials = (a: any) => a.initials || (a.username ?? a.email ?? '').slice(0, 2).toUpperCase() || '?';
  const name = (a: any) => a.username ?? a.email ?? 'Unknown';
  const bg = (a: any) => safeColor(a?.color, '#6366f1');

  return (
    <div className="flex-shrink-0 px-3 py-2 relative" style={{ width }} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1 cursor-pointer rounded p-0.5 -m-0.5 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={onStartEdit}>
        {list.length > 0 ? (
          list.slice(0, 3).map((a, i) => (
            <div key={a.id} className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold ring-2 ring-white dark:ring-gray-900" style={{ backgroundColor: bg(a), marginLeft: i > 0 ? -6 : 0, zIndex: 3 - i }} title={name(a)}>
              {a.profilePicture ? <img src={a.profilePicture} alt="" className="w-full h-full rounded-full object-cover" /> : initials(a)}
            </div>
          ))
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
            <User className="w-3 h-3" />
          </div>
        )}
        {list.length > 3 && <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">+{list.length - 3}</span>}
      </div>

      {isEditing && (
        <InlineSelect
          options={availableAssignees}
          onSelect={onSelect}
          onCancel={onCancel}
          getKey={(a) => String(a.id)}
          renderOption={(a) => (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]" style={{ backgroundColor: bg(a) }}>{initials(a)}</div>
              <span>{name(a)}</span>
            </div>
          )}
        />
      )}
    </div>
  );
};

// ============================================================
// CELL: TAGS — "+" placeholder when empty
// ============================================================

const TagsCell: React.FC<{
  tags?: any[];
  availableTags?: GenericTag[];
  width: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onAddTag: (t: GenericTag) => void;
  onRemoveTag: (name: string) => void;
  onCancel: () => void;
}> = ({ tags, availableTags = [], width, isEditing, onStartEdit, onAddTag, onRemoveTag, onCancel }) => {
  const list = tags ?? [];
  const tagBg = (t: any) => safeColor(t?.tag_bg, '#e5e7eb');

  return (
    <div className="flex-shrink-0 px-3 py-2 relative" style={{ width }} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1 flex-wrap cursor-pointer min-h-[24px]" onClick={onStartEdit}>
        {list.length > 0 ? (
          list.map((tag) => (
            <span key={tag.name} className="px-1.5 py-0.5 rounded text-[10px] font-semibold truncate max-w-[90px]" style={{ backgroundColor: tagBg(tag), color: contrastText(tagBg(tag)) }} title={tag.name}>
              {tag.name}
            </span>
          ))
        ) : (
          <span className="w-5 h-5 rounded border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-400 dark:hover:text-gray-500 transition-colors text-xs">+</span>
        )}
      </div>

      {isEditing && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] max-h-60 overflow-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
          {list.length > 0 && (
            <>
              <div className="px-3 py-1 text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Current</div>
              {list.map((tag) => (
                <button key={tag.name} onClick={() => onRemoveTag(tag.name)} className="w-full px-3 py-1.5 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center justify-between group">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: tagBg(tag), color: contrastText(tagBg(tag)) }}>{tag.name}</span>
                  <X className="w-3.5 h-3.5 text-red-400 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
              <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
            </>
          )}
          <div className="px-3 py-1 text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Add</div>
          {availableTags.filter((t) => !list.some((ct: any) => ct.name === t.name)).map((tag) => (
            <button key={tag.name} onClick={() => onAddTag(tag)} className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: tagBg(tag), color: contrastText(tagBg(tag)) }}>{tag.name}</span>
            </button>
          ))}
          <button onClick={onCancel} className="w-full px-3 py-1.5 text-left text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700">Done</button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// CELL: ETA
// FIX: Correct casing (currentEta not currentETA)
//      Fallback to due_date when no accountability data
//      Format: "5d, 23h, 50m left" / "2d, 5h overdue"
//      Color: green/orange/red based on time remaining
// ============================================================

const ETACell: React.FC<{
  accountability?: any;
  dueDate?: string | null;
  width: number;
}> = ({ accountability, dueDate, width }) => {

  const etaInfo = useMemo(() => {
    let targetTime: number | null = null;
    let isCompleted = false;

    // Check if completed
    if (accountability?.isCompleted || accountability?.completedAt) {
      isCompleted = true;
    }

    // Try accountability ETA fields (fix: check multiple casings)
    if (accountability) {
      const etaValue =
        accountability.currentEta ??
        accountability.currentETA ??
        accountability.etaDeadline ??
        accountability.eta_deadline ??
        accountability.graceDeadline ??
        null;

      if (etaValue) {
        if (typeof etaValue === 'number') {
          targetTime = etaValue > 9999999999 ? etaValue : etaValue * 1000;
        } else {
          targetTime = new Date(etaValue).getTime();
        }
        if (isNaN(targetTime!)) targetTime = null;
      }
    }

    // Fallback: use due_date if no ETA from accountability
    if (!targetTime && dueDate) {
      targetTime = parseDateToMs(dueDate);
    }

    // Nothing to show
    if (!targetTime) return null;

    // If completed, show a completed state
    if (isCompleted) {
      return { label: 'Done', color: 'green' as const, isCompleted: true };
    }

    const diff = targetTime - Date.now();
    const isOverdue = diff < 0;
    const abs = Math.abs(diff);

    const days = Math.floor(abs / 86400000);
    const hours = Math.floor((abs % 86400000) / 3600000);
    const minutes = Math.floor((abs % 3600000) / 60000);

    // Build compact time string: "5d, 23h, 50m"
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    // Show minutes only when less than 7 days remaining (avoids clutter)
    if (minutes > 0 && days < 7) parts.push(`${minutes}m`);

    if (parts.length === 0) parts.push('< 1m');

    const timeStr = parts.join(', ');
    const label = isOverdue ? `${timeStr} overdue` : `${timeStr} left`;

    // Color logic based on time remaining
    let color: 'green' | 'orange' | 'red' = 'green';
    if (isOverdue) {
      color = 'red';
    } else if (diff < 24 * 3600000) {
      // Less than 24 hours
      color = 'orange';
    } else if (diff < 3 * 24 * 3600000) {
      // Less than 3 days
      color = 'orange';
    }

    // Override with accountability status if available
    if (accountability?.status) {
      const s = (typeof accountability.status === 'string' ? accountability.status : '').toUpperCase();
      if (s === 'RED' || s === 'OVERDUE' || s === 'FAILED') color = 'red';
      else if (s === 'ORANGE' || s === 'GRACE_PERIOD') color = 'orange';
      else if (s === 'GREEN' || s === 'ACTIVE') color = 'green';
    }

    return { label, color, isCompleted: false };
  }, [accountability, dueDate]);

  // No ETA and no due date → show dash
  if (!etaInfo) {
    return (
      <div className="flex-shrink-0 px-3 py-2" style={{ width }} onClick={(e) => e.stopPropagation()}>
        <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>
      </div>
    );
  }

  const colorMap = {
    green: { dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
    orange: { dot: 'bg-orange-500', text: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30' },
    red: { dot: 'bg-red-500', text: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
  };

  const c = colorMap[etaInfo.color];

  return (
    <div
      className={cn('flex-shrink-0 px-3 py-2 flex items-center gap-1.5', etaInfo.isCompleted && 'opacity-50')}
      style={{ width }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={cn('w-2 h-2 rounded-sm flex-shrink-0', c.dot)} />
      <span className={cn('text-xs font-medium whitespace-nowrap', c.text)}>{etaInfo.label}</span>
    </div>
  );
};

// ============================================================
// CELL: TIMER
// FIX: Clear format — "46h 46m" / "39m 50s" instead of "46:46:03"
//      Hide 0 when idle, show play on hover
// ============================================================

const TimerCell: React.FC<{
  timer?: { isRunning?: boolean; elapsed?: number } | null;
  timeSpent?: number | null;
  width: number;
  onToggle?: () => void;
}> = ({ timer, timeSpent = 0, width, onToggle }) => {
  const fmt = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    if (s > 0) return `${s}s`;
    return '0s';
  };

  const total = (timeSpent ?? 0) + (timer?.elapsed ?? 0);
  const running = timer?.isRunning ?? false;
  const hasTime = total > 0 || running;

  return (
    <div className="flex-shrink-0 px-3 py-2 flex items-center gap-1.5 group/timer" style={{ width }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center transition-all',
          running ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' : 'bg-transparent text-gray-400 dark:text-gray-500 opacity-0 group-hover/timer:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800'
        )}
      >
        {running ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 ml-px" />}
      </button>
      {hasTime && (
        <span className={cn('text-xs tabular-nums', running ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-gray-500 dark:text-gray-400')}>
          {fmt(total)}
        </span>
      )}
    </div>
  );
};

// ============================================================
// MAIN TASK ROW
// FIX: Stronger hover state, single click opens task, edit via double-click
// ============================================================

export const TaskRow: React.FC<TaskRowProps> = React.memo(({
  task,
  columns,
  accountability,
  availableStatuses = [],
  availablePriorities = [],
  availableAssignees = [],
  availableTags = [],
  isSelected,
  onClick,
  onUpdate,
  onDelete,
  onDuplicate,
  onTimerToggle,
  onOpenInClickUp,
  onSelect,
  onNameChange,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  onAssigneesChange,
  onTimerStart,
  onTimerStop,
  isTimerRunning,
  timerElapsed = 0,
  availableUsers = [],
  isUpdating,
  onComplete,
  onArchive,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const assigneeOptions = availableAssignees.length > 0 ? availableAssignees : availableUsers;
  const { draggedTaskId, dragOverTaskId, dragPosition, setDraggedTaskId, setDragOverTaskId, setDragPosition } = useDragDrop();
  const isDragging = draggedTaskId === task.id;
  const isDragOver = dragOverTaskId === task.id;
  const visibleCols = useMemo(() => columns.filter((c) => c.visible), [columns]);

  // Priority left-border color
  const priorityBorderColor = useMemo(() => {
    const p = task.priority?.priority?.toLowerCase();
    if (p === 'urgent') return '#F42A2A';
    if (p === 'high') return '#FFCC00';
    if (p === 'normal') return '#6B7AFF';
    if (p === 'low') return '#808080';
    return 'transparent';
  }, [task.priority]);

  // Handle updates with specific handlers then fallback
  const handleUpdate = useCallback((field: string, value: any) => {
    if (field === 'name' && onNameChange) { onNameChange(task.id, value); }
    else if (field === 'status' && onStatusChange) {
      const s = availableStatuses.find((x) => x.status === value || x.id === value);
      if (s) onStatusChange(task.id, s);
    }
    else if (field === 'priority' && onPriorityChange) {
      const pid = typeof value === 'object' ? value?.id : value;
      onPriorityChange(task.id, pid ? Number(pid) : null);
    }
    else if (field === 'due_date' && onDueDateChange) {
      onDueDateChange(task.id, value ? (typeof value === 'string' ? parseInt(value) : value) : null);
    }
    else if ((field === 'addAssignee') && onAssigneesChange) {
      onAssigneesChange(task.id, { add: [Number(value.id)] });
    }
    else if (field === 'removeAssignee' && onAssigneesChange) {
      onAssigneesChange(task.id, { rem: [Number(value)] });
    }
    else { onUpdate?.(task.id, field, value); }
    setEditingField(null);
  }, [task.id, onUpdate, onNameChange, onStatusChange, onPriorityChange, onDueDateChange, onAssigneesChange, availableStatuses]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    setDraggedTaskId(task.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTaskId === task.id) return;
    setDragOverTaskId(task.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragPosition(e.clientY < rect.top + rect.height / 2 ? 'above' : 'below');
  };

  // Close actions on outside click
  useEffect(() => {
    if (!showActions) return;
    const handler = (e: MouseEvent) => { if (rowRef.current && !rowRef.current.contains(e.target as Node)) setShowActions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showActions]);

  return (
    <div
      ref={rowRef}
      className={cn(
        'flex items-center border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all group',
        'hover:bg-purple-50/40 dark:hover:bg-purple-900/20',
        isDragging && 'opacity-40 bg-purple-50 dark:bg-purple-900/30',
        isDragOver && dragPosition === 'above' && 'border-t-2 border-t-purple-500',
        isDragOver && dragPosition === 'below' && 'border-b-2 border-b-purple-500',
        isSelected && 'bg-purple-50/60 dark:bg-purple-900/40',
        isUpdating && 'opacity-60 pointer-events-none'
      )}
      style={{ borderLeft: `3px solid ${priorityBorderColor}` }}
      onClick={() => { if (!editingField) onClick?.(task); }}
      onDragOver={handleDragOver}
      onDragLeave={() => { if (dragOverTaskId === task.id) { setDragOverTaskId(null); setDragPosition(null); } }}
      onDrop={(e) => e.preventDefault()}
    >
      {/* Checkbox + Drag handle */}
      <div className="w-[60px] flex-shrink-0 flex items-center gap-1 pl-3 pr-1">
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onSelect?.(task.id, !isSelected); }}
          className={cn(
            'w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all flex-shrink-0',
            isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300 dark:border-gray-600 opacity-0 group-hover:opacity-100 hover:border-purple-400 dark:hover:border-purple-500'
          )}
        >
          {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </button>
        {/* Drag */}
        <div draggable onDragStart={handleDragStart} className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <GripVertical className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      {/* Cells */}
      {visibleCols.map((col) => {
        switch (col.id) {
          case 'name':
            return <NameCell key={col.id} task={task} accountability={accountability} width={col.width} isEditing={editingField === 'name'} onStartEdit={() => setEditingField('name')} onSave={(v) => handleUpdate('name', v)} onCancel={() => setEditingField(null)} />;
          case 'status':
            return <StatusCell key={col.id} status={task.status} availableStatuses={availableStatuses} width={col.width} isEditing={editingField === 'status'} onStartEdit={() => setEditingField('status')} onSelect={(s) => handleUpdate('status', s.status)} onCancel={() => setEditingField(null)} />;
          case 'assignee':
            return <AssigneeCell key={col.id} assignees={task.assignees} availableAssignees={assigneeOptions} width={col.width} isEditing={editingField === 'assignee'} onStartEdit={() => setEditingField('assignee')} onSelect={(a) => handleUpdate('addAssignee', a)} onCancel={() => setEditingField(null)} />;
          case 'dueDate':
            return <DueDateCell key={col.id} value={task.due_date} width={col.width} isEditing={editingField === 'dueDate'} onStartEdit={() => setEditingField('dueDate')} onSave={(v) => handleUpdate('due_date', v)} onCancel={() => setEditingField(null)} />;
          case 'priority':
            return <PriorityCell key={col.id} priority={task.priority} availablePriorities={availablePriorities} width={col.width} isEditing={editingField === 'priority'} onStartEdit={() => setEditingField('priority')} onSelect={(p) => handleUpdate('priority', p)} onCancel={() => setEditingField(null)} />;
          case 'tags':
            return <TagsCell key={col.id} tags={task.tags} availableTags={availableTags} width={col.width} isEditing={editingField === 'tags'} onStartEdit={() => setEditingField('tags')} onAddTag={(t) => handleUpdate('addTag', t.name)} onRemoveTag={(n) => handleUpdate('removeTag', n)} onCancel={() => setEditingField(null)} />;
          case 'eta':
            return <ETACell key={col.id} accountability={accountability} dueDate={task.due_date} width={col.width} />;
          case 'timer':
            return <TimerCell key={col.id} timer={isTimerRunning ? { isRunning: true, elapsed: timerElapsed } : (task as any).timer} timeSpent={(task as any).time_spent} width={col.width} onToggle={() => { isTimerRunning ? onTimerStop?.(task.id) : onTimerStart?.(task.id); onTimerToggle?.(task.id); }} />;
          default:
            return <div key={col.id} className="flex-shrink-0" style={{ width: col.width }} />;
        }
      })}

      {/* Row Actions */}
      <div className="flex items-center px-2 min-w-[36px] flex-shrink-0 relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showActions && (
          <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
            {onComplete && (
              <button onClick={(e) => { e.stopPropagation(); onComplete(task.id); setShowActions(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" /> Mark Complete
              </button>
            )}
            {onOpenInClickUp && (
              <button onClick={(e) => { e.stopPropagation(); onOpenInClickUp(task.id); setShowActions(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white flex items-center gap-2">
                <ExternalLink className="w-4 h-4" /> Open in ClickUp
              </button>
            )}
            {onDuplicate && (
              <button onClick={(e) => { e.stopPropagation(); onDuplicate(task.id); setShowActions(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white flex items-center gap-2">
                <Copy className="w-4 h-4" /> Duplicate
              </button>
            )}
            {onArchive && (
              <button onClick={(e) => { e.stopPropagation(); onArchive(task.id); setShowActions(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white flex items-center gap-2">
                <Archive className="w-4 h-4" /> Archive
              </button>
            )}
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); setShowActions(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

TaskRow.displayName = 'TaskRow';

export default TaskRow;