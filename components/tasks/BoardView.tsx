'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Plus, Flag, Clock, User, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types';
import { useTaskStore } from '@/stores';

// Priority colors
const PRIORITY_COLORS: Record<string, string> = {
  '1': '#EF4444',
  '2': '#F59E0B',
  '3': '#3B82F6',
  '4': '#9CA3AF',
};

const PRIORITY_LABELS: Record<string, string> = {
  '1': 'Urgent',
  '2': 'High',
  '3': 'Normal',
  '4': 'Low',
};

interface BoardViewProps {
  tasks: Task[];
  onAddTask?: () => void;
}

interface StatusColumn {
  status: string;
  color: string;
  tasks: Task[];
  type?: string;
}

// Board Card component
const BoardCard: React.FC<{ task: Task }> = ({ task }) => {
  const { openTaskModal } = useTaskStore();
  const dueDate = task.due_date ? new Date(Number(task.due_date)) : null;
  const isOverdue = dueDate ? dueDate < new Date() : false;
  const priorityColor = task.priority?.id ? PRIORITY_COLORS[task.priority.id] : undefined;

  return (
    <div
      onClick={() => openTaskModal(task)}
      className="bg-white dark:bg-gray-800 rounded-lg border border-[#ECEDF0] dark:border-gray-700 p-3 cursor-pointer hover:shadow-md hover:border-[#6E62E5]/40 dark:hover:border-[#6E62E5]/40 transition-all group"
    >
      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.name}
              className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded"
              style={{
                backgroundColor: (tag.tag_bg || tag.color || '#E5E7EB') + '20',
                color: tag.tag_fg || tag.tag_bg || tag.color || '#6B7280',
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Task Name */}
      <p className="text-sm font-medium text-[#1A1A2E] dark:text-white mb-2 line-clamp-2">
        {task.name}
      </p>

      {/* Bottom Row: Priority, Due Date, Assignees */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          {/* Priority */}
          {priorityColor && (
            <Flag
              className="h-3 w-3"
              style={{ color: priorityColor }}
              fill={priorityColor}
              strokeWidth={0}
            />
          )}

          {/* Due Date */}
          {dueDate && (
            <span className={cn(
              'flex items-center gap-1 text-[11px] font-medium',
              isOverdue ? 'text-red-500' : 'text-[#9CA3AF] dark:text-gray-500'
            )}>
              <Clock className="h-3 w-3" />
              {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {/* Assignees */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.assignees.slice(0, 3).map((assignee) => (
              assignee.profilePicture ? (
                <img
                  key={String(assignee.id)}
                  src={assignee.profilePicture}
                  alt={assignee.username || ''}
                  className="w-5 h-5 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                />
              ) : (
                <div
                  key={String(assignee.id)}
                  className="flex items-center justify-center w-5 h-5 rounded-full text-white text-[9px] font-bold ring-2 ring-white dark:ring-gray-800 bg-[#6E62E5]"
                >
                  {(assignee.username || assignee.email || '?')[0].toUpperCase()}
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const BoardView: React.FC<BoardViewProps> = ({ tasks, onAddTask }) => {
  // Group tasks by status
  const columns = useMemo<StatusColumn[]>(() => {
    const statusMap = new Map<string, StatusColumn>();

    tasks.forEach((task) => {
      const statusName = task.status?.status || 'No Status';
      const statusColor = task.status?.color || '#9CA3AF';
      const statusType = task.status?.type;

      if (!statusMap.has(statusName)) {
        statusMap.set(statusName, {
          status: statusName,
          color: statusColor,
          tasks: [],
          type: statusType,
        });
      }
      statusMap.get(statusName)!.tasks.push(task);
    });

    // Sort columns: open first, then custom, then closed
    const typeOrder: Record<string, number> = { open: 0, custom: 1, closed: 2 };
    return Array.from(statusMap.values()).sort((a, b) => {
      const orderA = typeOrder[a.type || 'custom'] ?? 1;
      const orderB = typeOrder[b.type || 'custom'] ?? 1;
      return orderA - orderB;
    });
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <div className="w-16 h-16 rounded-full bg-[#F3F0FF] dark:bg-purple-900/30 flex items-center justify-center mb-4">
          <MoreHorizontal className="h-8 w-8 text-[#6E62E5]" />
        </div>
        <h3 className="text-lg font-semibold text-[#1A1A2E] dark:text-white mb-1">No tasks yet</h3>
        <p className="text-sm text-[#8C8C9A] dark:text-gray-400 mb-4">Create your first task to see the board view</p>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="flex items-center gap-2 px-4 py-2 bg-[#6E62E5] text-white rounded-lg text-sm font-medium hover:bg-[#5B4FD1] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-4 p-4 overflow-x-auto h-full">
      {columns.map((column) => (
        <div
          key={column.status}
          className="flex-shrink-0 w-72 flex flex-col bg-[#F5F7FA] dark:bg-gray-800/50 rounded-xl"
        >
          {/* Column Header */}
          <div className="flex items-center justify-between px-3 py-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              <span className="text-sm font-semibold text-[#1A1A2E] dark:text-white uppercase tracking-wide">
                {column.status}
              </span>
              <span className="text-xs font-medium text-[#9CA3AF] dark:text-gray-500 bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                {column.tasks.length}
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
            {column.tasks.map((task) => (
              <BoardCard key={task.id} task={task} />
            ))}

            {/* Add Task Button */}
            {onAddTask && (
              <button
                onClick={onAddTask}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#9CA3AF] dark:text-gray-500 hover:text-[#6E62E5] dark:hover:text-[#6E62E5] hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add task
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BoardView;
