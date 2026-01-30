'use client';

import React, { useState, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types';
import { TaskListHeader, useColumns, defaultColumns, Column } from './TaskListHeader';
import { TaskRow } from './TaskRow';
import { SkeletonTaskList } from '@/components/ui/skeleton';

// ============================================================
// TYPES
// ============================================================

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  listName?: string;
  listColor?: string;
  onTaskClick?: (task: Task) => void;
  onTaskSelect?: (taskId: string, selected: boolean) => void;
  onAddTask?: () => void;
  onStatusChange?: (taskId: string, status: string) => void;
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
    <div className="flex items-center gap-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              isActive
                ? 'text-gray-900 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
      <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
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
  onSearch?: (query: string) => void;
}

const TopToolbar: React.FC<TopToolbarProps> = ({ listName, onAddTask, onSearch }) => {
  const [currentView, setCurrentView] = useState('list');

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
      {/* Left - Title & View Tabs */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">{listName}</h1>
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
        <ViewTabs currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
          <Search className="h-4 w-4" />
          Search
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
          <SlidersHorizontal className="h-4 w-4" />
          Hide
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
          <SlidersHorizontal className="h-4 w-4" />
          Customize
        </button>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add task
          </button>
        )}
      </div>
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
  showClosed?: boolean;
  onToggleClosed?: () => void;
}

const FilterRow: React.FC<FilterRowProps> = ({
  groupBy,
  onGroupByChange,
  onSearch,
  searchQuery,
  filterCount = 0,
  showClosed = false,
  onToggleClosed,
}) => {
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  const groupOptions = [
    { id: 'status', label: 'Status' },
    { id: 'priority', label: 'Priority' },
    { id: 'assignee', label: 'Assignee' },
    { id: 'none', label: 'None' },
  ];

  const currentGroup = groupOptions.find((g) => g.id === groupBy)?.label || 'Status';

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50/50">
      {/* Left - Group, Subtasks, Columns */}
      <div className="flex items-center gap-2">
        {/* Group Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowGroupDropdown(!showGroupDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ListTree className="h-4 w-4 text-gray-400" />
            Group: {currentGroup}
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
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
                    'flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-gray-50',
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
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Columns className="h-4 w-4 text-gray-400" />
          Columns
        </button>
      </div>

      {/* Right - Filter, Closed, Assignee, Search */}
      <div className="flex items-center gap-2">
        {/* Filter */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="h-4 w-4 text-gray-400" />
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
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Users className="h-4 w-4 text-gray-400" />
          Assignee
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <span className="text-xs font-medium text-purple-600">U</span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-48 h-9 pl-9 pr-4 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>
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
  const totalWidth = columns.filter((c) => c.visible).reduce((sum, col) => sum + col.width, 0) + 50;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={onToggle}
      style={{ minWidth: totalWidth }}
    >
      {isCollapsed ? (
        <ChevronRight className="h-4 w-4 text-gray-400" />
      ) : (
        <ChevronDown className="h-4 w-4 text-gray-400" />
      )}

      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: group.color || '#9CA3AF' }}
      />

      <span className="text-sm font-semibold text-gray-700">{group.name}</span>

      <span className="text-xs font-medium text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
        {group.tasks.length}
      </span>

      {onAddTask && !isCollapsed && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddTask();
          }}
          className="ml-auto p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
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
}

const AddTaskRow: React.FC<AddTaskRowProps> = ({ columns, onAdd }) => {
  const totalWidth = columns.filter((c) => c.visible).reduce((sum, col) => sum + col.width, 0) + 50;

  return (
    <button
      onClick={onAdd}
      className="flex items-center w-full px-3 py-2.5 text-sm text-gray-400 hover:text-purple-600 hover:bg-purple-50/50 border-b border-gray-100 transition-colors group"
      style={{ minWidth: totalWidth }}
    >
      <div className="w-10 flex items-center justify-center">
        <Plus className="h-4 w-4 group-hover:text-purple-600" />
      </div>
      <span className="group-hover:text-purple-600">Add task...</span>
    </button>
  );
};

// ============================================================
// MAIN TASK LIST COMPONENT
// ============================================================

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  isLoading = false,
  listName = 'Tasks',
  listColor = '#5B4FD1',
  onTaskClick,
  onTaskSelect,
  onAddTask,
  onStatusChange,
  onTimerToggle,
  selectedTasks = [],
  groupBy = 'status',
  onGroupByChange,
  className,
}) => {
  const { columns, updateColumns } = useColumns(defaultColumns);

  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [internalGroupBy, setInternalGroupBy] = useState(groupBy);

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
        return !['closed', 'complete', 'done'].includes(status);
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
          const priorityColors: Record<string, string> = {
            '1': '#EF4444',
            '2': '#F97316',
            '3': '#3B82F6',
            '4': '#6B7280',
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

  if (isLoading) {
    return <SkeletonTaskList rows={8} />;
  }

  return (
    <div className={cn('flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden', className)}>
      {/* Top Toolbar - Title, View Tabs, Actions */}
      <TopToolbar listName={listName} onAddTask={onAddTask} />

      {/* Filter Row - Group, Subtasks, Columns | Filter, Closed, Search */}
      <FilterRow
        groupBy={internalGroupBy}
        onGroupByChange={handleGroupByChange}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        showClosed={showClosed}
        onToggleClosed={() => setShowClosed(!showClosed)}
      />

      {/* Scrollable Container */}
      <div className="overflow-x-auto flex-1">
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
                    onClick={onTaskClick}
                    onStatusChange={onStatusChange}
                    onTimerToggle={onTimerToggle}
                  />
                ))}

                {/* Add Task Row */}
                {onAddTask && <AddTaskRow columns={columns} onAdd={onAddTask} />}
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
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
              >
                + Create Task
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;