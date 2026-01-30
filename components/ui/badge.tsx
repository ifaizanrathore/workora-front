'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-text-secondary',
        primary: 'bg-primary-lighter text-primary',
        secondary: 'bg-gray-100 text-text-secondary',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-amber-100 text-amber-700',
        error: 'bg-red-100 text-red-700',
        info: 'bg-blue-100 text-blue-700',
        urgent: 'bg-red-500 text-white',
        high: 'bg-amber-500 text-white',
        normal: 'bg-blue-500 text-white',
        low: 'bg-green-500 text-white',
        outline: 'border border-border text-text-secondary bg-transparent',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-[10px]',
        md: 'px-2 py-0.5 text-xs',
        lg: 'px-2.5 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot, dotColor, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {dot && (
          <span
            className="mr-1.5 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: dotColor || 'currentColor' }}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Priority Badge
interface PriorityBadgeProps {
  priority?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  if (!priority) return null;

  const priorityLower = priority.toLowerCase();
  
  // Map to valid variant or default to 'normal'
  const variantMap: Record<string, 'urgent' | 'high' | 'normal' | 'low'> = {
    urgent: 'urgent',
    high: 'high',
    normal: 'normal',
    low: 'low',
    '1': 'urgent',
    '2': 'high',
    '3': 'normal',
    '4': 'low',
  };

  const variant = variantMap[priorityLower] || 'normal';
  
  // Get proper label
  const labelMap: Record<string, string> = {
    urgent: 'Urgent',
    high: 'High',
    normal: 'Normal',
    low: 'Low',
    '1': 'Urgent',
    '2': 'High',
    '3': 'Normal',
    '4': 'Low',
  };
  
  const label = labelMap[priorityLower] || (priority.charAt(0).toUpperCase() + priority.slice(1));

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
};

// Status Badge
interface StatusBadgeProps {
  status: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, color, size = 'md' }) => {
  return (
    <Badge variant="outline" size={size} dot dotColor={color}>
      {status}
    </Badge>
  );
};

// Tag Badge
interface TagBadgeProps {
  name: string;
  bgColor?: string;
  fgColor?: string;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const TagBadge: React.FC<TagBadgeProps> = ({
  name,
  bgColor = '#E8E6FA',
  fgColor = '#6E62E5',
  onRemove,
  size = 'md',
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded font-medium',
        size === 'sm' && 'px-1.5 py-0.5 text-[10px]',
        size === 'md' && 'px-2 py-0.5 text-xs',
        size === 'lg' && 'px-2.5 py-1 text-sm'
      )}
      style={{ backgroundColor: bgColor, color: fgColor }}
    >
      #{name}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 transition-opacity"
        >
          ×
        </button>
      )}
    </span>
  );
};

// Timer Badge
interface TimerBadgeProps {
  timeLeft: string;
  isOverdue?: boolean;
  isWarning?: boolean;
}

const TimerBadge: React.FC<TimerBadgeProps> = ({ timeLeft, isOverdue, isWarning }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
        isOverdue && 'bg-red-50 text-red-600',
        isWarning && !isOverdue && 'bg-amber-50 text-amber-600',
        !isOverdue && !isWarning && 'bg-blue-50 text-blue-600'
      )}
    >
      <span className={cn(
        'w-2 h-2 rounded-full animate-pulse',
        isOverdue && 'bg-red-500',
        isWarning && !isOverdue && 'bg-amber-500',
        !isOverdue && !isWarning && 'bg-blue-500'
      )} />
      {timeLeft}
    </span>
  );
};

export { Badge, badgeVariants, PriorityBadge, StatusBadge, TagBadge, TimerBadge };