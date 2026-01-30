'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export function useComments(taskId?: string | null) {
  const [data, setData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchComments = useCallback(async () => {
    if (!taskId) {
      setData([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const comments = await api.getTaskComments(taskId);
      setData(comments);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch comments'));
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { data, isLoading, error, refetch: fetchComments };
}