'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, Task as ApiTask } from '@/lib/api';

export function useTasks(listId?: string | null) {
  const [data, setData] = useState<ApiTask[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!listId) {
      setData([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tasks = await api.getTasks(listId);
      setData(tasks);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
    } finally {
      setIsLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { data, isLoading, error, refetch: fetchTasks };
}