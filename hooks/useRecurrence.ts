'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { RecurrenceConfig, TaskRecurrence } from '@/types';

export function useSetRecurrence() {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async ({ taskId, recurrence }: {
    taskId: string;
    recurrence: RecurrenceConfig | null;
  }) => {
    setIsLoading(true);
    try {
      if (!recurrence) {
        return await api.setTaskRecurrence(taskId, null);
      }

      const clickupRecurrence: Record<string, any> = {
        frequency: recurrence.frequency,
        interval: recurrence.interval,
      };

      if (recurrence.daysOfWeek) clickupRecurrence.day_of_week = recurrence.daysOfWeek;
      if (recurrence.dayOfMonth) clickupRecurrence.day_of_month = [recurrence.dayOfMonth];
      if (recurrence.endType === 'after' && recurrence.endCount) {
        clickupRecurrence.end_type = 'after';
        clickupRecurrence.end_count = recurrence.endCount;
      }
      if (recurrence.endType === 'on_date' && recurrence.endDate) {
        clickupRecurrence.end_type = 'on_date';
        clickupRecurrence.end_date = new Date(recurrence.endDate).getTime();
      }

      return await api.setTaskRecurrence(taskId, clickupRecurrence);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading };
}

export function getRecurrenceLabel(recurrence?: TaskRecurrence | null): string | null {
  if (!recurrence || !recurrence.enabled) return null;

  const interval = recurrence.interval || 1;
  const freq = recurrence.frequency;

  let label = '';
  if (interval === 1) {
    label = freq === 'daily' ? 'Daily'
      : freq === 'weekly' ? 'Weekly'
      : freq === 'monthly' ? 'Monthly'
      : 'Yearly';
  } else {
    label = `Every ${interval} ${
      freq === 'daily' ? 'days'
      : freq === 'weekly' ? 'weeks'
      : freq === 'monthly' ? 'months'
      : 'years'
    }`;
  }

  if (recurrence.day_of_week?.length) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    label += ` on ${recurrence.day_of_week.map(d => dayNames[d]).join(', ')}`;
  }

  return label;
}
