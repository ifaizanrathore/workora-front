'use client';

import React from 'react';
import { Target, Calendar, Users, ChevronRight } from 'lucide-react';
import type { Goal } from '@/types';

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick }) => {
  const progress = Math.round(goal.percent_completed || 0);
  const dueDate = goal.due_date ? new Date(Number(goal.due_date)) : null;
  const isOverdue = dueDate && dueDate < new Date();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Goal Header */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: goal.color || '#7C3AED' }}
            />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {goal.name}
            </h3>
          </div>

          {/* Description */}
          {goal.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
              {goal.description}
            </p>
          )}

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Progress</span>
              <span className={`font-medium ${progress >= 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {progress}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress >= 100
                    ? 'bg-green-500'
                    : progress >= 50
                    ? 'bg-purple-500'
                    : 'bg-purple-400'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            {dueDate && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 dark:text-red-400' : ''}`}>
                <Calendar className="h-3 w-3" />
                <span>{formatDate(dueDate)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>{goal.key_results?.length || 0} key results</span>
            </div>
            {goal.owners?.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{goal.owners.length}</span>
              </div>
            )}
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-500 transition-colors flex-shrink-0 mt-1" />
      </div>
    </button>
  );
};
