'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Dependency, LinkedTask } from '@/types';

export interface DependenciesData {
  dependencies: Dependency[];
  linked_tasks: LinkedTask[];
}

export function useDependencies(taskId: string | null) {
  const [data, setData] = useState<DependenciesData>({ dependencies: [], linked_tasks: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDependencies = useCallback(async () => {
    if (!taskId) {
      setData({ dependencies: [], linked_tasks: [] });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const task = await api.getTask(taskId);
      setData({
        dependencies: (task as any).dependencies || [],
        linked_tasks: (task as any).linked_tasks || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dependencies'));
      setData({ dependencies: [], linked_tasks: [] });
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  return { data, isLoading, error, refetch: fetchDependencies };
}

export function useAddDependency() {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async (params: {
    taskId: string;
    depends_on?: string;
    dependency_of?: string;
    type?: number;
  }) => {
    setIsLoading(true);
    try {
      await api.addDependency(params.taskId, {
        depends_on: params.depends_on,
        dependency_of: params.dependency_of,
        type: params.type,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading };
}

export function useRemoveDependency() {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async (params: {
    taskId: string;
    depends_on?: string;
    dependency_of?: string;
  }) => {
    setIsLoading(true);
    try {
      await api.deleteDependency(params.taskId, {
        depends_on: params.depends_on,
        dependency_of: params.dependency_of,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading };
}

export function useAddTaskLink() {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async (params: { taskId: string; linksTo: string }) => {
    setIsLoading(true);
    try {
      await api.addTaskLink(params.taskId, params.linksTo);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading };
}

export function useRemoveTaskLink() {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async (params: { taskId: string; linksTo: string }) => {
    setIsLoading(true);
    try {
      await api.deleteTaskLink(params.taskId, params.linksTo);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading };
}
