'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, CheckSquare, ListTodo, Zap, Loader2, Trash2, Check, Circle, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { Task } from '@/types';
import toast from 'react-hot-toast';

interface TaskItemsTabsProps {
  taskId: string;
  listId: string;
}

type TabType = 'subtasks' | 'checklist' | 'actions';

const PRIORITY_COLORS: Record<string, string> = {
  '1': '#F42A2A',
  '2': '#FFCC00',
  '3': '#6B7AFF',
  '4': '#808080',
};

export const TaskItemsTabs: React.FC<TaskItemsTabsProps> = ({ taskId, listId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('subtasks');

  // Subtask state
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [creatingSubtask, setCreatingSubtask] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch subtasks on mount / taskId change
  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    setLoadingSubtasks(true);
    api.getSubtasks(taskId)
      .then((data) => {
        if (!cancelled) setSubtasks(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setSubtasks([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSubtasks(false);
      });
    return () => { cancelled = true; };
  }, [taskId]);

  // Focus input when shown
  useEffect(() => {
    if (showInput) inputRef.current?.focus();
  }, [showInput]);

  const handleCreateSubtask = async () => {
    const name = newSubtaskName.trim();
    if (!name || !taskId || !listId) return;

    setCreatingSubtask(true);
    try {
      const newTask = await api.createSubtask(taskId, listId, { name });
      setSubtasks((prev) => [...prev, newTask]);
      setNewSubtaskName('');
      inputRef.current?.focus();
      toast.success('Subtask created');
    } catch (err) {
      console.error('Failed to create subtask:', err);
      toast.error('Failed to create subtask');
    } finally {
      setCreatingSubtask(false);
    }
  };

  const handleToggleComplete = async (subtask: Task) => {
    const isDone = ['closed', 'complete', 'done', 'completed'].includes(subtask.status?.status?.toLowerCase() || '');
    const newStatus = isDone ? 'to do' : 'complete';

    // Optimistic update
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === subtask.id
          ? { ...s, status: { ...s.status, status: newStatus, color: isDone ? '#87909e' : '#6bc950' } }
          : s
      ) as Task[]
    );

    try {
      await api.updateSubtask(subtask.id, { status: newStatus });
    } catch (err) {
      // Revert on failure
      setSubtasks((prev) =>
        prev.map((s) => (s.id === subtask.id ? subtask : s))
      );
      toast.error('Failed to update subtask');
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const prev = [...subtasks];
    setSubtasks((s) => s.filter((t) => t.id !== subtaskId));

    try {
      await api.deleteSubtask(subtaskId);
      toast.success('Subtask deleted');
    } catch (err) {
      setSubtasks(prev);
      toast.error('Failed to delete subtask');
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'subtasks', label: 'Subtasks', icon: <ListTodo className="h-3.5 w-3.5" />, count: subtasks.length },
    { id: 'checklist', label: 'Checklist', icon: <CheckSquare className="h-3.5 w-3.5" /> },
    { id: 'actions', label: 'Actions', icon: <Zap className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="border-t border-[#ECEDF0] dark:border-gray-700 pt-4">
      {/* Tab Headers */}
      <div className="flex items-center gap-1 mb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-[#F3F0FF] dark:bg-purple-900/30 text-[#7C3AED] dark:text-purple-400'
                : 'text-[#9CA3AF] dark:text-gray-500 hover:text-[#6B7280] dark:hover:text-gray-300 hover:bg-[#F5F5F7] dark:hover:bg-gray-800'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[100px]">
        {activeTab === 'subtasks' && (
          <div className="space-y-1">
            {/* Loading */}
            {loadingSubtasks && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 text-purple-500 animate-spin" />
              </div>
            )}

            {/* Subtask List */}
            {!loadingSubtasks && subtasks.map((subtask) => {
              const isDone = ['closed', 'complete', 'done', 'completed'].includes(subtask.status?.status?.toLowerCase() || '');
              return (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F5F5F7] dark:hover:bg-gray-800 transition-colors group"
                >
                  {/* Status toggle */}
                  <button
                    onClick={() => handleToggleComplete(subtask)}
                    className={cn(
                      'flex-shrink-0 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all',
                      isDone
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400'
                    )}
                  >
                    {isDone && <Check className="h-3 w-3" strokeWidth={3} />}
                  </button>

                  {/* Name */}
                  <span
                    className={cn(
                      'flex-1 text-[13px] truncate',
                      isDone
                        ? 'text-gray-400 dark:text-gray-500 line-through'
                        : 'text-gray-800 dark:text-gray-200'
                    )}
                  >
                    {subtask.name}
                  </span>

                  {/* Priority flag */}
                  {subtask.priority?.id && (
                    <Flag
                      className="h-3.5 w-3.5 flex-shrink-0"
                      style={{ color: PRIORITY_COLORS[subtask.priority.id] || '#808080' }}
                    />
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-all"
                    aria-label={`Delete subtask: ${subtask.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}

            {/* Empty state */}
            {!loadingSubtasks && subtasks.length === 0 && !showInput && (
              <div className="text-center py-4 text-xs text-gray-400 dark:text-gray-500">
                No subtasks yet
              </div>
            )}

            {/* Add subtask input */}
            {showInput ? (
              <div className="flex items-center gap-2 px-3 py-1.5">
                {creatingSubtask ? (
                  <Loader2 className="h-4 w-4 text-purple-500 animate-spin flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                )}
                <input
                  ref={inputRef}
                  value={newSubtaskName}
                  onChange={(e) => setNewSubtaskName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleCreateSubtask(); }
                    if (e.key === 'Escape') { setNewSubtaskName(''); setShowInput(false); }
                  }}
                  onBlur={() => { if (!newSubtaskName.trim()) setShowInput(false); }}
                  disabled={creatingSubtask}
                  placeholder="Subtask name (Enter to save, Esc to cancel)"
                  className="flex-1 text-[13px] bg-transparent border-none outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            ) : (
              <button
                onClick={() => setShowInput(true)}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#9CA3AF] dark:text-gray-500 hover:text-[#7C3AED] dark:hover:text-purple-400 hover:bg-[#F5F5F7] dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add subtask</span>
              </button>
            )}
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="space-y-2">
            <button className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#9CA3AF] dark:text-gray-500 hover:text-[#7C3AED] dark:hover:text-purple-400 hover:bg-[#F5F5F7] dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Plus className="h-4 w-4" />
              <span>Add checklist item</span>
            </button>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-2">
            <button className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#9CA3AF] dark:text-gray-500 hover:text-[#7C3AED] dark:hover:text-purple-400 hover:bg-[#F5F5F7] dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Plus className="h-4 w-4" />
              <span>Add action</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItemsTabs;
