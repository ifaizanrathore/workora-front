'use client';

import React, { useCallback } from 'react';
import { X, Trash2, CheckCircle, Flag, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/stores';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface BulkActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onTaskUpdate?: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedIds,
  onClearSelection,
  onTaskUpdate,
}) => {
  const { tasks, updateTask, removeTask } = useTaskStore();

  const handleBulkStatusChange = useCallback(async (status: string) => {
    const promises = selectedIds.map((id) =>
      api.updateTask(id, { status }).then(() => {
        updateTask(id, { status: { status, color: '#9CA3AF', type: 'custom' } });
      })
    );

    try {
      await Promise.allSettled(promises);
      toast.success(`Updated ${selectedIds.length} tasks`);
      onClearSelection();
      onTaskUpdate?.();
    } catch {
      toast.error('Some updates failed');
    }
  }, [selectedIds, updateTask, onClearSelection, onTaskUpdate]);

  const handleBulkPriorityChange = useCallback(async (priority: number) => {
    const priorityNames: Record<number, string> = { 1: 'urgent', 2: 'high', 3: 'normal', 4: 'low' };
    const priorityColors: Record<number, string> = { 1: '#EF4444', 2: '#F59E0B', 3: '#3B82F6', 4: '#9CA3AF' };

    const promises = selectedIds.map((id) =>
      api.updateTask(id, { priority }).then(() => {
        updateTask(id, {
          priority: {
            id: String(priority),
            priority: priorityNames[priority],
            color: priorityColors[priority],
          },
        });
      })
    );

    try {
      await Promise.allSettled(promises);
      toast.success(`Set priority for ${selectedIds.length} tasks`);
      onClearSelection();
      onTaskUpdate?.();
    } catch {
      toast.error('Some updates failed');
    }
  }, [selectedIds, updateTask, onClearSelection, onTaskUpdate]);

  const handleBulkDelete = useCallback(async () => {
    if (!confirm(`Delete ${selectedIds.length} tasks? This cannot be undone.`)) return;

    const promises = selectedIds.map((id) =>
      api.deleteTask(id).then(() => removeTask(id))
    );

    try {
      await Promise.allSettled(promises);
      toast.success(`Deleted ${selectedIds.length} tasks`);
      onClearSelection();
      onTaskUpdate?.();
    } catch {
      toast.error('Some deletes failed');
    }
  }, [selectedIds, removeTask, onClearSelection, onTaskUpdate]);

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-2 bg-[#1A1A2E] dark:bg-gray-800 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-gray-700">
        {/* Count */}
        <span className="text-sm font-medium mr-1">
          {selectedIds.length} selected
        </span>

        <div className="w-px h-5 bg-gray-600 mx-1" />

        {/* Complete */}
        <button
          onClick={() => handleBulkStatusChange('complete')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors"
          title="Mark as complete"
        >
          <CheckCircle className="h-3.5 w-3.5 text-green-400" />
          Complete
        </button>

        {/* Priority submenu */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors">
            <Flag className="h-3.5 w-3.5 text-amber-400" />
            Priority
          </button>
          <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block">
            <div className="bg-[#1A1A2E] dark:bg-gray-800 rounded-lg border border-gray-700 shadow-xl p-1 min-w-[120px]">
              {[
                { id: 1, label: 'Urgent', color: '#EF4444' },
                { id: 2, label: 'High', color: '#F59E0B' },
                { id: 3, label: 'Normal', color: '#3B82F6' },
                { id: 4, label: 'Low', color: '#9CA3AF' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleBulkPriorityChange(p.id)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-white rounded hover:bg-white/10 transition-colors"
                >
                  <Flag className="h-3 w-3" style={{ color: p.color }} fill={p.color} strokeWidth={0} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={handleBulkDelete}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
          title="Delete tasks"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>

        <div className="w-px h-5 bg-gray-600 mx-1" />

        {/* Clear */}
        <button
          onClick={onClearSelection}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default BulkActions;
