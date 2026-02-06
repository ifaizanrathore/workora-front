'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// BASE SKELETON COMPONENT
// ============================================================

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'rounded' | 'text';
  animation?: 'pulse' | 'shimmer' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'default',
  animation = 'pulse',
  ...props
}) => {
  const variants = {
    default: 'rounded',
    circular: 'rounded-full',
    rounded: 'rounded-lg',
    text: 'rounded h-4',
  };

  const animations = {
    pulse: 'animate-pulse',
    shimmer: 'skeleton-shimmer',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-gray-200',
        variants[variant],
        animations[animation],
        className
      )}
      {...props}
    />
  );
};

// ============================================================
// SKELETON PRIMITIVES
// ============================================================

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className 
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')}
      />
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }> = ({ 
  size = 'md',
  className 
}) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  return <Skeleton variant="circular" className={cn(sizes[size], className)} />;
};

export const SkeletonButton: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md',
  className 
}) => {
  const sizes = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
  };

  return <Skeleton variant="rounded" className={cn(sizes[size], className)} />;
};

export const SkeletonBadge: React.FC<{ className?: string }> = ({ className }) => (
  <Skeleton className={cn('h-5 w-16 rounded-full', className)} />
);

export const SkeletonInput: React.FC<{ className?: string }> = ({ className }) => (
  <Skeleton className={cn('h-10 w-full rounded-lg', className)} />
);

// ============================================================
// TASK ROW SKELETON
// ============================================================

export const SkeletonTaskRow: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex items-center gap-3 px-4 py-3 border-b border-gray-100', className)}>
    {/* Checkbox */}
    <Skeleton className="h-5 w-5 rounded" />
    
    {/* Task info */}
    <div className="flex-1 min-w-0">
      <Skeleton className="h-4 w-3/4 mb-1.5" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    
    {/* Assignee */}
    <SkeletonAvatar size="sm" />
    
    {/* Status */}
    <SkeletonBadge />
    
    {/* Priority */}
    <Skeleton className="h-4 w-4 rounded" />
    
    {/* Due date */}
    <Skeleton className="h-4 w-16" />
    
    {/* Timer */}
    <Skeleton className="h-5 w-14 rounded" />
  </div>
);

// ============================================================
// TASK LIST SKELETON
// ============================================================

export const SkeletonTaskList: React.FC<{ rows?: number; showHeader?: boolean }> = ({ 
  rows = 8,
  showHeader = true 
}) => (
  <div className="bg-white rounded-lg border border-gray-200">
    {/* Header */}
    {showHeader && (
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    )}
    
    {/* Group Header */}
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
      <Skeleton className="h-4 w-4 rounded" />
      <SkeletonBadge className="w-20" />
      <Skeleton className="h-4 w-6 rounded-full" />
    </div>
    
    {/* Task Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonTaskRow key={i} />
    ))}
  </div>
);

// ============================================================
// SIDEBAR SKELETON
// ============================================================

export const SkeletonSidebar: React.FC = () => (
  <div className="w-64 h-screen bg-white border-r border-gray-200 p-4 space-y-6">
    {/* Logo */}
    <div className="flex items-center gap-2 px-2">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <Skeleton className="h-6 w-24" />
    </div>
    
    {/* Search */}
    <Skeleton className="h-9 w-full rounded-lg" />
    
    {/* Nav Items */}
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
    
    {/* Divider */}
    <div className="border-t border-gray-200 pt-4">
      <Skeleton className="h-3 w-16 mb-3 ml-3" />
      
      {/* Workspaces */}
      <div className="space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-4 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
    
    {/* Spaces */}
    <div className="space-y-1">
      <Skeleton className="h-3 w-12 mb-3 ml-3" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2 ml-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
    
    {/* User */}
    <div className="absolute bottom-4 left-4 right-4">
      <div className="flex items-center gap-3 p-2 rounded-lg">
        <SkeletonAvatar size="md" />
        <div className="flex-1">
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </div>
  </div>
);

// ============================================================
// HEADER SKELETON
// ============================================================

export const SkeletonHeader: React.FC = () => (
  <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
    {/* Left */}
    <div className="flex items-center gap-4">
      <Skeleton className="h-8 w-8 rounded" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </div>
    
    {/* Center - Search */}
    <Skeleton className="h-9 w-96 rounded-lg" />
    
    {/* Right */}
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded" />
      <Skeleton className="h-8 w-8 rounded" />
      <Skeleton className="h-8 w-8 rounded" />
      <SkeletonAvatar size="md" />
    </div>
  </div>
);

// ============================================================
// DASHBOARD CARDS SKELETON
// ============================================================

export const SkeletonStatCard: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <div className="flex items-start justify-between mb-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-8 w-16 mb-2" />
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-12 rounded-full" />
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);

export const SkeletonStatsGrid: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonStatCard key={i} />
    ))}
  </div>
);

// ============================================================
// TASK DETAIL MODAL SKELETON
// ============================================================

export const SkeletonTaskDetail: React.FC = () => (
  <div className="flex h-full">
    {/* Left Panel */}
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-8 w-20 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
      
      {/* Countdown */}
      <Skeleton className="h-6 w-40 rounded-full" />
      
      {/* Title */}
      <Skeleton className="h-8 w-3/4" />
      
      {/* Timer Display */}
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-16 rounded-lg" />
        ))}
      </div>
      
      {/* Fields */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-32 rounded" />
          </div>
        ))}
      </div>
      
      {/* Tags */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBadge key={i} className="w-20" />
        ))}
      </div>
      
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 pb-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      
      {/* Checklist */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>
    </div>
    
    {/* Right Panel */}
    <div className="w-80 border-l border-gray-200 p-4 space-y-4">
      <Skeleton className="h-6 w-20" />
      
      {/* Activity Items */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <SkeletonAvatar size="sm" />
          <div className="flex-1">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
      
      {/* Comment Input */}
      <div className="absolute bottom-4 left-4 right-4">
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  </div>
);

// ============================================================
// PAGE SKELETONS
// ============================================================

export const SkeletonDashboardPage: React.FC = () => (
  <div className="flex min-h-screen bg-[#FAFBFC]">
    <SkeletonSidebar />
    <div className="flex-1 flex flex-col">
      <SkeletonHeader />
      <div className="flex-1 p-6 space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <SkeletonButton size="md" />
        </div>
        
        {/* Stats */}
        <SkeletonStatsGrid />
        
        {/* Task List */}
        <SkeletonTaskList rows={6} />
      </div>
    </div>
  </div>
);

export const SkeletonHomePage: React.FC = () => (
  <div className="p-6 space-y-6">
    {/* Welcome */}
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex items-center gap-3">
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </div>
    
    {/* Stats */}
    <SkeletonStatsGrid />
    
    {/* Quick Actions */}
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
          <Skeleton className="h-10 w-10 rounded-lg mb-4" />
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
    
    {/* Recent Tasks */}
    <div>
      <Skeleton className="h-6 w-32 mb-4" />
      <SkeletonTaskList rows={5} showHeader={false} />
    </div>
  </div>
);

export const SkeletonTasksPage: React.FC = () => (
  <div className="p-6 space-y-4">
    {/* Toolbar */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
        <SkeletonButton />
      </div>
    </div>
    
    {/* Task List */}
    <SkeletonTaskList rows={10} />
  </div>
);

export const SkeletonSettingsPage: React.FC = () => (
  <div className="p-6 max-w-4xl mx-auto space-y-6">
    {/* Header */}
    <div>
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-4 w-64" />
    </div>
    
    {/* Settings Sections */}
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <Skeleton className="h-6 w-40 mb-4" />
        
        {Array.from({ length: 3 }).map((_, j) => (
          <div key={j} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

// ============================================================
// CREATE TASK MODAL SKELETON
// ============================================================

export const SkeletonCreateTaskForm: React.FC = () => (
  <div className="space-y-5">
    {/* List Selector */}
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-4 w-8" />
      <Skeleton className="h-8 w-32 rounded-lg" />
    </div>

    {/* Task Name Input */}
    <div>
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>

    {/* Description Button */}
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-4 w-24" />
    </div>

    {/* Task Details Label */}
    <Skeleton className="h-4 w-20" />

    {/* Field Buttons Row */}
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-10 w-24 rounded-lg" />
      <Skeleton className="h-10 w-24 rounded-lg" />
      <Skeleton className="h-10 w-28 rounded-lg" />
      <Skeleton className="h-10 w-24 rounded-lg" />
      <Skeleton className="h-10 w-20 rounded-lg" />
      <Skeleton className="h-10 w-10 rounded-lg" />
    </div>
  </div>
);

// ============================================================
// PANEL SKELETONS (Activity, Comments, Hashtags)
// ============================================================

export const SkeletonActivityPanel: React.FC<{ items?: number }> = ({ items = 6 }) => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>

    {/* Activity Items */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <SkeletonAvatar size="sm" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            {i % 2 === 0 && <Skeleton className="h-4 w-3/4 mt-1" />}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonCommentsPanel: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-8 rounded-full" />
      </div>
    </div>

    {/* Comments */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className={cn('flex gap-3', i % 3 === 0 ? 'flex-row-reverse' : '')}>
          <SkeletonAvatar size="sm" />
          <div className={cn('flex-1 max-w-[80%]', i % 3 === 0 ? 'text-right' : '')}>
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton
              className={cn(
                'h-16 rounded-xl',
                i % 3 === 0 ? 'bg-purple-100' : 'bg-gray-100'
              )}
            />
          </div>
        </div>
      ))}
    </div>

    {/* Input */}
    <div className="p-3 border-t border-gray-100">
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  </div>
);

export const SkeletonHashtagsPanel: React.FC = () => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-14 rounded" />
      </div>
    </div>

    {/* Search */}
    <div className="px-4 py-3">
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>

    {/* Hashtag Pills */}
    <div className="px-4 pb-3">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
    </div>

    {/* Filtered Messages */}
    <div className="flex-1 overflow-y-auto px-4 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <SkeletonAvatar size="sm" />
          <div className="flex-1">
            <Skeleton className="h-3 w-24 mb-1" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>

    {/* Input */}
    <div className="p-3 border-t border-gray-100">
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  </div>
);

export const SkeletonLinksPanel: React.FC = () => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>

    {/* Links */}
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// LOADING WRAPPER COMPONENT
// ============================================================

interface LoadingWrapperProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  isLoading,
  skeleton,
  children,
}) => {
  if (isLoading) {
    return <>{skeleton}</>;
  }
  return <>{children}</>;
};

// ============================================================
// EXPORTS
// ============================================================

export default Skeleton;