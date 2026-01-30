'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  profilePicture?: string;
  color?: string;
  initials?: string;
  role?: number;
  custom_role?: string | null;
  last_active?: string;
  date_joined?: string;
  timezone?: string;
}

interface UseProfileOptions {
  enabled?: boolean;
  retry?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

interface UseProfileReturn {
  data: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useProfile(options: UseProfileOptions = {}): UseProfileReturn {
  const { 
    enabled = true, 
    retry = true, 
    retryCount = 3,
    retryDelay = 1000 
  } = options;

  const [data, setData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const retryAttempts = useRef(0);
  const isMounted = useRef(true);

  const fetchProfile = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    const attemptFetch = async (): Promise<void> => {
      try {
        const profile = await api.getProfile();
        
        if (isMounted.current) {
          setData(profile);
          retryAttempts.current = 0;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch profile');
        
        if (retry && retryAttempts.current < retryCount && isMounted.current) {
          retryAttempts.current += 1;
          
          // Wait before retrying with exponential backoff
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryAttempts.current));
          
          if (isMounted.current) {
            return attemptFetch();
          }
        } else if (isMounted.current) {
          setError(error);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    await attemptFetch();
  }, [enabled, retry, retryCount, retryDelay]);

  useEffect(() => {
    isMounted.current = true;
    fetchProfile();

    return () => {
      isMounted.current = false;
    };
  }, [fetchProfile]);

  return { data, isLoading, error, refetch: fetchProfile };
}

export type { UserProfile, UseProfileOptions, UseProfileReturn };