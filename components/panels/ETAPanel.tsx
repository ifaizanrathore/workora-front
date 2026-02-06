'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, AlertCircle, Clock, Info, Shield, CheckCircle2, AlertTriangle, Timer } from 'lucide-react';
import { TaskAccountability, EtaHistoryEntry } from '@/types';
import { useSetTaskETA, useExtendTaskETA } from '@/hooks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

interface ETAPanelProps {
  taskId: string;
  accountability?: TaskAccountability | null;
}

/** Format milliseconds to readable duration */
const formatDuration = (ms: number): string => {
  const abs = Math.abs(ms);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(' ');
};

/** Format ISO date to readable string */
const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const ETAPanel: React.FC<ETAPanelProps> = ({ taskId, accountability }) => {
  const setETA = useSetTaskETA();
  const extendETA = useExtendTaskETA();

  // Computed values from real accountability data
  const etaInfo = useMemo(() => {
    if (!accountability) return null;

    const now = Date.now();
    const currentEta = accountability.currentEta ? new Date(accountability.currentEta).getTime() : null;
    const timeRemaining = currentEta ? currentEta - now : null;
    const isOverdue = timeRemaining !== null && timeRemaining < 0;

    return {
      currentEta,
      timeRemaining,
      isOverdue,
      isCompleted: !!accountability.completedAt,
      status: accountability.status,
      strikeCount: accountability.strikeCount,
      maxStrikes: accountability.maxStrikes,
      strikesRemaining: accountability.strikesRemaining,
      canExtend: accountability.canExtend,
      canSetEta: accountability.canSetEta,
      isLocked: accountability.isLocked,
      etaHistory: accountability.etaHistory || [],
    };
  }, [accountability]);

  // No accountability data — show empty state
  if (!accountability) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 px-6">
        <Timer className="h-10 w-10 mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No ETA tracking</p>
        <p className="text-xs text-center mt-1">ETA and accountability data will appear here when set for this task.</p>
      </div>
    );
  }

  const statusConfig = {
    GREEN: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400', icon: CheckCircle2, label: 'On Track' },
    ORANGE: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', icon: AlertTriangle, label: 'At Risk' },
    RED: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', icon: AlertCircle, label: 'Critical' },
  };

  const config = statusConfig[etaInfo?.status || 'GREEN'];
  const StatusIcon = config.icon;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Status Banner */}
      <div className={cn('px-4 py-3 border-b flex items-center gap-3', config.bg, config.border)}>
        <StatusIcon className={cn('h-5 w-5', config.text)} />
        <div>
          <span className={cn('text-sm font-semibold', config.text)}>{config.label}</span>
          {etaInfo?.isCompleted && (
            <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-medium">Completed</span>
          )}
        </div>
      </div>

      {/* ETA Info */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {/* Current ETA */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Current ETA</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {accountability.currentEta ? formatDate(accountability.currentEta) : 'Not set'}
          </span>
        </div>

        {/* Time Remaining */}
        {etaInfo?.timeRemaining !== null && !etaInfo?.isCompleted && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Time Remaining</span>
            <span className={cn(
              'text-sm font-semibold',
              etaInfo?.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            )}>
              {etaInfo?.isOverdue ? `${formatDuration(etaInfo.timeRemaining!)} overdue` : `${formatDuration(etaInfo!.timeRemaining!)} left`}
            </span>
          </div>
        )}

        {/* Original ETA */}
        {accountability.originalEta && accountability.originalEta !== accountability.currentEta && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Original ETA</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 line-through">
              {formatDate(accountability.originalEta)}
            </span>
          </div>
        )}

        {/* Total Time Spent */}
        {accountability.totalTimeSpent !== null && accountability.totalTimeSpent > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Time Spent</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {formatDuration(accountability.totalTimeSpent)}
            </span>
          </div>
        )}
      </div>

      {/* Strikes */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Strikes</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {accountability.strikeCount} / {accountability.maxStrikes}
          </span>
        </div>

        {/* Strike dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: accountability.maxStrikes }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-8 h-2 rounded-full transition-colors',
                i < accountability.strikeCount
                  ? 'bg-red-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
          ))}
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            {accountability.strikesRemaining} remaining
          </span>
        </div>
      </div>

      {/* ETA History */}
      {etaInfo && etaInfo.etaHistory.length > 0 && (
        <div className="px-4 py-4 bg-white dark:bg-gray-900">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            ETA History
          </h4>
          <div className="space-y-2">
            {etaInfo.etaHistory.map((entry: EtaHistoryEntry, i: number) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className={cn(
                  'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                  entry.type === 'initial' ? 'bg-blue-500' : 'bg-amber-500'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">{entry.type}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {formatDate(entry.setAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    ETA: {formatDate(entry.eta)}
                  </p>
                  {entry.reason && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">
                      {entry.reason}
                    </p>
                  )}
                  {entry.strikeNumber !== undefined && (
                    <span className="inline-flex items-center mt-1 px-1.5 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                      Strike #{entry.strikeNumber}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ETAPanel;
