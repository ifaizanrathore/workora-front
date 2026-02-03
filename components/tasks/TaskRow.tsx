'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  GripVertical,
  Play,
  Pause,
  MoreHorizontal,
  Calendar,
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
// DRAG & DROP CONTEXT (inline - no external dependency)
// ============================================================
// If you have TaskListWrapper.tsx with DragDropProvider, wrap your list in it.
// TaskRow works fine without it (drag-drop simply disabled).

interface DragDropContextValue {
  draggedTaskId: string | null;
  dragOverTaskId: string | null;
  dragPosition: 'above' | 'below' | null;
  setDraggedTaskId: (id: string | null) => void;
  setDragOverTaskId: (id: string | null) => void;
  setDragPosition: (pos: 'above' | 'below' | null) => void;
}

const DragDropContext = React.createContext<DragDropContextValue | null>(null);

/** Re-export so TaskListWrapper can use the same context */
export { DragDropContext };

const useDragDrop = (): DragDropContextValue => {
  const ctx = React.useContext(DragDropContext);
  // Return safe defaults when no provider wraps the component
  if (!ctx) {
    return {
      draggedTaskId: null,
      dragOverTaskId: null,
      dragPosition: null,
      setDraggedTaskId: () => {},
      setDragOverTaskId: () => {},
      setDragPosition: () => {},
    };
  }
  return ctx;
};

// ============================================================
// TYPES - Use generics to accept any compatible types
// ============================================================

// Generic status type that accepts various shapes
interface GenericStatus {
  id?: string | number | null;
  status?: string | null;
  color?: string | null;
  type?: string | null;
  orderindex?: number | null;
  [key: string]: any;
}

// Generic priority type
interface GenericPriority {
  id?: string | number | null;
  priority?: string | null;
  color?: string | null;
  [key: string]: any;
}

// Generic assignee type
interface GenericAssignee {
  id: string | number;
  username?: string | null;
  email?: string | null;
  profilePicture?: string | null;
  initials?: string | null;
  color?: string | null;
  [key: string]: any;
}

// Generic tag type
interface GenericTag {
  name: string;
  tag_bg?: string | null;
  tag_fg?: string | null;
  [key: string]: any;
}

// Props interface - accepts the actual Task type from @/types
interface TaskRowProps {
  task: Task;
  columns: Column[];
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
  // Additional props from TaskList.tsx
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
// INLINE EDIT COMPONENTS
// ============================================================

// Text Input (for name editing)
interface InlineTextInputProps {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  placeholder?: string;
  className?: string;
}

const InlineTextInput: React.FC<InlineTextInputProps> = ({
  value,
  onSave,
  onCancel,
  placeholder = 'Enter text...',
  className,
}) => {
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(text);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onSave(text)}
      placeholder={placeholder}
      className={cn(
        'w-full px-2 py-1 text-sm border border-purple-400 rounded outline-none focus:ring-2 focus:ring-purple-200 bg-white',
        className
      )}
    />
  );
};

// Date Picker
interface InlineDatePickerProps {
  value?: string;
  onSave: (value: string | null) => void;
  onCancel: () => void;
}

const InlineDatePicker: React.FC<InlineDatePickerProps> = ({ value, onSave, onCancel }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Convert timestamp or date string to YYYY-MM-DD
  const formatForInput = (val?: string) => {
    if (!val) return '';
    const date = new Date(parseInt(val) || val);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const [dateStr, setDateStr] = useState(formatForInput(value));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = () => {
    if (dateStr) {
      // Convert to timestamp for ClickUp
      onSave(new Date(dateStr).getTime().toString());
    } else {
      onSave(null);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="date"
        value={dateStr}
        onChange={(e) => setDateStr(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') onCancel();
        }}
        className="px-2 py-1 text-sm border border-purple-400 rounded outline-none focus:ring-2 focus:ring-purple-200 bg-white"
      />
    </div>
  );
};

// Dropdown Select
interface InlineSelectProps<T> {
  options: T[];
  value?: T;
  onSelect: (option: T) => void;
  onCancel: () => void;
  renderOption: (option: T) => React.ReactNode;
  getKey: (option: T) => string;
}

function InlineSelect<T>({
  options,
  value,
  onSelect,
  onCancel,
  renderOption,
  getKey,
}: InlineSelectProps<T>) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 z-50 min-w-[150px] max-h-60 overflow-auto bg-white rounded-lg shadow-lg border border-gray-200 py-1"
    >
      {options.map((option) => (
        <button
          key={getKey(option)}
          onClick={() => onSelect(option)}
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
        >
          {renderOption(option)}
        </button>
      ))}
      {options.length === 0 && (
        <div className="px-3 py-2 text-sm text-gray-400">No options</div>
      )}
    </div>
  );
}

// ============================================================
// CELL COMPONENTS
// ============================================================

// Name Cell with inline editing
interface NameCellProps {
  task: Task;
  width: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (value: string) => void;
  onCancel: () => void;
}

const NameCell: React.FC<NameCellProps> = ({
  task,
  width,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
}) => {
  // Safely access accountability - may not exist on Task type
  const accountability = (task as any).accountability;
  
  // Get checklist progress
  const checklistProgress = useMemo(() => {
    const checklists = (task as any).checklists;
    if (!checklists?.length) return null;
    let total = 0, completed = 0;
    checklists.forEach((cl: any) => {
      cl.items?.forEach((item: any) => {
        total++;
        if (item.resolved) completed++;
      });
    });
    return total > 0 ? { completed, total } : null;
  }, [(task as any).checklists]);

  // Strike indicator circles
  const getCircleColor = (index: number) => {
    if (!accountability) return 'bg-gray-200';
    const { status, strikeCount } = accountability;
    
    if (status === 'GREEN') {
      return index === 0 ? 'bg-green-500' : 'bg-gray-200';
    } else if (status === 'ORANGE') {
      return index < strikeCount ? 'bg-orange-500' : 'bg-gray-200';
    } else if (status === 'RED') {
      return 'bg-red-500';
    }
    return 'bg-gray-200';
  };

  const getTooltip = () => {
    if (!accountability) return '';
    const { status, strikeCount, isCompleted } = accountability;
    const prefix = isCompleted ? '✓ Completed' : '';
    if (status === 'GREEN') return `${prefix} (0 strikes)`.trim();
    if (status === 'ORANGE') return `${prefix} (${strikeCount} strike${strikeCount > 1 ? 's' : ''})`.trim();
    if (status === 'RED') return `${prefix} (${strikeCount}+ strikes - At Risk!)`.trim();
    return '';
  };

  if (isEditing) {
    return (
      <div className="flex-shrink-0 px-3 py-2" style={{ width }} onClick={(e) => e.stopPropagation()}>
        <InlineTextInput
          value={task.name}
          onSave={onSave}
          onCancel={onCancel}
          placeholder="Task name..."
        />
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50 group/name"
      style={{ width }}
      onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
      title="Click to edit"
    >
      <span className="text-sm text-gray-800 truncate font-medium">{task.name}</span>
      
      {/* Strike indicator circles */}
      {accountability && (
        <div className="flex items-center gap-0.5 flex-shrink-0" title={getTooltip()}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                getCircleColor(i),
                accountability.isCompleted && 'opacity-60'
              )}
            />
          ))}
        </div>
      )}

      {/* Checklist progress */}
      {checklistProgress && (
        <span className="text-xs text-gray-400 flex-shrink-0">
          ☰ {checklistProgress.completed}/{checklistProgress.total}
        </span>
      )}
    </div>
  );
};

// Due Date Cell
interface DueDateCellProps {
  value?: string | null;
  width: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (value: string | null) => void;
  onCancel: () => void;
}

const DueDateCell: React.FC<DueDateCellProps> = ({
  value,
  width,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
}) => {
  const formatDate = (timestamp?: string | null) => {
    if (!timestamp) return 'Set date';
    const date = new Date(parseInt(timestamp) || timestamp);
    if (isNaN(date.getTime())) return 'Set date';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (isEditing) {
    return (
      <div className="flex-shrink-0 px-3 py-2 relative" style={{ width }} onClick={(e) => e.stopPropagation()}>
        <InlineDatePicker value={value ?? undefined} onSave={onSave} onCancel={onCancel} />
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 px-3 py-2 cursor-pointer hover:bg-gray-50"
      style={{ width }}
      onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
      title="Click to edit"
    >
      <span className={cn('text-sm', value ? 'text-gray-700' : 'text-gray-400')}>
        {formatDate(value)}
      </span>
    </div>
  );
};

// Assignee Cell
interface AssigneeCellProps {
  assignees?: GenericAssignee[] | any[] | null;
  availableAssignees?: GenericAssignee[];
  width: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onSelect: (assignee: GenericAssignee) => void;
  onCancel: () => void;
}

const AssigneeCell: React.FC<AssigneeCellProps> = ({
  assignees,
  availableAssignees = [],
  width,
  isEditing,
  onStartEdit,
  onSelect,
  onCancel,
}) => {
  const getInitials = (assignee: any) => {
    if (assignee.initials) return assignee.initials;
    const name = assignee.username ?? assignee.email ?? '';
    return name.slice(0, 2).toUpperCase() || '?';
  };

  // Helper to get safe color - always returns a valid color string
  const getAssigneeColor = (assignee: any): string => {
    const color = assignee?.color;
    return typeof color === 'string' && color ? color : '#6366f1';
  };

  const getDisplayName = (assignee: any) => {
    return assignee.username ?? assignee.email ?? 'Unknown';
  };

  const assigneeList = assignees ?? [];

  return (
    <div className="flex-shrink-0 px-3 py-2 relative" style={{ width }} onClick={(e) => e.stopPropagation()}>
      <div
        className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded p-1 -m-1"
        onClick={onStartEdit}
        title="Click to change assignee"
      >
        {assigneeList.length > 0 ? (
          assigneeList.slice(0, 3).map((assignee, idx) => {
            const bgColor = getAssigneeColor(assignee);
            return (
              <div
                key={assignee.id}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                style={{ 
                  backgroundColor: bgColor,
                  marginLeft: idx > 0 ? '-8px' : 0,
                  zIndex: 3 - idx,
                }}
                title={getDisplayName(assignee)}
              >
                {assignee.profilePicture ? (
                  <img src={assignee.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(assignee)
                )}
              </div>
            );
          })
        ) : (
          <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>

      {isEditing && (
        <InlineSelect
          options={availableAssignees}
          onSelect={onSelect}
          onCancel={onCancel}
          getKey={(a) => String(a.id)}
          renderOption={(assignee) => {
            const bgColor = getAssigneeColor(assignee);
            return (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: bgColor }}
                >
                  {getInitials(assignee)}
                </div>
                <span>{getDisplayName(assignee)}</span>
              </div>
            );
          }}
        />
      )}
    </div>
  );
};

// Tags Cell
interface TagsCellProps {
  tags?: GenericTag[] | any[] | null;
  availableTags?: GenericTag[];
  width: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onAddTag: (tag: GenericTag) => void;
  onRemoveTag: (tagName: string) => void;
  onCancel: () => void;
}

const TagsCell: React.FC<TagsCellProps> = ({
  tags,
  availableTags = [],
  width,
  isEditing,
  onStartEdit,
  onAddTag,
  onRemoveTag,
  onCancel,
}) => {
  // Calculate luminance for text color - always returns a valid hex color string
  const getTextColor = (bgColor: string): string => {
    if (!bgColor) return '#1f2937';
    const hex = String(bgColor).replace('#', '');
    if (hex.length !== 6) return '#1f2937';
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return '#1f2937';
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1f2937' : '#ffffff';
  };

  const tagList = (tags ?? []) as any[];

  // Helper to get safe color with fallback - explicitly typed as string
  const getTagBg = (tag: any): string => {
    const bg = tag?.tag_bg;
    return typeof bg === 'string' && bg ? bg : '#e5e7eb';
  };
  
  const getTagFg = (tag: any): string => {
    const fg = tag?.tag_fg;
    return typeof fg === 'string' && fg ? fg : getTextColor(getTagBg(tag));
  };

  return (
    <div className="flex-shrink-0 px-3 py-2 relative" style={{ width }} onClick={(e) => e.stopPropagation()}>
      <div
        className="flex items-center gap-1 flex-wrap cursor-pointer min-h-[28px]"
        onClick={onStartEdit}
        title="Click to manage tags"
      >
        {tagList.length > 0 ? (
          tagList.map((tag) => {
            const bgColor = getTagBg(tag);
            const fgColor = getTagFg(tag);
            return (
              <span
                key={tag.name}
                className="px-2 py-0.5 rounded text-xs font-medium truncate max-w-[100px]"
                style={{
                  backgroundColor: bgColor,
                  color: fgColor,
                }}
                title={tag.name}
              >
                #{tag.name}
              </span>
            );
          })
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </div>

      {isEditing && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] max-h-60 overflow-auto bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          {/* Current tags with remove option */}
          {tagList.length > 0 && (
            <>
              <div className="px-3 py-1 text-xs text-gray-400 uppercase">Current Tags</div>
              {tagList.map((tag) => {
                const bgColor = getTagBg(tag);
                const textColor = getTextColor(bgColor);
                return (
                  <button
                    key={tag.name}
                    onClick={() => onRemoveTag(tag.name)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center justify-between group"
                  >
                    <span
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ backgroundColor: bgColor, color: textColor }}
                    >
                      #{tag.name}
                    </span>
                    <X className="w-4 h-4 text-red-400 opacity-0 group-hover:opacity-100" />
                  </button>
                );
              })}
              <div className="border-t border-gray-100 my-1" />
            </>
          )}
          
          {/* Available tags to add */}
          <div className="px-3 py-1 text-xs text-gray-400 uppercase">Add Tag</div>
          {availableTags
            .filter((t) => !tagList.some((ct: any) => ct.name === t.name))
            .map((tag) => {
              const bgColor = getTagBg(tag);
              const textColor = getTextColor(bgColor);
              return (
                <button
                  key={tag.name}
                  onClick={() => onAddTag(tag)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <span
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ backgroundColor: bgColor, color: textColor }}
                  >
                    #{tag.name}
                  </span>
                </button>
              );
            })}
          
          <button
            onClick={onCancel}
            className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-t border-gray-100"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

// ETA Cell
interface ETACellProps {
  accountability?: any;
  width: number;
}

const ETACell: React.FC<ETACellProps> = ({ accountability, width }) => {
  if (!accountability?.currentETA) {
    return (
      <div className="flex-shrink-0 px-3 py-2 text-gray-400 text-sm" style={{ width }} onClick={(e) => e.stopPropagation()}>
        —
      </div>
    );
  }

  const { status, isCompleted, currentETA } = accountability;
  const etaDate = new Date(currentETA);
  const now = new Date();
  const diffMs = etaDate.getTime() - now.getTime();
  const isOverdue = diffMs < 0;
  const absDiff = Math.abs(diffMs);
  
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  let timeText = '';
  if (days > 0) {
    timeText = `${days}d ${isOverdue ? 'overdue' : 'left'}`;
  } else if (hours > 0) {
    timeText = `${hours}h ${isOverdue ? 'overdue' : 'left'}`;
  } else {
    timeText = isOverdue ? 'Overdue' : 'Due soon';
  }

  const colorMap: Record<string, string> = {
    GREEN: 'text-green-600',
    ORANGE: 'text-orange-500',
    RED: 'text-red-500',
  };

  const dotColorMap: Record<string, string> = {
    GREEN: 'bg-green-500',
    ORANGE: 'bg-orange-500',
    RED: 'bg-red-500',
  };

  return (
    <div
      className={cn('flex-shrink-0 px-3 py-2 flex items-center gap-2', isCompleted && 'opacity-60')}
      style={{ width }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={cn('w-2 h-2 rounded-full', dotColorMap[status] || 'bg-gray-300')} />
      <span className={cn('text-sm', colorMap[status] || 'text-gray-500')}>{timeText}</span>
    </div>
  );
};

// Timer Cell
interface TimerCellProps {
  timer?: { isRunning?: boolean; elapsed?: number } | null;
  timeSpent?: number | null;
  width: number;
  onToggle?: () => void;
}

const TimerCell: React.FC<TimerCellProps> = ({ timer, timeSpent = 0, width, onToggle }) => {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const totalTime = (timeSpent ?? 0) + (timer?.elapsed ?? 0);
  const isRunning = timer?.isRunning ?? false;

  return (
    <div className="flex-shrink-0 px-3 py-2 flex items-center gap-2" style={{ width }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.();
        }}
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center transition-colors',
          isRunning
            ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        )}
      >
        {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
      </button>
      <span className={cn('text-sm tabular-nums', isRunning ? 'text-purple-600 font-medium' : 'text-gray-600')}>
        {formatTime(totalTime)}
      </span>
    </div>
  );
};

// Priority Cell
interface PriorityCellProps {
  priority?: GenericPriority | any | null;
  availablePriorities?: GenericPriority[];
  width: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onSelect: (priority: GenericPriority | null) => void;
  onCancel: () => void;
}

const PriorityCell: React.FC<PriorityCellProps> = ({
  priority,
  availablePriorities = [],
  width,
  isEditing,
  onStartEdit,
  onSelect,
  onCancel,
}) => {
  const getPriorityColor = (p?: any) => {
    if (!p) return 'bg-gray-100 text-gray-400';
    const name = (p.priority ?? '').toLowerCase();
    if (name === 'urgent') return 'bg-red-100 text-red-600';
    if (name === 'high') return 'bg-orange-100 text-orange-600';
    if (name === 'normal') return 'bg-blue-100 text-blue-600';
    if (name === 'low') return 'bg-gray-100 text-gray-500';
    return 'bg-gray-100 text-gray-500';
  };

  // Helper to get safe color for flag icon - always returns a valid color string
  const getFlagColor = (p: any): string => {
    const color = p?.color;
    return typeof color === 'string' && color ? color : '#6b7280';
  };

  return (
    <div className="flex-shrink-0 px-3 py-2 relative" style={{ width }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onStartEdit}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors',
          getPriorityColor(priority),
          'hover:opacity-80'
        )}
      >
        <Flag className="w-3 h-3" />
        <span>{priority?.priority ?? '—'}</span>
      </button>

      {isEditing && (
        <InlineSelect
          options={[...availablePriorities]}
          onSelect={onSelect}
          onCancel={onCancel}
          getKey={(p) => String(p.id ?? p.priority ?? Math.random())}
          renderOption={(p) => {
            const flagColor = getFlagColor(p);
            return (
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4" style={{ color: flagColor }} />
                <span>{p.priority ?? 'Unknown'}</span>
              </div>
            );
          }}
        />
      )}
    </div>
  );
};

// Status Cell
interface StatusCellProps {
  status: GenericStatus | any;
  availableStatuses?: GenericStatus[];
  width: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onSelect: (status: GenericStatus) => void;
  onCancel: () => void;
}

const StatusCell: React.FC<StatusCellProps> = ({
  status,
  availableStatuses = [],
  width,
  isEditing,
  onStartEdit,
  onSelect,
  onCancel,
}) => {
  const statusText = status?.status ?? 'No status';
  
  // Helper to get safe color - always returns a valid color string
  const getStatusColor = (s: any): string => {
    const color = s?.color;
    return typeof color === 'string' && color ? color : '#87909e';
  };
  
  const statusColor = getStatusColor(status);

  return (
    <div className="flex-shrink-0 px-3 py-2 relative" style={{ width }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onStartEdit}
        className="flex items-center gap-2 text-sm hover:bg-gray-50 rounded px-2 py-1 -mx-2"
      >
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
        <span className="text-gray-700 capitalize truncate">{statusText}</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {isEditing && (
        <InlineSelect
          options={availableStatuses}
          onSelect={onSelect}
          onCancel={onCancel}
          getKey={(s) => String(s.id ?? s.status ?? Math.random())}
          renderOption={(s) => {
            const dotColor = getStatusColor(s);
            return (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
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
// MAIN TASK ROW COMPONENT
// ============================================================

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  columns,
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
  // New props from TaskList.tsx
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
  
  // Use availableUsers as fallback for availableAssignees
  const assigneeOptions = availableAssignees.length > 0 ? availableAssignees : availableUsers;
  
  // Drag and drop - returns safe defaults when no DragDropProvider wraps this component
  const { draggedTaskId, dragOverTaskId, dragPosition, setDraggedTaskId, setDragOverTaskId, setDragPosition } = useDragDrop();
  const isDragging = draggedTaskId === task.id;
  const isDragOver = dragOverTaskId === task.id;

  // Handle field updates - support both old onUpdate and new specific handlers
  const handleUpdate = useCallback((field: string, value: any) => {
    // Try specific handlers first
    if (field === 'name' && onNameChange) {
      onNameChange(task.id, value);
    } else if (field === 'status' && onStatusChange) {
      // Find the status object
      const status = availableStatuses.find(s => s.status === value || s.id === value);
      if (status) onStatusChange(task.id, status);
    } else if (field === 'priority' && onPriorityChange) {
      const priorityId = typeof value === 'object' ? value?.id : value;
      onPriorityChange(task.id, priorityId ? Number(priorityId) : null);
    } else if (field === 'due_date' && onDueDateChange) {
      const timestamp = value ? (typeof value === 'string' ? parseInt(value) : value) : null;
      onDueDateChange(task.id, timestamp);
    } else if ((field === 'assignees' || field === 'addAssignee') && onAssigneesChange) {
      if (Array.isArray(value)) {
        const addIds = value.map(a => Number(a.id));
        onAssigneesChange(task.id, { add: addIds });
      } else {
        onAssigneesChange(task.id, { add: [Number(value.id)] });
      }
    } else if (field === 'removeAssignee' && onAssigneesChange) {
      onAssigneesChange(task.id, { rem: [Number(value)] });
    } else {
      // Fallback to generic handler
      onUpdate?.(task.id, field, value);
    }
    setEditingField(null);
  }, [task.id, onUpdate, onNameChange, onStatusChange, onPriorityChange, onDueDateChange, onAssigneesChange, availableStatuses]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    setDraggedTaskId(task.id);
    
    // Create drag image
    if (rowRef.current) {
      const rect = rowRef.current.getBoundingClientRect();
      e.dataTransfer.setDragImage(rowRef.current, rect.width / 2, 20);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTaskId === task.id) return;
    
    setDragOverTaskId(task.id);
    
    // Determine if above or below
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDragPosition(e.clientY < midY ? 'above' : 'below');
  };

  const handleDragLeave = () => {
    if (dragOverTaskId === task.id) {
      setDragOverTaskId(null);
      setDragPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // The actual reorder is handled in the wrapper's dragend event
  };

  // Get visible columns
  const visibleColumns = useMemo(() => columns.filter((c) => c.visible), [columns]);

  // Get column width by id
  const getWidth = (id: string) => visibleColumns.find((c) => c.id === id)?.width || 150;

  return (
    <div
      ref={rowRef}
      className={cn(
        'flex items-center border-b border-gray-100 bg-white transition-all group',
        'hover:bg-gray-50/50',
        isDragging && 'opacity-50 bg-purple-50',
        isDragOver && dragPosition === 'above' && 'border-t-2 border-t-purple-500',
        isDragOver && dragPosition === 'below' && 'border-b-2 border-b-purple-500',
        isSelected && 'bg-purple-50/50',
        isUpdating && 'opacity-70 pointer-events-none'
      )}
      onClick={(e) => {
        // Don't trigger onClick when clicking on editable fields
        if (editingField) return;
        onClick?.(task);
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Handle */}
      <div
        draggable
        onDragStart={handleDragStart}
        className="w-6 flex-shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Cells - render based on visible columns */}
      {visibleColumns.map((col) => {
        switch (col.id) {
          case 'name':
            return (
              <NameCell
                key={col.id}
                task={task}
                width={col.width}
                isEditing={editingField === 'name'}
                onStartEdit={() => setEditingField('name')}
                onSave={(v) => handleUpdate('name', v)}
                onCancel={() => setEditingField(null)}
              />
            );
          
          case 'dueDate':
            return (
              <DueDateCell
                key={col.id}
                value={task.due_date}
                width={col.width}
                isEditing={editingField === 'dueDate'}
                onStartEdit={() => setEditingField('dueDate')}
                onSave={(v) => handleUpdate('due_date', v)}
                onCancel={() => setEditingField(null)}
              />
            );
          
          case 'assignee':
            return (
              <AssigneeCell
                key={col.id}
                assignees={task.assignees}
                availableAssignees={assigneeOptions}
                width={col.width}
                isEditing={editingField === 'assignee'}
                onStartEdit={() => setEditingField('assignee')}
                onSelect={(a) => handleUpdate('addAssignee', a)}
                onCancel={() => setEditingField(null)}
              />
            );
          
          case 'tags':
            return (
              <TagsCell
                key={col.id}
                tags={task.tags}
                availableTags={availableTags}
                width={col.width}
                isEditing={editingField === 'tags'}
                onStartEdit={() => setEditingField('tags')}
                onAddTag={(t) => handleUpdate('addTag', t.name)}
                onRemoveTag={(name) => handleUpdate('removeTag', name)}
                onCancel={() => setEditingField(null)}
              />
            );
          
          case 'eta':
            return <ETACell key={col.id} accountability={(task as any).accountability} width={col.width} />;
          
          case 'timer':
            return (
              <TimerCell
                key={col.id}
                timer={isTimerRunning ? { isRunning: true, elapsed: timerElapsed } : (task as any).timer}
                timeSpent={(task as any).time_spent}
                width={col.width}
                onToggle={() => {
                  if (isTimerRunning) {
                    onTimerStop?.(task.id);
                  } else {
                    onTimerStart?.(task.id);
                  }
                  onTimerToggle?.(task.id);
                }}
              />
            );
          
          case 'priority':
            return (
              <PriorityCell
                key={col.id}
                priority={task.priority}
                availablePriorities={availablePriorities}
                width={col.width}
                isEditing={editingField === 'priority'}
                onStartEdit={() => setEditingField('priority')}
                onSelect={(p) => handleUpdate('priority', p)}
                onCancel={() => setEditingField(null)}
              />
            );
          
          case 'status':
            return (
              <StatusCell
                key={col.id}
                status={task.status}
                availableStatuses={availableStatuses}
                width={col.width}
                isEditing={editingField === 'status'}
                onStartEdit={() => setEditingField('status')}
                onSelect={(s) => handleUpdate('status', s.status)}
                onCancel={() => setEditingField(null)}
              />
            );
          
          default:
            return <div key={col.id} className="flex-shrink-0" style={{ width: col.width }} />;
        }
      })}

      {/* Actions */}
      <div className="flex items-center gap-1 px-2 min-w-[100px] justify-end flex-shrink-0">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showActions && (
            <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
              {onComplete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete(task.id);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Mark Complete
                </button>
              )}
              {onOpenInClickUp && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenInClickUp(task.id);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in ClickUp
                </button>
              )}
              {onDuplicate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(task.id);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
              )}
              {onArchive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(task.id);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskRow;