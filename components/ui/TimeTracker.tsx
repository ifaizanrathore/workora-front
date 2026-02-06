'use client';

import React, { useEffect, useState } from 'react';
import { Play, Pause, Square, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimerStore, useTaskStore } from '@/stores';

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const TimeTracker: React.FC = () => {
  const { activeTaskId, isRunning, elapsedTime, startTimer, stopTimer, resetTimer, tick } = useTimerStore();
  const { tasks } = useTaskStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // Tick every second when running
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  // Don't render if no timer is active
  if (!activeTaskId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className={cn(
        'bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-[#ECEDF0] dark:border-gray-700 transition-all',
        isExpanded ? 'w-72' : 'w-auto'
      )}>
        {/* Compact View */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            isRunning ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
          )}>
            <Clock className={cn(
              'h-4 w-4',
              isRunning ? 'text-green-500' : 'text-amber-500'
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#9CA3AF] dark:text-gray-500 truncate">
              {activeTask?.name || 'Task timer'}
            </p>
            <p className={cn(
              'text-sm font-mono font-semibold tabular-nums',
              isRunning ? 'text-green-600 dark:text-green-400' : 'text-[#1A1A2E] dark:text-white'
            )}>
              {formatTime(elapsedTime)}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {isRunning ? (
              <button
                onClick={(e) => { e.stopPropagation(); stopTimer(); }}
                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                title="Pause"
              >
                <Pause className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); if (activeTaskId) startTimer(activeTaskId); }}
                className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                title="Resume"
              >
                <Play className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); resetTimer(); }}
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
              title="Stop & reset"
            >
              <Square className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;
