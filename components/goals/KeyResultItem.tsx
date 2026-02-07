'use client';

import React, { useState } from 'react';
import { Check, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { KeyResult } from '@/types';
import toast from 'react-hot-toast';

interface KeyResultItemProps {
  keyResult: KeyResult;
  onUpdate: () => void;
  onDelete: () => void;
}

export const KeyResultItem: React.FC<KeyResultItemProps> = ({ keyResult, onUpdate, onDelete }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentValue, setCurrentValue] = useState(keyResult.steps_current);

  const progress = keyResult.steps_end > keyResult.steps_start
    ? Math.round(((currentValue - keyResult.steps_start) / (keyResult.steps_end - keyResult.steps_start)) * 100)
    : 0;

  const handleUpdateProgress = async () => {
    if (currentValue === keyResult.steps_current) return;
    setIsUpdating(true);
    try {
      await api.updateKeyResult(keyResult.id, { steps_current: currentValue });
      toast.success('Progress updated');
      onUpdate();
    } catch {
      toast.error('Failed to update progress');
      setCurrentValue(keyResult.steps_current);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteKeyResult(keyResult.id);
      toast.success('Key result deleted');
      onDelete();
    } catch {
      toast.error('Failed to delete key result');
    } finally {
      setIsDeleting(false);
    }
  };

  const typeLabel = {
    number: '#',
    currency: '$',
    boolean: keyResult.completed ? 'Done' : 'Not done',
    percentage: '%',
    automatic: 'Auto',
  }[keyResult.type];

  return (
    <div className="group p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {keyResult.completed ? (
            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{typeLabel}</span>
            </div>
          )}
          <span className="text-sm text-gray-900 dark:text-white truncate">{keyResult.name}</span>
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1 rounded opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
        >
          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>{Math.min(progress, 100)}%</span>
          <span>{currentValue} / {keyResult.steps_end} {keyResult.unit}</span>
        </div>
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 dark:bg-purple-400 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Update Controls */}
      {keyResult.type !== 'boolean' && keyResult.type !== 'automatic' && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={currentValue}
            onChange={(e) => setCurrentValue(Number(e.target.value))}
            min={keyResult.steps_start}
            max={keyResult.steps_end}
            className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <button
            onClick={handleUpdateProgress}
            disabled={isUpdating || currentValue === keyResult.steps_current}
            className="px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Update'}
          </button>
        </div>
      )}
    </div>
  );
};
