'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Goal } from '@/types';

export function useGoals(teamId: string | null) {
  const [data, setData] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!teamId) {
      setData([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const goals = await api.getGoals(teamId);
      setData(Array.isArray(goals) ? goals : []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch goals'));
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return { data, isLoading, error, refetch: fetchGoals };
}

export function useGoal(goalId: string | null) {
  const [data, setData] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchGoal = useCallback(async () => {
    if (!goalId) {
      setData(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getGoal(goalId);
      setData(response?.goal || response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch goal'));
    } finally {
      setIsLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  return { data, isLoading, error, refetch: fetchGoal };
}
