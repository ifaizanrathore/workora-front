'use client';

import { useState, useEffect } from 'react';
import { getCountdown, CountdownTime } from '@/lib/utils';

export function useCountdown(targetDate: string | number | Date | null | undefined) {
  const [countdown, setCountdown] = useState<CountdownTime | null>(null);

  useEffect(() => {
    if (!targetDate) {
      setCountdown(null);
      return;
    }

    // Initial calculation
    setCountdown(getCountdown(targetDate));

    // Update every second
    const interval = setInterval(() => {
      setCountdown(getCountdown(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return countdown;
}