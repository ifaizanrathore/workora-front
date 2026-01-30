'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, Task as ApiTask } from '@/lib/api';

export function useTask(taskId?: string | null) {
  const [data, setData] = useState<ApiTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTask = useCallback(async () => {
    if (!taskId) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const task = await api.getTask(taskId);
      setData(task);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch task'));
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  return { data, isLoading, error, refetch: fetchTask };
}