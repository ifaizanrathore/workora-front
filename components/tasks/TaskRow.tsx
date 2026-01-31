'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal,
  Play,
  Square,
  MessageSquare,
  Paperclip,
  GripVertical,
  Clock,
  Loader2,
  Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types';
import { Column } from './TaskListHeader';
import {
  StatusDropdown,
  PriorityDropdown,
  DatePickerDropdown,
  AssigneeDropdown,
  StatusOption,
} from './CellDropdowns';

// ============================================================
// TYPES
// ============================================================

interface TaskRowProps {
  task: Task;
  columns: Column[];
  isSelected?: boolean;
  onSelect?: (taskId: string, selected: boolean) => void;
  onClick?: (task: Task) => void;
  onNameChange?: (taskId: string, name: string) => Promise<void>;
  onStatusChange?: (taskId: string, status: StatusOption) => void;
  onPriorityChange?: (taskId: string, priority: number | null) => void;
  onDueDateChange?: (taskId: string, dueDate: number | null) => void;
  onAssigneesChange?: (taskId: string, action: { add?: number[]; rem?: number[] }) => void;
  onTimerStart?: (taskId: string) => Promise<void>;
  onTimerStop?: (taskId: string) => Promise<void>;
  isTimerRunning?: boolean;
  timerElapsed?: number;
  availableStatuses?: StatusOption[];
  availableUsers?: Array<{ id: string | number; username?: string; email?: string; profilePicture?: string }>;
  isUpdating?: boolean;
  className?: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Format ETA countdown like ClickUp: "5d, 23h, 50m, 23s left"
const formatCountdown = (targetDate: string | number): { text: string; isOverdue: boolean } => {
  const now = new Date().getTime();
  const target = typeof targetDate === 'string' ? new Date(targetDate).getTime() : targetDate;
  const diff = target - now;

  if (diff < 0) {
    const absDiff = Math.abs(diff);
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return { text: `${days}d, ${hours}h overdue`, isOverdue: true };
    } else if (hours > 0) {
      return { text: `${hours}h, ${minutes}m overdue`, isOverdue: true };
    }
    return { text: `${minutes}m overdue`, isOverdue: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) {
    return { text: `${days}d, ${hours}h, ${minutes}m, ${seconds}s left`, isOverdue: false };
  } else if (hours > 0) {
    return { text: `${hours}h, ${minutes}m, ${seconds}s left`, isOverdue: false };
  } else if (minutes > 0) {
    return { text: `${minutes}m, ${seconds}s left`, isOverdue: false };
  }
  return { text: `${seconds}s left`, isOverdue: false };
};

// ============================================================
// CELL RENDERERS
// ============================================================

// Name Cell with inline editing
const NameCell: React.FC<{
  task: Task;
  width: number;
  onClick?: () => void;
  onNameChange?: (name: string) => Promise<void>;
}> = ({ task, width, onClick, onNameChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.name);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(task.name);
    }
  }, [task.name, isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(task.name);
  };

  const handleSave = async () => {
    if (editValue.trim() === '' || editValue.trim() === task.name) {
      setEditValue(task.name);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onNameChange?.(editValue.trim());
      setIsEditing(false);
    } catch (error) {
      setEditValue(task.name);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(task.name);
      setIsEditing(false);
    }
  };

  // Checklist progress indicators
  const getProgressIndicators = () => {
    const checklists = task.checklists || [];
    if (checklists.length === 0) return null;

    let completed = 0;
    let total = 0;
    checklists.forEach((cl: any) => {
      const items = cl.items || [];
      total += items.length;
      completed += items.filter((item: any) => item.checked || item.resolved).length;
    });

    if (total === 0) return null;

    const percentage = (completed / total) * 100;
    return (
      <div className="flex items-center gap-0.5 ml-2">
        <div className={cn('w-2 h-2 rounded-full', percentage >= 33 ? 'bg-green-500' : 'bg-gray-200')} />
        <div className={cn('w-2 h-2 rounded-full', percentage >= 66 ? 'bg-yellow-500' : 'bg-gray-200')} />
        <div className={cn('w-2 h-2 rounded-full', percentage >= 100 ? 'bg-red-500' : 'bg-gray-200')} />
      </div>
    );
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5" style={{ width, minWidth: 200 }} onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
          className={cn(
            'flex-1 px-2 py-1 text-sm font-medium rounded border border-purple-300 bg-white',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
            isSaving && 'opacity-50'
          )}
        />
        {isSaving && <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 cursor-pointer group"
      style={{ width, minWidth: 200 }}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit"
    >
      <span className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">
        {task.name}
      </span>
      {getProgressIndicators()}
      <div className="flex items-center gap-1.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
        {task.description && <MessageSquare className="h-3.5 w-3.5 text-gray-400" />}
        {(task.attachments?.length || 0) > 0 && (
          <div className="flex items-center gap-0.5 text-gray-400">
            <Paperclip className="h-3.5 w-3.5" />
            <span className="text-xs">{task.attachments?.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Due Date Cell
const DueDateCell: React.FC<{
  task: Task;
  width: number;
  onDateChange?: (timestamp: number | null) => void;
}> = ({ task, width, onDateChange }) => {
  const dueDate = task.due_date;

  return (
    <div className="flex items-center px-3 py-2.5" style={{ width, minWidth: 100 }}>
      <DatePickerDropdown
        currentDate={dueDate}
        onSelect={(date) => {
          if (date) {
            const timestamp = new Date(date).getTime();
            onDateChange?.(timestamp);
          } else {
            onDateChange?.(null);
          }
        }}
        placeholder="Set date"
      />
    </div>
  );
};

// Assignee Cell
const AssigneeCell: React.FC<{
  task: Task;
  width: number;
  availableUsers?: Array<{ id: string | number; username?: string; email?: string; profilePicture?: string }>;
  onAssigneesChange?: (action: { add?: number[]; rem?: number[] }) => void;
}> = ({ task, width, availableUsers = [], onAssigneesChange }) => {
  const assignees = task.assignees || [];

  const handleToggle = (user: any) => {
    const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
    const isAssigned = assignees.some((a) => String(a.id) === String(user.id));
    if (isAssigned) {
      onAssigneesChange?.({ rem: [userId] });
    } else {
      onAssigneesChange?.({ add: [userId] });
    }
  };

  const handleRemove = (userId: string | number) => {
    const numericId = typeof userId === 'string' ? parseInt(userId) : userId;
    onAssigneesChange?.({ rem: [numericId] });
  };

  return (
    <div className="flex items-center px-3 py-2.5" style={{ width, minWidth: 80 }}>
      <AssigneeDropdown
        currentAssignees={assignees}
        availableUsers={availableUsers}
        onToggle={handleToggle}
        onRemove={handleRemove}
      />
    </div>
  );
};

// Tags Cell - ClickUp Style with #tagname format in gray pill
const TagsCell: React.FC<{ task: Task; width: number }> = ({ task, width }) => {
  const tags = task.tags || [];

  if (tags.length === 0) {
    return (
      <div className="flex items-center px-3 py-2.5" style={{ width, minWidth: 100 }}>
        <span className="text-sm text-gray-300">—</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-2.5 overflow-hidden" style={{ width, minWidth: 100 }}>
      {tags.slice(0, 2).map((tag, idx) => {
        const tagName = tag.name || 'tag';
        return (
          <span
            key={idx}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
            title={tagName}
          >
            #{tagName}
          </span>
        );
      })}
      {tags.length > 2 && (
        <span className="text-xs text-gray-400 font-medium">+{tags.length - 2}</span>
      )}
    </div>
  );
};

// Timer/ETA Cell - ClickUp Style with countdown
const TimerCell: React.FC<{
  task: Task;
  width: number;
  isRunning?: boolean;
  elapsed?: number;
  onStart?: () => Promise<void>;
  onStop?: () => Promise<void>;
}> = ({ task, width, isRunning, elapsed = 0, onStart, onStop }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [localElapsed, setLocalElapsed] = useState(elapsed);
  const [countdown, setCountdown] = useState<{ text: string; isOverdue: boolean } | null>(null);

  // Check for ETA
  const eta = (task as any).eta || (task as any).accountability?.eta;

  // Update countdown every second if ETA exists
  useEffect(() => {
    if (!eta) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      setCountdown(formatCountdown(eta));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [eta]);

  // Update local elapsed when prop changes
  useEffect(() => {
    setLocalElapsed(elapsed);
  }, [elapsed]);

  // Increment timer locally when running
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setLocalElapsed((prev) => prev + 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isRunning) {
        await onStop?.();
      } else {
        await onStart?.();
      }
    } catch (error) {
      console.error('Timer toggle failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // If we have an ETA countdown, show that with square indicator like ClickUp
  if (countdown) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ width, minWidth: 180 }}>
        {/* Square indicator - red for overdue, green for on track */}
        <div
          className={cn(
            'w-3 h-3 rounded-sm flex-shrink-0',
            countdown.isOverdue ? 'bg-red-500' : 'bg-green-500'
          )}
        />
        <span
          className={cn(
            'text-sm font-medium whitespace-nowrap',
            countdown.isOverdue ? 'text-gray-800' : 'text-gray-700'
          )}
        >
          {countdown.text}
        </span>
      </div>
    );
  }

  // Otherwise show timer controls
  const existingTime = task.time_spent || 0;
  const totalTime = existingTime + (isRunning ? localElapsed : 0);

  return (
    <div className="flex items-center gap-2 px-3 py-2.5" style={{ width, minWidth: 100 }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        disabled={isLoading}
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded-full transition-all',
          isRunning
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-gray-100 text-gray-500 hover:bg-purple-100 hover:text-purple-600',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isRunning ? (
          <Square className="w-3 h-3 fill-current" />
        ) : (
          <Play className="w-3.5 h-3.5 ml-0.5" />
        )}
      </button>
      <span className={cn('text-sm font-mono tabular-nums', isRunning ? 'text-purple-600 font-medium' : 'text-gray-500')}>
        {isRunning ? formatTime(localElapsed) : formatTime(totalTime)}
      </span>
    </div>
  );
};

// Priority Cell
const PriorityCell: React.FC<{
  task: Task;
  width: number;
  onPriorityChange?: (priority: number | null) => void;
}> = ({ task, width, onPriorityChange }) => {
  const priority = task.priority;

  return (
    <div className="flex items-center px-3 py-2.5" style={{ width, minWidth: 80 }}>
      <PriorityDropdown
        currentPriority={priority}
        onSelect={(p) => {
          if (p && p.id) {
            onPriorityChange?.(parseInt(String(p.id)));
          } else {
            onPriorityChange?.(null);
          }
        }}
      />
    </div>
  );
};

// Status Cell
const StatusCell: React.FC<{
  task: Task;
  width: number;
  availableStatuses?: StatusOption[];
  onStatusChange?: (status: StatusOption) => void;
}> = ({ task, width, availableStatuses = [], onStatusChange }) => {
  const status = task.status;

  const statusOptions: StatusOption[] = availableStatuses.length > 0
    ? availableStatuses
    : status
      ? [{ id: status.id || status.status, status: status.status, color: status.color }]
      : [];

  return (
    <div className="flex items-center px-3 py-2.5" style={{ width, minWidth: 100 }}>
      <StatusDropdown
        currentStatus={status ? { id: status.id || status.status, status: status.status, color: status.color } : null}
        statuses={statusOptions}
        onSelect={(s) => onStatusChange?.(s)}
      />
    </div>
  );
};

// ============================================================
// MAIN TASK ROW COMPONENT
// ============================================================

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  columns,
  isSelected = false,
  onSelect,
  onClick,
  onNameChange,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  onAssigneesChange,
  onTimerStart,
  onTimerStop,
  isTimerRunning = false,
  timerElapsed = 0,
  availableStatuses = [],
  availableUsers = [],
  isUpdating = false,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const visibleColumns = columns.filter((col) => col.visible);

  const renderCell = (column: Column) => {
    switch (column.id) {
      case 'name':
        return (
          <NameCell
            key={column.id}
            task={task}
            width={column.width}
            onClick={() => onClick?.(task)}
            onNameChange={onNameChange ? (name) => onNameChange(task.id, name) : undefined}
          />
        );
      case 'dueDate':
        return (
          <DueDateCell
            key={column.id}
            task={task}
            width={column.width}
            onDateChange={(date) => onDueDateChange?.(task.id, date)}
          />
        );
      case 'assignee':
        return (
          <AssigneeCell
            key={column.id}
            task={task}
            width={column.width}
            availableUsers={availableUsers}
            onAssigneesChange={(action) => onAssigneesChange?.(task.id, action)}
          />
        );
      case 'tags':
        return <TagsCell key={column.id} task={task} width={column.width} />;
      case 'timer':
        return (
          <TimerCell
            key={column.id}
            task={task}
            width={column.width}
            isRunning={isTimerRunning}
            elapsed={timerElapsed}
            onStart={onTimerStart ? () => onTimerStart(task.id) : undefined}
            onStop={onTimerStop ? () => onTimerStop(task.id) : undefined}
          />
        );
      case 'priority':
        return (
          <PriorityCell
            key={column.id}
            task={task}
            width={column.width}
            onPriorityChange={(priority) => onPriorityChange?.(task.id, priority)}
          />
        );
      case 'status':
        return (
          <StatusCell
            key={column.id}
            task={task}
            width={column.width}
            availableStatuses={availableStatuses}
            onStatusChange={(status) => onStatusChange?.(task.id, status)}
          />
        );
      default:
        return (
          <div key={column.id} className="px-3 py-2.5 text-sm text-gray-300" style={{ width: column.width }}>
            —
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        'flex items-center bg-white border-b border-gray-100',
        'hover:bg-gray-50/50 transition-colors',
        isSelected && 'bg-purple-50 hover:bg-purple-50',
        isUpdating && 'opacity-60 pointer-events-none',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox with drag handle */}
      <div className="flex items-center w-10 px-2 py-2.5">
        <div className="relative flex items-center">
          <div className={cn('absolute -left-5 transition-opacity cursor-grab', isHovered ? 'opacity-100' : 'opacity-0')}>
            <GripVertical className="h-4 w-4 text-gray-300" />
          </div>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect?.(task.id, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Dynamic Columns */}
      {visibleColumns.map((column) => renderCell(column))}

      {/* Actions */}
      <div className="flex items-center px-2 w-10">
        <button className={cn('p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all', isHovered ? 'opacity-100' : 'opacity-0')}>
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default TaskRow;