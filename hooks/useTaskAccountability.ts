'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { TaskAccountability } from '@/types';

export function useTaskAccountability(taskId?: string | null) {
  const [data, setData] = useState<TaskAccountability | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccountability = useCallback(async () => {
    if (!taskId) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accountability = await api.getTaskAccountability(taskId);
      setData(accountability);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch accountability'));
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchAccountability();
  }, [fetchAccountability]);

  return { data, isLoading, error, refetch: fetchAccountability };
}