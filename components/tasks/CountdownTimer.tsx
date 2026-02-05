'use client';

import React from 'react';
import { useCountdown } from '@/hooks';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string | number | Date;
  className?: string;
  showLabels?: boolean;
  showDueDate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Format due date for display
const formatDueDate = (date: string | number | Date): string => {
  let d: Date;
  if (typeof date === 'string') {
    // Handle string timestamps like "1737619200000"
    const parsed = parseInt(date, 10);
    d = !isNaN(parsed) && parsed > 1e12 ? new Date(parsed) : new Date(date);
  } else if (typeof date === 'number') {
    d = new Date(date);
  } else {
    d = date;
  }

  if (isNaN(d.getTime())) return '';

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  return d.toLocaleDateString('en-US', options);
};

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  className,
  showLabels = true,
  showDueDate = true,
  size = 'md',
}) => {
  const countdown = useCountdown(targetDate);

  if (!countdown) return null;

  const { days, hours, minutes, seconds, isOverdue } = countdown;
  const dueDateStr = formatDueDate(targetDate);

  const sizeClasses = {
    sm: {
      container: 'gap-1',
      box: 'w-10 h-10',
      number: 'text-sm font-semibold',
      label: 'text-[10px]',
    },
    md: {
      container: 'gap-2',
      box: 'w-14 h-14',
      number: 'text-lg font-bold',
      label: 'text-xs',
    },
    lg: {
      container: 'gap-3',
      box: 'w-20 h-20',
      number: 'text-2xl font-bold',
      label: 'text-sm',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Due Date Display */}
      {showDueDate && dueDateStr && (
        <div className="flex items-center gap-1.5 mb-2">
          <Calendar className={cn(
            'text-text-tertiary',
            size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
          )} />
          <span className={cn(
            'text-text-secondary font-medium',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}>
            {dueDateStr}
          </span>
        </div>
      )}

      <div className={cn('flex items-start', sizes.container)}>
        {/* Label */}
        {showLabels && (
          <div className="flex flex-col justify-center mr-2">
            <span className={cn('text-text-secondary font-medium', size === 'sm' ? 'text-xs' : 'text-sm')}>
              Time left
            </span>
            <span className={cn('text-text-tertiary', size === 'sm' ? 'text-[10px]' : 'text-xs')}>
              to deliver
            </span>
          </div>
        )}

        {/* Days */}
        <TimeBox
          value={days}
          label="Days"
          isOverdue={isOverdue}
          sizes={sizes}
        />

        <Separator size={size} />

        {/* Hours */}
        <TimeBox
          value={hours}
          label="Hours"
          isOverdue={isOverdue}
          sizes={sizes}
        />

        <Separator size={size} />

        {/* Minutes */}
        <TimeBox
          value={minutes}
          label="Minutes"
          isOverdue={isOverdue}
          sizes={sizes}
        />

        <Separator size={size} />

        {/* Seconds */}
        <TimeBox
          value={seconds}
          label="Seconds"
          isOverdue={isOverdue}
          sizes={sizes}
        />
      </div>
    </div>
  );
};

// Time Box Component
const TimeBox: React.FC<{
  value: number;
  label: string;
  isOverdue: boolean;
  sizes: { box: string; number: string; label: string };
}> = ({ value, label, isOverdue, sizes }) => (
  <div className="flex flex-col items-center">
    <div
      className={cn(
        'flex items-center justify-center rounded-lg border',
        sizes.box,
        isOverdue
          ? 'bg-red-50 border-red-200 text-red-600'
          : 'bg-white border-border text-text-primary'
      )}
    >
      <span className={sizes.number}>
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className={cn('mt-1 text-text-tertiary', sizes.label)}>
      {label}
    </span>
  </div>
);

// Separator
const Separator: React.FC<{ size: 'sm' | 'md' | 'lg' }> = ({ size }) => (
  <div className={cn(
    'flex items-center text-text-tertiary font-medium',
    size === 'sm' && 'text-sm',
    size === 'md' && 'text-lg',
    size === 'lg' && 'text-xl'
  )}>
    |
  </div>
);

// Inline Timer Badge (for task list)
interface TimerBadgeInlineProps {
  targetDate: string | number | Date;
  className?: string;
}

export const TimerBadgeInline: React.FC<TimerBadgeInlineProps> = ({
  targetDate,
  className,
}) => {
  const countdown = useCountdown(targetDate);

  if (!countdown) return null;

  const { isOverdue, totalSeconds } = countdown;
  const formattedTime = countdown.text;
  const isWarning = totalSeconds > 0 && totalSeconds < 86400; // Less than 1 day

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
        isOverdue && 'bg-red-50 text-red-600',
        isWarning && !isOverdue && 'bg-amber-50 text-amber-600',
        !isOverdue && !isWarning && 'bg-blue-50 text-blue-600',
        className
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          isOverdue && 'bg-red-500 animate-pulse',
          isWarning && !isOverdue && 'bg-amber-500 animate-pulse',
          !isOverdue && !isWarning && 'bg-blue-500'
        )}
      />
      {formattedTime}
    </span>
  );
};

export default CountdownTimer;
