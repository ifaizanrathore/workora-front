'use client';

import React, { useState } from 'react';
import {
  MoreHorizontal,
  Play,
  Pause,
  Calendar,
  User,
  Flag,
  MessageSquare,
  Paperclip,
  GripVertical,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types';
import { Column } from './TaskListHeader';
import { formatDate, getPriorityColor, getPriorityLabel } from '@/lib/utils';

// ============================================================
// TYPES
// ============================================================

interface TaskRowProps {
  task: Task;
  columns: Column[];
  isSelected?: boolean;
  onSelect?: (taskId: string, selected: boolean) => void;
  onClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: string) => void;
  onTimerToggle?: (taskId: string) => void;
  isTimerRunning?: boolean;
  timerDisplay?: string;
  className?: string;
}

// ============================================================
// CELL RENDERERS
// ============================================================

// Name Cell with colored progress indicators
const NameCell: React.FC<{
  task: Task;
  width: number;
  onClick?: () => void;
}> = ({ task, width, onClick }) => {
  // Get checklist progress or custom field indicators
  const getProgressIndicators = () => {
    const checklists = task.checklists || [];
    if (checklists.length === 0) return null;

    // Calculate progress from checklists
    let completed = 0;
    let total = 0;
    checklists.forEach((cl: any) => {
      const items = cl.items || [];
      total += items.length;
      completed += items.filter((item: any) => item.checked || item.resolved).length;
    });

    if (total === 0) return null;

    // Show colored dots based on completion
    const percentage = (completed / total) * 100;
    return (
      <div className="flex items-center gap-0.5 ml-2">
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full',
            percentage >= 33 ? 'bg-green-500' : 'bg-gray-200'
          )}
        />
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full',
            percentage >= 66 ? 'bg-yellow-500' : 'bg-gray-200'
          )}
        />
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full',
            percentage >= 100 ? 'bg-red-500' : 'bg-gray-200'
          )}
        />
      </div>
    );
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 cursor-pointer group"
      style={{ width, minWidth: 200 }}
      onClick={onClick}
    >
      {/* Task Name */}
      <span className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">
        {task.name}
      </span>

      {/* Progress Indicators */}
      {getProgressIndicators()}

      {/* Quick Info Badges (on hover) */}
      <div className="flex items-center gap-1.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
        {task.description && (
          <div className="flex items-center gap-0.5 text-gray-400">
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
        )}
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
const DueDateCell: React.FC<{ task: Task; width: number }> = ({ task, width }) => {
  const dueDate = task.due_date || (task as any).dueDate;
  const isOverdue = dueDate && new Date(dueDate) < new Date();

  if (!dueDate) {
    return (
      <div className="flex items-center px-3 py-2.5 text-gray-300" style={{ width, minWidth: 100 }}>
        —
      </div>
    );
  }

  return (
    <div className="flex items-center px-3 py-2.5" style={{ width, minWidth: 100 }}>
      <span
        className={cn(
          'text-sm',
          isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
        )}
      >
        {formatDate(dueDate, { short: true })}
      </span>
    </div>
  );
};

// Assignee Cell with avatar stack
const AssigneeCell: React.FC<{ task: Task; width: number }> = ({ task, width }) => {
  const assignees = task.assignees || [];

  return (
    <div className="flex items-center px-3 py-2.5" style={{ width, minWidth: 80 }}>
      {assignees.length > 0 ? (
        <div className="flex -space-x-1.5">
          {assignees.slice(0, 3).map((assignee, i) => (
            <div
              key={assignee.id || i}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white flex items-center justify-center ring-0"
              title={assignee.username || assignee.email}
            >
              {assignee.profilePicture ? (
                <img
                  src={assignee.profilePicture}
                  alt={assignee.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-white">
                  {(assignee.username || assignee.email || '?')[0].toUpperCase()}
                </span>
              )}
            </div>
          ))}
          {assignees.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
              <span className="text-xs font-medium text-gray-500">+{assignees.length - 3}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center">
          <User className="h-3.5 w-3.5 text-gray-300" />
        </div>
      )}
    </div>
  );
};

// Tags Cell with colored bars
const TagsCell: React.FC<{ task: Task; width: number }> = ({ task, width }) => {
  const tags = task.tags || [];

  return (
    <div className="flex items-center gap-1.5 px-3 py-2.5 overflow-hidden" style={{ width, minWidth: 80 }}>
      {tags.length > 0 ? (
        <>
          {tags.slice(0, 2).map((tag, i) => (
            <span
              key={tag.name || i}
              className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded"
              style={{
                backgroundColor: tag.tag_bg || '#E9D5FF',
                color: tag.tag_fg || '#7C3AED',
              }}
            >
              #{tag.name}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="text-xs text-gray-400 font-medium">+{tags.length - 2}</span>
          )}
        </>
      ) : (
        <span className="text-gray-300">—</span>
      )}
    </div>
  );
};

// Timer Cell with countdown display
const TimerCell: React.FC<{
  task: Task;
  width: number;
  isRunning?: boolean;
  display?: string;
  onToggle?: (taskId: string) => void;
}> = ({ task, width, isRunning, display, onToggle }) => {
  const timeTracked = task.time_spent || 0;

  // Check if task has ETA/deadline for countdown
  const eta = (task as any).eta || (task as any).accountability?.eta;
  const hasCountdown = !!eta;

  // Calculate countdown if ETA exists
  const getCountdownDisplay = () => {
    if (!eta) return null;
    const now = new Date();
    const deadline = new Date(eta);
    const diff = deadline.getTime() - now.getTime();

    if (diff < 0) return { text: 'Overdue', isOverdue: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return { text: `${days}d, ${hours}h, ${minutes}m, ${seconds}s left`, isOverdue: false };
    }
    return { text: `${hours}h, ${minutes}m, ${seconds}s left`, isOverdue: false };
  };

  const countdown = getCountdownDisplay();

  return (
    <div className="flex items-center gap-2 px-3 py-2.5" style={{ width, minWidth: 100 }}>
      {countdown ? (
        // Countdown display
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              countdown.isOverdue ? 'bg-red-500' : 'bg-blue-500'
            )}
          />
          <span
            className={cn(
              'text-xs font-medium',
              countdown.isOverdue ? 'text-red-600' : 'text-gray-600'
            )}
          >
            {countdown.text}
          </span>
        </div>
      ) : (
        // Timer button
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.(task.id);
          }}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors',
            isRunning
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'text-gray-500 hover:bg-gray-100'
          )}
        >
          {isRunning ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          <span>{isRunning ? display || '0:00' : formatDuration(timeTracked)}</span>
        </button>
      )}
    </div>
  );
};

// Priority Cell with colored badge
const PriorityCell: React.FC<{ task: Task; width: number }> = ({ task, width }) => {
  const priority = task.priority;
 const priorityId = priority?.id || priority?.priority || undefined;

  const getPriorityStyle = (id: string | number | undefined) => {
    const p = String(id || '').toLowerCase();
    switch (p) {
      case 'urgent':
      case '1':
        return { bg: 'bg-red-500', text: 'text-white', label: 'Urgent' };
      case 'high':
      case '2':
        return { bg: 'bg-orange-500', text: 'text-white', label: 'High' };
      case 'normal':
      case '3':
        return { bg: 'bg-blue-500', text: 'text-white', label: 'Normal' };
      case 'low':
      case '4':
        return { bg: 'bg-gray-400', text: 'text-white', label: 'Low' };
      default:
        return null;
    }
  };

  const style = getPriorityStyle(priorityId);

  return (
    <div className="flex items-center px-3 py-2.5" style={{ width, minWidth: 80 }}>
      {style ? (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md',
            style.bg,
            style.text
          )}
        >
          <Flag className="h-3 w-3" />
          {style.label}
        </span>
      ) : (
        <span className="text-gray-300">—</span>
      )}
    </div>
  );
};

// Status Cell with colored badge
const StatusCell: React.FC<{
  task: Task;
  width: number;
  onChange?: (status: string) => void;
}> = ({ task, width, onChange }) => {
  const status = task.status;
  const statusColor = status?.color || '#9CA3AF';

  return (
    <div className="flex items-center px-3 py-2.5" style={{ width, minWidth: 100 }}>
      {status ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Could open status dropdown
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors hover:opacity-80 border"
          style={{
            borderColor: statusColor,
            color: statusColor,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          {status.status}
        </button>
      ) : (
        <span className="text-gray-300">No status</span>
      )}
    </div>
  );
};

// Helper function
function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '0:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// ============================================================
// MAIN TASK ROW COMPONENT
// ============================================================

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  columns,
  isSelected = false,
  onSelect,
  onClick,
  onStatusChange,
  onTimerToggle,
  isTimerRunning,
  timerDisplay,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const visibleColumns = columns.filter((c) => c.visible);

  // Render cell based on column id
  const renderCell = (column: Column) => {
    switch (column.id) {
      case 'name':
        return (
          <NameCell
            key={column.id}
            task={task}
            width={column.width}
            onClick={() => onClick?.(task)}
          />
        );
      case 'dueDate':
        return <DueDateCell key={column.id} task={task} width={column.width} />;
      case 'assignee':
        return <AssigneeCell key={column.id} task={task} width={column.width} />;
      case 'tags':
        return <TagsCell key={column.id} task={task} width={column.width} />;
      case 'timer':
        return (
          <TimerCell
            key={column.id}
            task={task}
            width={column.width}
            isRunning={isTimerRunning}
            display={timerDisplay}
            onToggle={onTimerToggle}
          />
        );
      case 'priority':
        return <PriorityCell key={column.id} task={task} width={column.width} />;
      case 'status':
        return (
          <StatusCell
            key={column.id}
            task={task}
            width={column.width}
            onChange={(status) => onStatusChange?.(task.id, status)}
          />
        );
      default:
        return (
          <div
            key={column.id}
            className="px-3 py-2.5 text-sm text-gray-300"
            style={{ width: column.width }}
          >
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
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox with drag handle */}
      <div className="flex items-center w-10 px-2 py-2.5">
        <div className="relative flex items-center">
          {/* Drag Handle (shown on hover) */}
          <div
            className={cn(
              'absolute -left-5 transition-opacity cursor-grab',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
          >
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

      {/* Actions (shown on hover) */}
      <div className="flex items-center px-2 w-10">
        <button
          className={cn(
            'p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default TaskRow;