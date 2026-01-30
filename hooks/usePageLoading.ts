'use client';

import { useState, useEffect, useCallback } from 'react';

interface UsePageLoadingOptions {
  /** Minimum loading time in ms (prevents flash) */
  minLoadingTime?: number;
  /** Initial loading state */
  initialLoading?: boolean;
  /** Dependencies that trigger reload */
  dependencies?: any[];
  /** Async function to load data */
  loadFn?: () => Promise<void>;
}

interface UsePageLoadingReturn {
  isLoading: boolean;
  isFirstLoad: boolean;
  error: Error | null;
  startLoading: () => void;
  stopLoading: () => void;
  reload: () => Promise<void>;
}

/**
 * Hook for managing page loading states with skeleton support
 * 
 * @example
 * ```tsx
 * const { isLoading, reload } = usePageLoading({
 *   minLoadingTime: 500,
 *   loadFn: async () => {
 *     const data = await api.getData();
 *     setData(data);
 *   },
 *   dependencies: [listId],
 * });
 * 
 * if (isLoading) {
 *   return <SkeletonPage />;
 * }
 * ```
 */
export function usePageLoading({
  minLoadingTime = 300,
  initialLoading = true,
  dependencies = [],
  loadFn,
}: UsePageLoadingOptions = {}): UsePageLoadingReturn {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setIsFirstLoad(false);
  }, []);

  const reload = useCallback(async () => {
    if (!loadFn) {
      setIsLoading(false);
      return;
    }

    const startTime = Date.now();
    startLoading();

    try {
      await loadFn();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load'));
      console.error('Page loading error:', err);
    } finally {
      // Ensure minimum loading time for smooth UX
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadingTime - elapsed);

      if (remaining > 0) {
        setTimeout(stopLoading, remaining);
      } else {
        stopLoading();
      }
    }
  }, [loadFn, minLoadingTime, startLoading, stopLoading]);

  // Load on mount and when dependencies change
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    isLoading,
    isFirstLoad,
    error,
    startLoading,
    stopLoading,
    reload,
  };
}

/**
 * Hook for managing data loading with automatic state management
 */
export function useDataLoader<T>(
  fetchFn: () => Promise<T>,
  options: {
    dependencies?: any[];
    initialData?: T;
    minLoadingTime?: number;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const {
    dependencies = [],
    initialData,
    minLoadingTime = 300,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    const startTime = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load data');
      setError(error);
      onError?.(error);
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadingTime - elapsed);

      if (remaining > 0) {
        setTimeout(() => setIsLoading(false), remaining);
      } else {
        setIsLoading(false);
      }
    }
  }, [fetchFn, minLoadingTime, onSuccess, onError]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    data,
    isLoading,
    error,
    reload: load,
    setData,
  };
}

export default usePageLoading;