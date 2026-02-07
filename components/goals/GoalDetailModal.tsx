'use client';

import React, { useState } from 'react';
import { X, Target, Calendar, Trash2, Plus, Loader2, ExternalLink } from 'lucide-react';
import { useGoal } from '@/hooks';
import { api } from '@/lib/api';
import { KeyResultItem } from './KeyResultItem';
import type { Goal } from '@/types';
import toast from 'react-hot-toast';

interface GoalDetailModalProps {
  goalId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  goalId,
  isOpen,
  onClose,
  onDeleted,
  onUpdated,
}) => {
  const { data: goal, isLoading, refetch } = useGoal(isOpen ? goalId : null);
  const [showAddKR, setShowAddKR] = useState(false);
  const [krName, setKrName] = useState('');
  const [krType, setKrType] = useState<'number' | 'percentage' | 'boolean'>('number');
  const [krTarget, setKrTarget] = useState('100');
  const [krUnit, setKrUnit] = useState('');
  const [isAddingKR, setIsAddingKR] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const progress = Math.round(goal?.percent_completed || 0);
  const dueDate = goal?.due_date ? new Date(Number(goal.due_date)) : null;

  const handleAddKeyResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!krName.trim()) return;

    setIsAddingKR(true);
    try {
      await api.createKeyResult(goalId, {
        name: krName.trim(),
        owners: [],
        type: krType,
        steps_start: 0,
        steps_end: krType === 'boolean' ? 1 : Number(krTarget) || 100,
        unit: krType === 'percentage' ? '%' : krUnit || 'items',
      });
      toast.success('Key result added');
      setKrName('');
      setKrTarget('100');
      setKrUnit('');
      setShowAddKR(false);
      refetch();
      onUpdated();
    } catch {
      toast.error('Failed to add key result');
    } finally {
      setIsAddingKR(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    setIsDeleting(true);
    try {
      await api.deleteGoal(goalId);
      toast.success('Goal deleted');
      onDeleted();
      onClose();
    } catch {
      toast.error('Failed to delete goal');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: goal?.color || '#7C3AED' }}
            />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {goal?.name || 'Loading...'}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {goal?.pretty_url && (
              <a
                href={goal.pretty_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            </div>
          ) : goal ? (
            <>
              {/* Description */}
              {goal.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>
              )}

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500 dark:text-gray-400">Overall Progress</span>
                  <span className={`font-semibold ${progress >= 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                    {progress}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress >= 100 ? 'bg-green-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-sm">
                {dueDate && (
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>{dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <Target className="h-4 w-4" />
                  <span>{goal.key_results?.length || 0} key results</span>
                </div>
              </div>

              {/* Key Results */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Key Results</h3>
                  <button
                    onClick={() => setShowAddKR(!showAddKR)}
                    className="p-1 rounded-md text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 dark:hover:text-purple-400 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Add KR Form */}
                {showAddKR && (
                  <form onSubmit={handleAddKeyResult} className="mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                    <input
                      type="text"
                      value={krName}
                      onChange={(e) => setKrName(e.target.value)}
                      placeholder="Key result name..."
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <select
                        value={krType}
                        onChange={(e) => setKrType(e.target.value as any)}
                        className="px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="number">Number</option>
                        <option value="percentage">Percentage</option>
                        <option value="boolean">True/False</option>
                      </select>
                      {krType !== 'boolean' && (
                        <>
                          <input
                            type="number"
                            value={krTarget}
                            onChange={(e) => setKrTarget(e.target.value)}
                            placeholder="Target"
                            className="w-20 px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          {krType === 'number' && (
                            <input
                              type="text"
                              value={krUnit}
                              onChange={(e) => setKrUnit(e.target.value)}
                              placeholder="Unit"
                              className="w-20 px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddKR(false)}
                        className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isAddingKR || !krName.trim()}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded disabled:opacity-50 transition-colors inline-flex items-center gap-1"
                      >
                        {isAddingKR && <Loader2 className="h-3 w-3 animate-spin" />}
                        Add
                      </button>
                    </div>
                  </form>
                )}

                {/* KR List */}
                <div className="space-y-2">
                  {goal.key_results?.length > 0 ? (
                    goal.key_results.map((kr) => (
                      <KeyResultItem
                        key={kr.id}
                        keyResult={kr}
                        onUpdate={() => { refetch(); onUpdated(); }}
                        onDelete={() => { refetch(); onUpdated(); }}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                      No key results yet. Add one to track progress.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
