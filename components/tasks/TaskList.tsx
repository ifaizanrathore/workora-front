'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Filter,
  Search,
  LayoutList,
  LayoutGrid,
  FileText,
  Rss,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Check,
  X,
  Columns,
  ListTree,
  Users,
  MoreHorizontal,
  Settings,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types';
import { api } from '@/lib/api';
import { TaskListHeader, useColumns, defaultColumns, Column } from './TaskListHeader';
import { TaskRow } from './TaskRow';
import { StatusOption } from './CellDropdowns';
import { SkeletonTaskList } from '@/components/ui/skeleton';
import { useTaskStore } from '@/stores';

// Local type for available users (flexible)
interface AvailableUser {
  id: string | number;
  username?: string;
  email?: string;
  profilePicture?: string;
  color?: string;
}

// ============================================================
// TYPES
// ============================================================

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  listId?: string;
  workspaceId?: string;
  listName?: string;
  listColor?: string;
  onTaskClick?: (task: Task) => void;
  onTaskSelect?: (taskId: string, selected: boolean) => void;
  onAddTask?: () => void;
  onTaskUpdate?: () => void; // Callback to refresh tasks after update
  onTimerToggle?: (taskId: string) => void;
  selectedTasks?: string[];
  groupBy?: 'status' | 'priority' | 'assignee' | 'none';
  onGroupByChange?: (groupBy: 'status' | 'priority' | 'assignee' | 'none') => void;
  className?: string;
}

interface TaskGroup {
  id: string;
  name: string;
  color?: string;
  tasks: Task[];
}

// ============================================================
// VIEW TABS (List, Board, Form, Feed, + View)
// ============================================================

interface ViewTabsProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const ViewTabs: React.FC<ViewTabsProps> = ({ currentView, onViewChange }) => {
  const tabs = [
    { id: 'list', label: 'list', icon: LayoutList },
    { id: 'board', label: 'Board', icon: LayoutGrid },
    { id: 'form', label: 'Form', icon: FileText },
    { id: 'feed', label: 'Feed', icon: Rss },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-transparent">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors relative',
              isActive
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
            )}
          </button>
        );
      })}
      <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
        <Plus className="h-4 w-4" />
        View
      </button>
    </div>
  );
};

// ============================================================
// TOP TOOLBAR (Search, Hide, Customize, Add Task)
// ============================================================

interface TopToolbarProps {
  listName: string;
  onAddTask?: () => void;
  onSearchToggle: () => void;
  showSearch: boolean;
  onHideToggle: () => void;
  showHidePanel: boolean;
  currentView: string;
  onViewChange: (view: string) => void;
}

const TopToolbar: React.FC<TopToolbarProps> = ({
  listName,
  onAddTask,
  onSearchToggle,
  showSearch,
  onHideToggle,
  showHidePanel,
  currentView,
  onViewChange,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
      {/* Left - Title & View Tabs */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">{listName}</h1>
          <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
        <ViewTabs currentView={currentView} onViewChange={onViewChange} />
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSearchToggle}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors',
            showSearch
              ? 'text-purple-600 bg-purple-50'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          <Search className="h-4 w-4" />
          Search
        </button>
        <button
          onClick={onHideToggle}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors',
            showHidePanel
              ? 'text-purple-600 bg-purple-50'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Hide
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
          <Settings className="h-4 w-4" />
          Customize
        </button>
        {/* Add Task Button - Always visible */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Try prop first, then fall back to store
              if (onAddTask) {
                onAddTask();
              } else {
                // Direct store call as fallback
                useTaskStore.getState().openCreateModal();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add task
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// COLUMNS DROPDOWN
// ============================================================

interface ColumnsDropdownProps {
  columns: Column[];
  onToggleColumn: (columnId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ColumnsDropdown: React.FC<ColumnsDropdownProps> = ({
  columns,
  onToggleColumn,
  isOpen,
  onClose,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
    >
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
        Show/Hide Columns
      </div>
      {columns
        .filter((c) => !c.fixed)
        .map((column) => (
          <button
            key={column.id}
            onClick={() => onToggleColumn(column.id)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              {column.icon}
              <span>{column.label}</span>
            </div>
            {column.visible ? (
              <Eye className="h-4 w-4 text-purple-500" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-300" />
            )}
          </button>
        ))}
    </div>
  );
};

// ============================================================
// FILTER ROW (Group, Subtasks, Columns | Filter, Closed, Assignee, Search)
// ============================================================

interface FilterRowProps {
  groupBy: 'status' | 'priority' | 'assignee' | 'none';
  onGroupByChange: (groupBy: 'status' | 'priority' | 'assignee' | 'none') => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  filterCount?: number;
  showClosed: boolean;
  onToggleClosed: () => void;
  columns: Column[];
  onToggleColumn: (columnId: string) => void;
  showSearch: boolean;
}

const FilterRow: React.FC<FilterRowProps> = ({
  groupBy,
  onGroupByChange,
  onSearch,
  searchQuery,
  filterCount = 0,
  showClosed,
  onToggleClosed,
  columns,
  onToggleColumn,
  showSearch,
}) => {
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const groupDropdownRef = useRef<HTMLDivElement>(null);

  const groupOptions = [
    { id: 'status', label: 'Status' },
    { id: 'priority', label: 'Priority' },
    { id: 'assignee', label: 'Assignee' },
    { id: 'none', label: 'None' },
  ];

  const currentGroup = groupOptions.find((g) => g.id === groupBy)?.label || 'Status';

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(e.target as Node)) {
        setShowGroupDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50/50">
      {/* Left - Group, Subtasks, Columns */}
      <div className="flex items-center gap-2">
        {/* Group Dropdown */}
        <div className="relative" ref={groupDropdownRef}>
          <button
            onClick={() => setShowGroupDropdown(!showGroupDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ListTree className="h-4 w-4 text-gray-400" />
            Group: {currentGroup}
            <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 transition-transform', showGroupDropdown && 'rotate-180')} />
          </button>

          {showGroupDropdown && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {groupOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onGroupByChange(option.id as any);
                    setShowGroupDropdown(false);
                  }}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors',
                    groupBy === option.id && 'text-purple-600 bg-purple-50'
                  )}
                >
                  {option.label}
                  {groupBy === option.id && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Subtasks Button */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <ListTree className="h-4 w-4 text-gray-400" />
          Subtasks
        </button>

        {/* Columns Button */}
        <div className="relative">
          <button
            onClick={() => setShowColumnsDropdown(!showColumnsDropdown)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors',
              showColumnsDropdown
                ? 'text-purple-600 bg-purple-50 border-purple-200'
                : 'text-gray-700 bg-white border-gray-200 hover:bg-gray-50'
            )}
          >
            <Columns className="h-4 w-4 text-gray-400" />
            Columns
          </button>
          <ColumnsDropdown
            columns={columns}
            onToggleColumn={onToggleColumn}
            isOpen={showColumnsDropdown}
            onClose={() => setShowColumnsDropdown(false)}
          />
        </div>
      </div>

      {/* Right - Filter, Closed, Assignee, Search */}
      <div className="flex items-center gap-2">
        {/* Filter */}
        <button
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors',
            filterCount > 0
              ? 'text-purple-600 bg-purple-50 border-purple-200'
              : 'text-gray-700 bg-white border-gray-200 hover:bg-gray-50'
          )}
        >
          <Filter className="h-4 w-4" />
          {filterCount > 0 ? `${filterCount} Filter` : 'Filter'}
        </button>

        {/* Closed Toggle */}
        <button
          onClick={onToggleClosed}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors',
            showClosed
              ? 'text-purple-600 bg-purple-50 border-purple-200'
              : 'text-gray-700 bg-white border-gray-200 hover:bg-gray-50'
          )}
        >
          <Check className="h-4 w-4" />
          Closed
        </button>

        {/* Assignee Filter */}
        <button
          onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Users className="h-4 w-4 text-gray-400" />
          Assignee
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-purple-200 transition-all">
          <span className="text-xs font-medium text-white">U</span>
        </div>

        {/* Search Input */}
        {showSearch && (
          <div className="relative animate-in slide-in-from-right duration-200">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              autoFocus
              className="w-48 h-9 pl-9 pr-4 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// TASK GROUP HEADER
// ============================================================

interface TaskGroupHeaderProps {
  group: TaskGroup;
  isCollapsed: boolean;
  onToggle: () => void;
  onAddTask?: () => void;
  columns: Column[];
}

const TaskGroupHeader: React.FC<TaskGroupHeaderProps> = ({
  group,
  isCollapsed,
  onToggle,
  onAddTask,
  columns,
}) => {
  const totalWidth = columns.filter((c) => c.visible).reduce((sum, col) => sum + col.width, 0) + 60;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors group"
      onClick={onToggle}
      style={{ minWidth: totalWidth }}
    >
      {isCollapsed ? (
        <ChevronRight className="h-4 w-4 text-gray-400 transition-transform" />
      ) : (
        <ChevronDown className="h-4 w-4 text-gray-400 transition-transform" />
      )}

      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: group.color || '#9CA3AF' }}
      />

      <span className="text-sm font-semibold text-gray-700">{group.name}</span>

      <span className="text-xs font-medium text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
        {group.tasks.length}
      </span>

      {onAddTask && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddTask();
          }}
          className="ml-auto p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors opacity-0 group-hover:opacity-100"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// ============================================================
// ADD TASK ROW
// ============================================================

interface AddTaskRowProps {
  columns: Column[];
  onAdd: () => void;
  onQuickAdd?: (name: string) => Promise<void>;
  listId?: string;
}

const AddTaskRow: React.FC<AddTaskRowProps> = ({ columns, onAdd, onQuickAdd, listId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const totalWidth = columns.filter((c) => c.visible).reduce((sum, col) => sum + col.width, 0) + 60;

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleSubmit = async () => {
    if (!taskName.trim()) {
      setIsAdding(false);
      return;
    }

    if (onQuickAdd) {
      setIsSaving(true);
      try {
        await onQuickAdd(taskName.trim());
        setTaskName('');
        // Keep input open for rapid task creation
        inputRef.current?.focus();
      } catch (error) {
        console.error('Failed to create task:', error);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Fallback to modal
      onAdd();
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setTaskName('');
      setIsAdding(false);
    }
  };

  const handleBlur = () => {
    if (!taskName.trim()) {
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <div
        className="flex items-center w-full bg-purple-50/50 border-b border-purple-100"
        style={{ minWidth: totalWidth }}
      >
        <div className="w-10 flex items-center justify-center px-2 py-2.5">
          {isSaving ? (
            <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 text-purple-500" />
          )}
        </div>
        <div className="flex-1 py-1.5 pr-3">
          <input
            ref={inputRef}
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={isSaving}
            placeholder="Task name (Enter to save, Esc to cancel)"
            className={cn(
              'w-full px-3 py-1.5 text-sm rounded border border-purple-300 bg-white',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
              'placeholder:text-gray-400',
              isSaving && 'opacity-50'
            )}
          />
        </div>
        <button
          onClick={() => {
            setTaskName('');
            setIsAdding(false);
          }}
          className="p-2 mr-2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsAdding(true)}
      className="flex items-center w-full px-3 py-2.5 text-sm text-gray-400 hover:text-purple-600 hover:bg-purple-50/50 border-b border-gray-100 transition-colors group"
      style={{ minWidth: totalWidth }}
    >
      <div className="w-10 flex items-center justify-center">
        <Plus className="h-4 w-4 group-hover:text-purple-600 transition-colors" />
      </div>
      <span className="group-hover:text-purple-600 transition-colors">Add task...</span>
    </button>
  );
};

// ============================================================
// MAIN TASK LIST COMPONENT
// ============================================================

export const TaskList: React.FC<TaskListProps> = ({
  tasks: initialTasks,
  isLoading = false,
  listId,
  workspaceId,
  listName = 'Tasks',
  listColor = '#5B4FD1',
  onTaskClick,
  onTaskSelect,
  onAddTask,
  onTaskUpdate,
  onTimerToggle,
  selectedTasks = [],
  groupBy = 'status',
  onGroupByChange,
  className,
}) => {
  const { columns, updateColumns } = useColumns(defaultColumns);
  const { openTaskModal } = useTaskStore();

  // LOCAL TASKS STATE for optimistic updates
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  
  // Sync with parent tasks when they change
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Handle task click - open detail modal
  const handleTaskClick = useCallback((task: Task) => {
    // Use store to open modal
    openTaskModal(task);
    // Also call prop if provided
    onTaskClick?.(task);
  }, [openTaskModal, onTaskClick]);

  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [internalGroupBy, setInternalGroupBy] = useState(groupBy);
  const [currentView, setCurrentView] = useState('list');
  const [showSearch, setShowSearch] = useState(false);
  const [showHidePanel, setShowHidePanel] = useState(false);

  // Metadata for inline editing
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [members, setMembers] = useState<AvailableUser[]>([]);
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set());
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Timer state
  const [runningTimer, setRunningTimer] = useState<{
    taskId: string;
    startTime: number;
  } | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);

  // Update timer elapsed every second when running
  useEffect(() => {
    if (!runningTimer) {
      setTimerElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setTimerElapsed(Date.now() - runningTimer.startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [runningTimer]);

  // Check for running timer on mount
  useEffect(() => {
    const checkRunningTimer = async () => {
      if (!workspaceId) return;
      
      try {
        const timer = await api.getRunningTimer(workspaceId);
        if (timer?.data?.task?.id) {
          setRunningTimer({
            taskId: timer.data.task.id,
            startTime: parseInt(timer.data.start) || Date.now(),
          });
        }
      } catch (error) {
        // No running timer or error - that's fine
      }
    };
    
    checkRunningTimer();
  }, [workspaceId]);

  // Fetch statuses when listId changes
  useEffect(() => {
    const fetchStatuses = async () => {
      if (!listId) return;
      
      try {
        const fetchedStatuses = await api.getListStatuses(listId);
        setStatuses(fetchedStatuses);
      } catch (error) {
        console.error('Failed to fetch statuses:', error);
      }
    };

    fetchStatuses();
  }, [listId]);

  // Fetch members when workspaceId changes
  useEffect(() => {
    if (!workspaceId) return;
    
    let isCancelled = false;
    
    const fetchMembers = async () => {
      setLoadingMetadata(true);
      
      try {
        const fetchedMembers = await api.getMembers(workspaceId);
        
        if (isCancelled) return;
        
        if (fetchedMembers && fetchedMembers.length > 0) {
          setMembers(fetchedMembers);
        } else {
          setMembers([]);
        }
      } catch (error) {
        console.error('Failed to fetch members:', error);
        if (!isCancelled) {
          setMembers([]);
        }
      } finally {
        if (!isCancelled) {
          setLoadingMetadata(false);
        }
      }
    };

    fetchMembers();
    
    return () => {
      isCancelled = true;
    };
  }, [workspaceId]);

  // FALLBACK: If we have tasks but no members, try to get workspaceId from localStorage
  useEffect(() => {
    const fetchMembersFallback = async () => {
      if (members.length > 0) return;
      if (tasks.length === 0) return;
      if (workspaceId) return;
      
      try {
        const stored = localStorage.getItem('workora-workspace');
        if (stored) {
          const parsed = JSON.parse(stored);
          const storedWorkspaceId = parsed?.state?.currentWorkspace?.id;
          
          if (storedWorkspaceId) {
            const fetchedMembers = await api.getMembers(storedWorkspaceId);
            if (fetchedMembers && fetchedMembers.length > 0) {
              setMembers(fetchedMembers);
            }
          }
        }
      } catch (error) {
        console.error('Fallback members fetch failed:', error);
      }
    };
    
    const timer = setTimeout(fetchMembersFallback, 500);
    return () => clearTimeout(timer);
  }, [tasks.length, members.length, workspaceId]);

  // ============================================================
  // API UPDATE HANDLERS WITH OPTIMISTIC UPDATES
  // ============================================================

  const handleStatusChange = useCallback(async (taskId: string, status: StatusOption) => {
    setUpdatingTasks(prev => new Set(prev).add(taskId));

    // Store previous state for rollback
    const previousTasks = [...tasks];

    // OPTIMISTIC UPDATE - update local state immediately
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { 
            ...t, 
            status: { 
              ...t.status, 
              id: String(status.id || ''),
              status: status.status || '', 
              color: status.color || '#gray',
              type: status.type
            } 
          } 
        : t
    ));

    try {
      await api.updateTask(taskId, { status: status.status });
    } catch (error) {
      console.error('Failed to update status:', error);
      setTasks(previousTasks);
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [tasks]);

  const handlePriorityChange = useCallback(async (taskId: string, priority: number | null) => {
    setUpdatingTasks(prev => new Set(prev).add(taskId));

    const previousTasks = [...tasks];

    // OPTIMISTIC UPDATE - using ClickUp colors
    const priorityMap: Record<number, { id: string; priority: string; color: string }> = {
      1: { id: '1', priority: 'urgent', color: '#F42A2A' },
      2: { id: '2', priority: 'high', color: '#FFCC00' },
      3: { id: '3', priority: 'normal', color: '#6B7AFF' },
      4: { id: '4', priority: 'low', color: '#808080' },
    };
    
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, priority: priority ? priorityMap[priority] : undefined } 
        : t
    ));

    try {
      await api.updateTask(taskId, { priority });
    } catch (error) {
      console.error('Failed to update priority:', error);
      setTasks(previousTasks);
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [tasks]);

  const handleDueDateChange = useCallback(async (taskId: string, timestamp: number | null) => {
    setUpdatingTasks(prev => new Set(prev).add(taskId));

    const previousTasks = [...tasks];

    // OPTIMISTIC UPDATE
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, due_date: timestamp ? String(timestamp) : undefined } 
        : t
    ));

    try {
      await api.updateTask(taskId, { due_date: timestamp });
    } catch (error) {
      console.error('Failed to update due date:', error);
      setTasks(previousTasks);
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [tasks]);

  const handleAssigneesChange = useCallback(async (taskId: string, action: { add?: number[]; rem?: number[] }) => {
    setUpdatingTasks(prev => new Set(prev).add(taskId));

    const previousTasks = [...tasks];

    // OPTIMISTIC UPDATE
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      
      let newAssignees = [...(t.assignees || [])];
      
      if (action.add) {
        action.add.forEach(userId => {
          const user = members.find(m => Number(m.id) === userId);
          if (user && !newAssignees.some(a => Number(a.id) === userId)) {
            newAssignees.push({
              id: userId,
              username: user.username || '',
              email: user.email || '',
              profilePicture: user.profilePicture,
            });
          }
        });
      }
      
      if (action.rem) {
        newAssignees = newAssignees.filter(a => !action.rem?.includes(Number(a.id)));
      }
      
      return { ...t, assignees: newAssignees };
    }));

    try {
      await api.updateAssignees(taskId, action);
    } catch (error) {
      console.error('Failed to update assignees:', error);
      setTasks(previousTasks);
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [tasks, members]);

  // Handle task name change
  const handleNameChange = useCallback(async (taskId: string, name: string) => {
    setUpdatingTasks(prev => new Set(prev).add(taskId));
    const previousTasks = [...tasks];

    // OPTIMISTIC UPDATE
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, name } : t
    ));

    try {
      await api.updateTask(taskId, { name });
    } catch (error) {
      console.error('Failed to update task name:', error);
      setTasks(previousTasks);
      throw error; // Re-throw so the UI knows it failed
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [tasks]);

  // Handle quick add task
  const handleQuickAdd = useCallback(async (name: string) => {
    if (!listId) {
      console.error('Cannot create task without listId');
      return;
    }

    try {
      const newTask = await api.createTask({ listId, name });
      
      // Add to local state
      setTasks(prev => [...prev, newTask]);
      
      // Optionally refresh from server to get full task data
      onTaskUpdate?.();
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }, [listId, onTaskUpdate]);

  // Get workspaceId from storage if not provided
  const getWorkspaceId = useCallback(() => {
    if (workspaceId) return workspaceId;
    
    try {
      const stored = localStorage.getItem('workora-workspace');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.state?.currentWorkspace?.id;
      }
    } catch {
      return null;
    }
    return null;
  }, [workspaceId]);

  // Handle timer start
  const handleTimerStart = useCallback(async (taskId: string) => {
    const wsId = getWorkspaceId();
    if (!wsId) {
      console.error('Cannot start timer without workspaceId');
      return;
    }

    try {
      // Stop any running timer first
      if (runningTimer) {
        await api.stopTimer(wsId);
      }
      
      // Start new timer
      const result = await api.startTimer(wsId, taskId);
      
      setRunningTimer({
        taskId,
        startTime: parseInt(result.start) || Date.now(),
      });
      setTimerElapsed(0);
    } catch (error) {
      console.error('Failed to start timer:', error);
      throw error;
    }
  }, [getWorkspaceId, runningTimer]);

  // Handle timer stop
  const handleTimerStop = useCallback(async (taskId: string) => {
    const wsId = getWorkspaceId();
    if (!wsId) {
      console.error('Cannot stop timer without workspaceId');
      return;
    }

    try {
      await api.stopTimer(wsId);
      
      // Update local task with new time spent
      const elapsed = timerElapsed;
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, time_spent: (t.time_spent || 0) + elapsed }
          : t
      ));
      
      setRunningTimer(null);
      setTimerElapsed(0);
      
      // Refresh to get updated time data
      onTaskUpdate?.();
    } catch (error) {
      console.error('Failed to stop timer:', error);
      throw error;
    }
  }, [getWorkspaceId, timerElapsed, onTaskUpdate]);

  // ============================================================
  // NEW HANDLERS: Complete, Delete, Duplicate, Archive
  // ============================================================

  // Handle task completion (toggle complete/reopen)
  const handleComplete = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const isCompleted = ['closed', 'complete', 'done', 'completed'].includes(
      task.status?.status?.toLowerCase() || ''
    );

    // Find the appropriate status to switch to
    const newStatus = isCompleted
      ? statuses.find(s => 
          s.status?.toLowerCase() === 'to do' || 
          s.status?.toLowerCase() === 'open' || 
          s.type === 'open'
        )
      : statuses.find(s => 
          s.status?.toLowerCase() === 'complete' || 
          s.status?.toLowerCase() === 'done' ||
          s.status?.toLowerCase() === 'closed' ||
          s.type === 'closed'
        );

    if (newStatus) {
      await handleStatusChange(taskId, newStatus);
    } else {
      console.warn('Could not find appropriate status to toggle completion');
    }
  }, [tasks, statuses, handleStatusChange]);

  // Handle task deletion
  const handleDelete = useCallback(async (taskId: string) => {
    // Show confirmation dialog
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    setUpdatingTasks(prev => new Set(prev).add(taskId));
    const previousTasks = [...tasks];

    // OPTIMISTIC UPDATE - remove from local state immediately
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await api.deleteTask(taskId);
      onTaskUpdate?.();
    } catch (error) {
      console.error('Failed to delete task:', error);
      // Rollback on error
      setTasks(previousTasks);
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [tasks, onTaskUpdate]);

  // Handle task duplication
  const handleDuplicate = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !listId) {
      console.error('Cannot duplicate task without task data or listId');
      return;
    }

    setUpdatingTasks(prev => new Set(prev).add(taskId));

    try {
      // Create a new task with copied data
      const newTask = await api.createTask({
  listId,
  name: `${task.name} (copy)`,
  description: task.description,
  priority: task.priority?.id ? Number(task.priority.id) : undefined,
  dueDate: task.due_date ? String(task.due_date) : undefined,
});

      // Add to local state
      setTasks(prev => [...prev, newTask]);
      
      // Refresh to get complete task data
      onTaskUpdate?.();
    } catch (error) {
      console.error('Failed to duplicate task:', error);
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [tasks, listId, onTaskUpdate]);

  // Handle task archive
  const handleArchive = useCallback(async (taskId: string) => {
    setUpdatingTasks(prev => new Set(prev).add(taskId));
    const previousTasks = [...tasks];

    // OPTIMISTIC UPDATE - remove from view (archived tasks typically hidden)
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await api.updateTask(taskId, { archived: true });
      onTaskUpdate?.();
    } catch (error) {
      console.error('Failed to archive task:', error);
      // Rollback on error
      setTasks(previousTasks);
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [tasks, onTaskUpdate]);

  // ============================================================
  // LOCAL STATE HANDLERS
  // ============================================================

  const handleSort = useCallback((columnId: string, direction: 'asc' | 'desc') => {
    setSortBy(columnId);
    setSortDirection(direction);
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const handleGroupByChange = useCallback(
    (newGroupBy: 'status' | 'priority' | 'assignee' | 'none') => {
      setInternalGroupBy(newGroupBy);
      onGroupByChange?.(newGroupBy);
    },
    [onGroupByChange]
  );

  const handleToggleColumn = useCallback(
    (columnId: string) => {
      const newColumns = columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      );
      updateColumns(newColumns);
    },
    [columns, updateColumns]
  );

  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    // Filter closed tasks
    if (!showClosed) {
      result = result.filter((task) => {
        const status = task.status?.status?.toLowerCase() || '';
        return !['closed', 'complete', 'done', 'completed'].includes(status);
      });
    }

    return result;
  }, [tasks, searchQuery, showClosed]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'dueDate':
          const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          comparison = dateA - dateB;
          break;
        case 'priority':
          const priorityOrder: Record<string, number> = { '1': 1, '2': 2, '3': 3, '4': 4 };
          const pA = priorityOrder[String(a.priority?.id || '4')] || 4;
          const pB = priorityOrder[String(b.priority?.id || '4')] || 4;
          comparison = pA - pB;
          break;
        case 'status':
          comparison = (a.status?.orderindex || 0) - (b.status?.orderindex || 0);
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [filteredTasks, sortBy, sortDirection]);

  const groupedTasks = useMemo((): TaskGroup[] => {
    const currentGroupBy = internalGroupBy;

    if (currentGroupBy === 'none') {
      return [{ id: 'all', name: listName, color: listColor, tasks: sortedTasks }];
    }

    const groups: Map<string, TaskGroup> = new Map();

    sortedTasks.forEach((task) => {
      let groupId: string = 'unknown';
      let groupName: string = 'Unknown';
      let groupColor: string | undefined;

      switch (currentGroupBy) {
        case 'status':
          groupId = String(task.status?.id || 'no-status');
          groupName = task.status?.status || 'No Status';
          groupColor = task.status?.color;
          break;
        case 'priority':
          groupId = String(task.priority?.id || 'no-priority');
          groupName = task.priority?.priority || 'No Priority';
          // ClickUp priority colors
          const priorityColors: Record<string, string> = {
            '1': '#F42A2A',
            '2': '#FFCC00',
            '3': '#6B7AFF',
            '4': '#808080',
          };
          groupColor = priorityColors[String(task.priority?.id || '4')];
          break;
        case 'assignee':
          const assignee = task.assignees?.[0];
          groupId = String(assignee?.id || 'unassigned');
          groupName = assignee?.username || 'Unassigned';
          break;
        default:
          groupId = 'all';
          groupName = listName;
          groupColor = listColor;
      }

      if (!groups.has(groupId)) {
        groups.set(groupId, {
          id: groupId,
          name: groupName,
          color: groupColor,
          tasks: [],
        });
      }

      groups.get(groupId)!.tasks.push(task);
    });

    return Array.from(groups.values());
  }, [sortedTasks, internalGroupBy, listName, listColor]);

  // Calculate filter count
  const filterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (showClosed) count++;
    return count;
  }, [searchQuery, showClosed]);

  if (isLoading) {
    return <SkeletonTaskList rows={8} />;
  }

  // Show loading indicator while fetching metadata
  const isMetadataReady = !loadingMetadata || (statuses.length > 0 && members.length > 0);

  return (
    <div className={cn('flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden', className)}>
      {/* Metadata loading indicator */}
      {loadingMetadata && (
        <div className="flex items-center justify-center gap-2 py-2 bg-purple-50 border-b border-purple-100">
          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
          <span className="text-sm text-purple-600">Loading statuses and members...</span>
        </div>
      )}
      {/* Top Toolbar - Title, View Tabs, Actions */}
      <TopToolbar
        listName={listName}
        onAddTask={onAddTask}
        onSearchToggle={() => setShowSearch(!showSearch)}
        showSearch={showSearch}
        onHideToggle={() => setShowHidePanel(!showHidePanel)}
        showHidePanel={showHidePanel}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Filter Row - Group, Subtasks, Columns | Filter, Closed, Search */}
      <FilterRow
        groupBy={internalGroupBy}
        onGroupByChange={handleGroupByChange}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        filterCount={filterCount}
        showClosed={showClosed}
        onToggleClosed={() => setShowClosed(!showClosed)}
        columns={columns}
        onToggleColumn={handleToggleColumn}
        showSearch={showSearch}
      />

      {/* Scrollable Container */}
      <div className="overflow-auto flex-1" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {/* Column Headers */}
        <TaskListHeader
          columns={columns}
          onColumnsChange={updateColumns}
          onSort={handleSort}
          sortBy={sortBy}
          sortDirection={sortDirection}
        />

        {/* Task Groups */}
        {groupedTasks.map((group) => (
          <div key={group.id}>
            {/* Group Header */}
            {internalGroupBy !== 'none' && (
              <TaskGroupHeader
                group={group}
                isCollapsed={collapsedGroups.has(group.id)}
                onToggle={() => toggleGroup(group.id)}
                onAddTask={onAddTask}
                columns={columns}
              />
            )}

            {/* Task Rows */}
            {!collapsedGroups.has(group.id) && (
              <>
                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    columns={columns}
                    isSelected={selectedTasks.includes(task.id)}
                    onSelect={onTaskSelect}
                    onClick={handleTaskClick}
                    onNameChange={handleNameChange}
                    onStatusChange={handleStatusChange}
                    onPriorityChange={handlePriorityChange}
                    onDueDateChange={handleDueDateChange}
                    onAssigneesChange={handleAssigneesChange}
                    onTimerStart={handleTimerStart}
                    onTimerStop={handleTimerStop}
                    isTimerRunning={runningTimer?.taskId === task.id}
                    timerElapsed={runningTimer?.taskId === task.id ? timerElapsed : 0}
                    availableStatuses={statuses}
                    availableUsers={members}
                    isUpdating={updatingTasks.has(task.id)}
                    // NEW HANDLERS
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onArchive={handleArchive}
                  />
                ))}

                {/* Add Task Row - Quick inline add */}
                <AddTaskRow 
                  columns={columns} 
                  onAdd={onAddTask || (() => {})} 
                  onQuickAdd={listId ? handleQuickAdd : undefined}
                  listId={listId}
                />
              </>
            )}
          </div>
        ))}

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <LayoutList className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery ? 'Try a different search term' : 'Create your first task to get started'}
            </p>
            {onAddTask && (
              <button
                onClick={onAddTask}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Create Task
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;