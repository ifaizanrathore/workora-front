'use client';

import React from 'react';
import {
  FileText,
  ListTodo,
  MessageSquare,
  Users,
  Tag,
  Link2,
  Clock,
  Search,
  FolderOpen,
  Inbox,
  Calendar,
  Bell,
  Settings,
  Plus,
  Target,
  Repeat,
  GitBranch,
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================
// BASE EMPTY STATE COMPONENT
// ============================================================

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: {
      container: 'py-6',
      icon: 'w-10 h-10',
      iconWrapper: 'w-12 h-12 mb-3',
      title: 'text-sm font-medium',
      description: 'text-xs',
      button: 'px-3 py-1.5 text-xs',
    },
    md: {
      container: 'py-12',
      icon: 'w-8 h-8',
      iconWrapper: 'w-16 h-16 mb-4',
      title: 'text-base font-semibold',
      description: 'text-sm',
      button: 'px-4 py-2 text-sm',
    },
    lg: {
      container: 'py-16',
      icon: 'w-12 h-12',
      iconWrapper: 'w-20 h-20 mb-5',
      title: 'text-xl font-bold',
      description: 'text-base',
      button: 'px-5 py-2.5 text-sm',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center justify-center text-center ${classes.container} ${className}`}>
      {icon && (
        <div className={`${classes.iconWrapper} rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
          <div className={`${classes.icon} text-gray-400 dark:text-gray-500`}>
            {icon}
          </div>
        </div>
      )}
      <h3 className={`${classes.title} text-gray-900 dark:text-white mb-1`}>
        {title}
      </h3>
      <p className={`${classes.description} text-gray-500 dark:text-gray-400 max-w-sm mb-4`}>
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className={`${classes.button} font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 rounded-lg transition-colors inline-flex items-center gap-2`}
            >
              <Plus className="w-4 h-4" />
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={`${classes.button} font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors`}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// PRE-BUILT EMPTY STATES
// ============================================================

interface PresetEmptyStateProps {
  onAction?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// No Tasks
export const EmptyTasks: React.FC<PresetEmptyStateProps> = ({ onAction, className, size }) => (
  <EmptyState
    icon={<ListTodo className="w-full h-full" />}
    title="No tasks yet"
    description="Create your first task to get started with managing your work"
    action={onAction ? { label: 'Create Task', onClick: onAction } : undefined}
    className={className}
    size={size}
  />
);

// No Search Results
export const EmptySearchResults: React.FC<PresetEmptyStateProps & { query?: string }> = ({
  query,
  onAction,
  className,
  size
}) => (
  <EmptyState
    icon={<Search className="w-full h-full" />}
    title="No results found"
    description={query ? `No results found for "${query}". Try a different search term.` : 'Try searching for something else'}
    secondaryAction={onAction ? { label: 'Clear Search', onClick: onAction } : undefined}
    className={className}
    size={size}
  />
);

// No Comments
export const EmptyComments: React.FC<PresetEmptyStateProps> = ({ onAction, className, size }) => (
  <EmptyState
    icon={<MessageSquare className="w-full h-full" />}
    title="No comments yet"
    description="Start a discussion by adding the first comment"
    action={onAction ? { label: 'Add Comment', onClick: onAction } : undefined}
    className={className}
    size={size}
  />
);

// No Assignees
export const EmptyAssignees: React.FC<PresetEmptyStateProps> = ({ onAction, className, size }) => (
  <EmptyState
    icon={<Users className="w-full h-full" />}
    title="No one assigned"
    description="Assign team members to this task"
    action={onAction ? { label: 'Assign', onClick: onAction } : undefined}
    className={className}
    size={size}
  />
);

// No Tags
export const EmptyTags: React.FC<PresetEmptyStateProps> = ({ onAction, className, size }) => (
  <EmptyState
    icon={<Tag className="w-full h-full" />}
    title="No tags"
    description="Add tags to organize and categorize this task"
    action={onAction ? { label: 'Add Tag', onClick: onAction } : undefined}
    className={className}
    size={size}
  />
);

// No Attachments/Links
export const EmptyAttachments: React.FC<PresetEmptyStateProps> = ({ onAction, className, size }) => (
  <EmptyState
    icon={<Link2 className="w-full h-full" />}
    title="No attachments"
    description="Add links or files to this task"
    action={onAction ? { label: 'Add Link', onClick: onAction } : undefined}
    className={className}
    size={size}
  />
);

// No Activity
export const EmptyActivity: React.FC<PresetEmptyStateProps> = ({ className, size }) => (
  <EmptyState
    icon={<Clock className="w-full h-full" />}
    title="No activity yet"
    description="Activity will appear here as changes are made"
    className={className}
    size={size}
  />
);

// No Projects/Folders
export const EmptyProjects: React.FC<PresetEmptyStateProps> = ({ onAction, className, size }) => (
  <EmptyState
    icon={<FolderOpen className="w-full h-full" />}
    title="No projects"
    description="Create a project to organize your tasks"
    action={onAction ? { label: 'Create Project', onClick: onAction } : undefined}
    className={className}
    size={size}
  />
);

// Empty Inbox
export const EmptyInbox: React.FC<PresetEmptyStateProps> = ({ className, size }) => (
  <EmptyState
    icon={<Inbox className="w-full h-full" />}
    title="Inbox zero!"
    description="You're all caught up. Nice work!"
    className={className}
    size={size}
  />
);

// No Upcoming
export const EmptyUpcoming: React.FC<PresetEmptyStateProps> = ({ onAction, className, size }) => (
  <EmptyState
    icon={<Calendar className="w-full h-full" />}
    title="Nothing scheduled"
    description="No upcoming tasks or deadlines"
    action={onAction ? { label: 'Create Task', onClick: onAction } : undefined}
    className={className}
    size={size}
  />
);

// No Notifications
export const EmptyNotifications: React.FC<PresetEmptyStateProps> = ({ className, size }) => (
  <EmptyState
    icon={<Bell className="w-full h-full" />}
    title="No notifications"
    description="You're all caught up!"
    className={className}
    size={size}
  />
);

// No Documents
export const EmptyDocuments: React.FC<PresetEmptyStateProps> = ({ onAction, className, size }) => (
  <EmptyState
    icon={<FileText className="w-full h-full" />}
    title="No documents"
    description="Add documents to this task for reference"
    action={onAction ? { label: 'Add Document', onClick: onAction } : undefined}
    className={className}
    size={size}
  />
);

// No Dependencies
export const EmptyDependencies: React.FC<PresetEmptyStateProps> = ({ onAction, className, size }) => (
  <EmptyState
    icon={<GitBranch className="w-full h-full" />}
    title="No dependencies"
    description="Add dependencies to track task relationships"
    action={onAction ? { label: 'Add Dependency', onClick: onAction } : undefined}
    className={className}
    size={size}
  />
);

// No Goals
export const EmptyGoals: React.FC<PresetEmptyStateProps> = ({ onAction, className, size }) => (
  <EmptyState
    icon={<Target className="w-full h-full" />}
    title="No goals yet"
    description="Create goals to track progress and align your team"
    action={onAction ? { label: 'Create Goal', onClick: onAction } : undefined}
    className={className}
    size={size}
  />
);

// No Recurrence
export const EmptyRecurring: React.FC<PresetEmptyStateProps> = ({ onAction, className, size }) => (
  <EmptyState
    icon={<Repeat className="w-full h-full" />}
    title="No recurrence set"
    description="Set up a recurring schedule for this task"
    action={onAction ? { label: 'Set Recurring', onClick: onAction } : undefined}
    className={className}
    size={size}
  />
);

// Generic Error State
export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading. Please try again.',
  onRetry,
  className = ''
}) => (
  <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
    <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
      <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

// Loading State
export const LoadingState: React.FC<{
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ message = 'Loading...', className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: { spinner: 'w-6 h-6', text: 'text-xs' },
    md: { spinner: 'w-8 h-8', text: 'text-sm' },
    lg: { spinner: 'w-12 h-12', text: 'text-base' },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className={`${classes.spinner} relative mb-3`}>
        <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-700" />
        <div className="absolute inset-0 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
      </div>
      <p className={`${classes.text} text-gray-500 dark:text-gray-400`}>{message}</p>
    </div>
  );
};

export default EmptyState;
