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
  Check,
  X,
  Columns,
  ListTree,
  Users,
  MoreHorizontal,
  Settings,
  Loader2,
  Flag,
  Calendar,
  Trash2,
  Copy,
  ArrowRight,
  Tag,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types';
import { api } from '@/lib/api';
import { TaskListHeader, useColumns, defaultColumns, Column, StatusOption } from './TaskListHeader';
import { TaskRow } from './TaskRow';
import { SkeletonTaskList } from '@/components/ui/skeleton';
import { useTaskStore, useWorkspaceStore } from '@/stores';

// ============================================================
// TYPES
// ============================================================

interface AvailableUser {
  id: string | number;
  username?: string;
  email?: string;
  profilePicture?: string;
  color?: string;
}

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
  onTaskUpdate?: () => void;
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
// CLICKUP STANDARD PRIORITIES
// ============================================================

const CLICKUP_PRIORITIES = [
  { id: '1', priority: 'urgent', color: '#F42A2A', orderindex: 1 },
  { id: '2', priority: 'high', color: '#FFCC00', orderindex: 2 },
  { id: '3', priority: 'normal', color: '#6B7AFF', orderindex: 3 },
  { id: '4', priority: 'low', color: '#808080', orderindex: 4 },
  { id: '', priority: 'none', color: '#d1d5db', orderindex: 5 },
];

// ============================================================
// VIEW TABS
// ============================================================

const ViewTabs: React.FC<{ current: string; onChange: (v: string) => void }> = ({ current, onChange }) => {
  const tabs = [
    { id: 'list', label: 'List', icon: LayoutList },
    { id: 'board', label: 'Board', icon: LayoutGrid },
    { id: 'form', label: 'Form', icon: FileText },
    { id: 'feed', label: 'Feed', icon: Rss },
  ];

  return (
    <div className="flex items-center gap-0.5">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = current === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors relative',
              active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon className="h-4 w-4" />
            {t.label}
            {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />}
          </button>
        );
      })}
      <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
        <Plus className="h-4 w-4" />
        View
      </button>
    </div>
  );
};

// ============================================================
// TOP TOOLBAR
// ============================================================

const TopToolbar: React.FC<{
  listName: string;
  onAddTask?: () => void;
  showSearch: boolean;
  onSearchToggle: () => void;
  showHidePanel: boolean;
  onHideToggle: () => void;
  currentView: string;
  onViewChange: (v: string) => void;
}> = ({ listName, onAddTask, showSearch, onSearchToggle, showHidePanel, onHideToggle, currentView, onViewChange }) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-900">{listName}</h1>
          <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
        <ViewTabs current={currentView} onChange={onViewChange} />
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onSearchToggle}
          className={cn('flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md transition-colors', showSearch ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:bg-gray-100')}
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
        </button>
        <button
          onClick={onHideToggle}
          className={cn('flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md transition-colors', showHidePanel ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:bg-gray-100')}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Hide</span>
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Customize</span>
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddTask ? onAddTask() : useTaskStore.getState().openCreateModal(); }}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors ml-1"
        >
          <Plus className="h-4 w-4" />
          Add task
        </button>
      </div>
    </div>
  );
};

// ============================================================
// FILTER ROW
// ============================================================

const FilterRow: React.FC<{
  groupBy: 'status' | 'priority' | 'assignee' | 'none';
  onGroupByChange: (g: 'status' | 'priority' | 'assignee' | 'none') => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  showClosed: boolean;
  onToggleClosed: () => void;
  showSearch: boolean;
  filterCount?: number;
}> = ({ groupBy, onGroupByChange, searchQuery, onSearch, showClosed, onToggleClosed, showSearch, filterCount = 0 }) => {
  const [showGroupDD, setShowGroupDD] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setShowGroupDD(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const groupOpts = [
    { id: 'status', label: 'Status' },
    { id: 'priority', label: 'Priority' },
    { id: 'assignee', label: 'Assignee' },
    { id: 'none', label: 'None' },
  ] as const;

  const currentLabel = groupOpts.find((g) => g.id === groupBy)?.label || 'Status';

  return (
    <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-200 bg-gray-50/50">
      <div className="flex items-center gap-1.5">
        {/* Group */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setShowGroupDD(!showGroupDD)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ListTree className="h-3.5 w-3.5 text-gray-400" />
            Group: {currentLabel}
            <ChevronDown className={cn('h-3 w-3 text-gray-400 transition-transform', showGroupDD && 'rotate-180')} />
          </button>
          {showGroupDD && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {groupOpts.map((o) => (
                <button
                  key={o.id}
                  onClick={() => { onGroupByChange(o.id); setShowGroupDD(false); }}
                  className={cn('flex items-center justify-between w-full px-3 py-1.5 text-sm hover:bg-gray-50', groupBy === o.id && 'text-purple-600 bg-purple-50')}
                >
                  {o.label}
                  {groupBy === o.id && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
          <ListTree className="h-3.5 w-3.5 text-gray-400" />
          Subtasks
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <button className={cn('flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors', filterCount > 0 ? 'text-purple-600 bg-purple-50 border-purple-200' : 'text-gray-700 bg-white border-gray-200 hover:bg-gray-50')}>
          <Filter className="h-3.5 w-3.5" />
          {filterCount > 0 ? `${filterCount} Filter` : 'Filter'}
        </button>

        <button
          onClick={onToggleClosed}
          className={cn('flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors', showClosed ? 'text-purple-600 bg-purple-50 border-purple-200' : 'text-gray-700 bg-white border-gray-200 hover:bg-gray-50')}
        >
          <Check className="h-3.5 w-3.5" />
          Closed
        </button>

        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
          <Users className="h-3.5 w-3.5 text-gray-400" />
          Assignee
        </button>

        {showSearch && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              autoFocus
              className="w-44 h-8 pl-8 pr-8 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
            {searchQuery && (
              <button onClick={() => onSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
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

const TaskGroupHeader: React.FC<{
  group: TaskGroup;
  isCollapsed: boolean;
  onToggle: () => void;
  onAddTask?: () => void;
  columns: Column[];
}> = ({ group, isCollapsed, onToggle, onAddTask, columns }) => {
  const totalW = columns.filter((c) => c.visible).reduce((s, c) => s + c.width, 0) + 96;
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100/80 transition-colors group/gh"
      onClick={onToggle}
      style={{ minWidth: totalW }}
    >
      {isCollapsed ? <ChevronRight className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: group.color || '#9CA3AF' }} />
      <span className="text-sm font-semibold text-gray-700 capitalize">{group.name}</span>
      <span className="text-[10px] font-bold text-gray-400 bg-gray-200/80 px-1.5 py-0.5 rounded">{group.tasks.length}</span>
      {onAddTask && (
        <button onClick={(e) => { e.stopPropagation(); onAddTask(); }} className="ml-auto p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors opacity-0 group-hover/gh:opacity-100">
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// ============================================================
// ADD TASK ROW (inline quick-add)
// ============================================================

const AddTaskRow: React.FC<{
  columns: Column[];
  onAdd: () => void;
  onQuickAdd?: (name: string) => Promise<void>;
}> = ({ columns, onAdd, onQuickAdd }) => {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const totalW = columns.filter((c) => c.visible).reduce((s, c) => s + c.width, 0) + 96;

  useEffect(() => { if (adding) ref.current?.focus(); }, [adding]);

  const submit = async () => {
    if (!name.trim()) { setAdding(false); return; }
    if (onQuickAdd) {
      setSaving(true);
      try { await onQuickAdd(name.trim()); setName(''); ref.current?.focus(); } catch {} finally { setSaving(false); }
    } else { onAdd(); setAdding(false); }
  };

  if (adding) {
    return (
      <div className="flex items-center w-full bg-purple-50/30 border-b border-purple-100/50" style={{ minWidth: totalW }}>
        <div className="w-[60px] flex items-center justify-center">
          {saving ? <Loader2 className="h-4 w-4 text-purple-500 animate-spin" /> : <Plus className="h-4 w-4 text-purple-500" />}
        </div>
        <div className="flex-1 py-1.5 pr-3">
          <input
            ref={ref}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } if (e.key === 'Escape') { setName(''); setAdding(false); } }}
            onBlur={() => { if (!name.trim()) setAdding(false); }}
            disabled={saving}
            placeholder="Task name (Enter to save, Esc to cancel)"
            className="w-full px-3 py-1.5 text-sm rounded border border-purple-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-400"
          />
        </div>
        <button onClick={() => { setName(''); setAdding(false); }} className="p-2 mr-2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setAdding(true)}
      className="flex items-center w-full px-3 py-2 text-sm text-gray-400 hover:text-purple-600 hover:bg-purple-50/30 border-b border-gray-100 transition-colors group/add"
      style={{ minWidth: totalW }}
    >
      <div className="w-[60px] flex items-center justify-center"><Plus className="h-4 w-4 group-hover/add:text-purple-600 transition-colors" /></div>
      <span className="group-hover/add:text-purple-600 transition-colors">Add task...</span>
    </button>
  );
};

// ============================================================
// BULK ACTIONS BAR (ClickUp-style floating dark bar)
// ============================================================

const BulkActionsBar: React.FC<{
  count: number;
  onClear: () => void;
  statuses: StatusOption[];
  priorities: typeof CLICKUP_PRIORITIES;
  members: AvailableUser[];
  onBulkStatusChange: (status: StatusOption) => void;
  onBulkPriorityChange: (priority: number | null) => void;
  onBulkAssigneeAdd: (userId: number) => void;
  onBulkDateChange: (timestamp: number | null) => void;
  onBulkDelete: () => void;
  onBulkDuplicate: () => void;
}> = ({ count, onClear, statuses, priorities, members, onBulkStatusChange, onBulkPriorityChange, onBulkAssigneeAdd, onBulkDateChange, onBulkDelete, onBulkDuplicate }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e: MouseEvent) => { if (barRef.current && !barRef.current.contains(e.target as Node)) setOpenDropdown(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdown]);

  if (count === 0) return null;

  const Btn: React.FC<{ id: string; icon: React.ReactNode; label: string; danger?: boolean; directAction?: () => void }> = ({ id, icon, label, danger, directAction }) => (
    <button
      onClick={() => directAction ? directAction() : setOpenDropdown(openDropdown === id ? null : id)}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
        openDropdown === id ? 'text-white bg-white/15' : '',
        danger ? 'text-red-300 hover:text-red-200 hover:bg-red-500/20' : 'text-gray-300 hover:text-white hover:bg-white/10'
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  const Dropdown: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
    if (openDropdown !== id) return null;
    return (
      <div className="absolute bottom-full left-0 mb-2 min-w-[180px] max-h-60 overflow-auto bg-white rounded-lg shadow-xl border border-gray-200 py-1 text-gray-900 z-[60]">
        {children}
      </div>
    );
  };

  return (
    <div ref={barRef} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-2 border border-gray-700/50">
      <div className="flex items-center gap-2 pr-3 border-r border-gray-700">
        <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center">
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </div>
        <span className="text-sm font-semibold whitespace-nowrap">{count} Task{count !== 1 ? 's' : ''} selected</span>
        <button onClick={onClear} className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Status */}
      <div className="relative">
        <Btn id="status" icon={<CircleDot className="h-4 w-4" />} label="Status" />
        <Dropdown id="status">
          {statuses.map((s) => (
            <button key={String(s.id ?? s.status)} onClick={() => { onBulkStatusChange(s); setOpenDropdown(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color || '#87909e' }} />
              <span className="capitalize">{s.status}</span>
            </button>
          ))}
          {statuses.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">No statuses loaded</div>}
        </Dropdown>
      </div>

      {/* Assignee */}
      <div className="relative">
        <Btn id="assignee" icon={<Users className="h-4 w-4" />} label="Assignee" />
        <Dropdown id="assignee">
          {members.map((m) => (
            <button key={String(m.id)} onClick={() => { onBulkAssigneeAdd(Number(m.id)); setOpenDropdown(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
              {m.profilePicture ? (
                <img src={m.profilePicture} className="w-5 h-5 rounded-full" alt="" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[10px] font-bold text-white">{(m.username || m.email || '?')[0].toUpperCase()}</div>
              )}
              <span>{m.username || m.email}</span>
            </button>
          ))}
          {members.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">No members loaded</div>}
        </Dropdown>
      </div>

      {/* Date */}
      <div className="relative">
        <Btn id="date" icon={<Calendar className="h-4 w-4" />} label="Date" />
        <Dropdown id="date">
          <div className="px-3 py-2">
            <input
              type="date"
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              onChange={(e) => {
                if (e.target.value) { onBulkDateChange(new Date(e.target.value).getTime()); setOpenDropdown(null); }
              }}
            />
          </div>
          <button onClick={() => { onBulkDateChange(null); setOpenDropdown(null); }} className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-50">Clear date</button>
        </Dropdown>
      </div>

      {/* Priority */}
      <div className="relative">
        <Btn id="priority" icon={<Flag className="h-4 w-4" />} label="Priority" />
        <Dropdown id="priority">
          {priorities.map((p) => (
            <button key={p.id || 'none'} onClick={() => { onBulkPriorityChange(p.id ? Number(p.id) : null); setOpenDropdown(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
              <Flag className="w-4 h-4" style={{ color: p.color }} />
              <span className="capitalize">{p.priority === 'none' ? 'No priority' : p.priority}</span>
            </button>
          ))}
        </Dropdown>
      </div>

      <div className="w-px h-6 bg-gray-700 mx-1" />

      <Btn id="duplicate" icon={<Copy className="h-4 w-4" />} label="Duplicate" directAction={onBulkDuplicate} />
      <Btn id="delete" icon={<Trash2 className="h-4 w-4" />} label="Delete" directAction={onBulkDelete} danger />
    </div>
  );
};

// ============================================================
// MAIN TASK LIST
// ============================================================

export const TaskList: React.FC<TaskListProps> = ({
  tasks: initialTasks,
  isLoading = false,
  listId: propListId,
  workspaceId: propWorkspaceId,
  listName: propListName,
  listColor = '#5B4FD1',
  onTaskClick,
  onTaskSelect,
  onAddTask,
  onTaskUpdate,
  onTimerToggle,
  selectedTasks: externalSelected,
  groupBy = 'status',
  onGroupByChange,
  className,
}) => {
  const { columns, updateColumns } = useColumns(defaultColumns);
  const { openTaskModal } = useTaskStore();
  const { currentList, currentWorkspace, currentSpace } = useWorkspaceStore();

  // Auto-resolve IDs from workspace store if not provided as props
  const listId = propListId || currentList?.id;
  const workspaceId = propWorkspaceId || currentWorkspace?.id;
  const spaceId = currentSpace?.id;
  const listName = propListName || currentList?.name || 'Tasks';

  // Local task state for optimistic updates
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  useEffect(() => { setTasks(initialTasks); }, [initialTasks]);

  // Selection state (internal or external)
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());
  const selectedSet = externalSelected ? new Set(externalSelected) : internalSelected;

  const handleSelect = useCallback((taskId: string, selected: boolean) => {
    if (onTaskSelect) { onTaskSelect(taskId, selected); return; }
    setInternalSelected((prev) => {
      const next = new Set(prev);
      selected ? next.add(taskId) : next.delete(taskId);
      return next;
    });
  }, [onTaskSelect]);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const allIds = new Set(tasks.map((t) => t.id));
      setInternalSelected(allIds);
    } else {
      setInternalSelected(new Set());
    }
  }, [tasks]);

  const clearSelection = useCallback(() => setInternalSelected(new Set()), []);

  // UI state
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [internalGroupBy, setInternalGroupBy] = useState(groupBy);
  const [currentView, setCurrentView] = useState('list');
  const [showSearch, setShowSearch] = useState(false);
  const [showHidePanel, setShowHidePanel] = useState(false);

  // Metadata
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [members, setMembers] = useState<AvailableUser[]>([]);
  const [spaceTags, setSpaceTags] = useState<{ name: string; tag_bg?: string; tag_fg?: string }[]>([]);
  const [accountabilityMap, setAccountabilityMap] = useState<Record<string, any>>({});
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set());
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Timer
  const [runningTimer, setRunningTimer] = useState<{ taskId: string; startTime: number } | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);

  useEffect(() => {
    if (!runningTimer) { setTimerElapsed(0); return; }
    const interval = setInterval(() => setTimerElapsed(Date.now() - runningTimer.startTime), 1000);
    return () => clearInterval(interval);
  }, [runningTimer]);

  // Check running timer on mount
  useEffect(() => {
    if (!workspaceId) return;
    api.getRunningTimer(workspaceId).then((timer) => {
      if (timer?.data?.task?.id) setRunningTimer({ taskId: timer.data.task.id, startTime: parseInt(timer.data.start) || Date.now() });
    }).catch(() => {});
  }, [workspaceId]);

  // Fetch statuses
  useEffect(() => {
    if (!listId) return;
    api.getListStatuses(listId).then(setStatuses).catch(console.error);
  }, [listId]);

  // Fetch members
  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    setLoadingMetadata(true);
    api.getMembers(workspaceId).then((m) => { if (!cancelled) setMembers(m || []); }).catch(() => { if (!cancelled) setMembers([]); }).finally(() => { if (!cancelled) setLoadingMetadata(false); });
    return () => { cancelled = true; };
  }, [workspaceId]);

  // Fallback: get workspace from localStorage if not provided
  useEffect(() => {
    if (members.length > 0 || tasks.length === 0 || workspaceId) return;
    const t = setTimeout(async () => {
      try {
        const stored = localStorage.getItem('workora-workspace');
        if (stored) {
          const wsId = JSON.parse(stored)?.state?.currentWorkspace?.id;
          if (wsId) { const m = await api.getMembers(wsId); if (m?.length) setMembers(m); }
        }
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [tasks.length, members.length, workspaceId]);

  // Fetch space tags
  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    api.getSpaceTags(spaceId).then((tags) => { if (!cancelled && tags) setSpaceTags(tags); }).catch(() => {});
    return () => { cancelled = true; };
  }, [spaceId]);

  // Fetch accountability/ETA data for all tasks
  const taskIds = useMemo(() => tasks.map((t) => t.id).join(','), [tasks]);
  useEffect(() => {
    if (!tasks.length) return;
    let cancelled = false;
    const fetchAccountability = async () => {
      const map: Record<string, any> = {};
      // Fetch in parallel with concurrency limit
      const batchSize = 5;
      for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        const results = await Promise.allSettled(batch.map((t) => api.getTaskAccountability(t.id)));
        results.forEach((r, idx) => {
          if (r.status === 'fulfilled' && r.value) map[batch[idx].id] = r.value;
        });
      }
      if (!cancelled) setAccountabilityMap(map);
    };
    fetchAccountability().catch(() => {});
    return () => { cancelled = true; };
  }, [taskIds]);

  // ============================================================
  // API HANDLERS (optimistic updates)
  // ============================================================

  const markUpdating = (id: string) => setUpdatingTasks((p) => new Set(p).add(id));
  const clearUpdating = (id: string) => setUpdatingTasks((p) => { const n = new Set(p); n.delete(id); return n; });

  const handleTaskClick = useCallback((task: Task) => { openTaskModal(task); onTaskClick?.(task); }, [openTaskModal, onTaskClick]);

  const handleStatusChange = useCallback(async (taskId: string, status: StatusOption) => {
    markUpdating(taskId);
    const prev = [...tasks];
    setTasks((t) => t.map((x) => x.id === taskId ? { ...x, status: { ...x.status, id: String(status.id || ''), status: status.status || '', color: status.color || '#87909e', type: status.type } } as Task : x));
    try { await api.updateTask(taskId, { status: status.status }); } catch { setTasks(prev); } finally { clearUpdating(taskId); }
  }, [tasks]);

  const handlePriorityChange = useCallback(async (taskId: string, priority: number | null) => {
    markUpdating(taskId);
    const prev = [...tasks];
    const pMap: Record<number, { id: string; priority: string; color: string }> = { 1: { id: '1', priority: 'urgent', color: '#F42A2A' }, 2: { id: '2', priority: 'high', color: '#FFCC00' }, 3: { id: '3', priority: 'normal', color: '#6B7AFF' }, 4: { id: '4', priority: 'low', color: '#808080' } };
    setTasks((t) => t.map((x) => x.id === taskId ? { ...x, priority: priority ? pMap[priority] : undefined } as Task : x));
    try { await api.updateTask(taskId, { priority }); } catch { setTasks(prev); } finally { clearUpdating(taskId); }
  }, [tasks]);

  const handleDueDateChange = useCallback(async (taskId: string, timestamp: number | null) => {
    markUpdating(taskId);
    const prev = [...tasks];
    setTasks((t) => t.map((x) => x.id === taskId ? { ...x, due_date: timestamp ? String(timestamp) : undefined } as Task : x));
    try { await api.updateTask(taskId, { due_date: timestamp }); } catch { setTasks(prev); } finally { clearUpdating(taskId); }
  }, [tasks]);

  const handleAssigneesChange = useCallback(async (taskId: string, action: { add?: number[]; rem?: number[] }) => {
    markUpdating(taskId);
    const prev = [...tasks];
    setTasks((t) => t.map((x) => {
      if (x.id !== taskId) return x;
      let a = [...(x.assignees || [])];
      action.add?.forEach((uid) => { const u = members.find((m) => Number(m.id) === uid); if (u && !a.some((aa) => Number(aa.id) === uid)) a.push({ id: uid, username: u.username || '', email: u.email || '', profilePicture: u.profilePicture }); });
      if (action.rem) a = a.filter((aa) => !action.rem?.includes(Number(aa.id)));
      return { ...x, assignees: a } as Task;
    }));
    try { await api.updateAssignees(taskId, action); } catch { setTasks(prev); } finally { clearUpdating(taskId); }
  }, [tasks, members]);

  const handleNameChange = useCallback(async (taskId: string, name: string) => {
    markUpdating(taskId);
    const prev = [...tasks];
    setTasks((t) => t.map((x) => x.id === taskId ? { ...x, name } as Task : x));
    try { await api.updateTask(taskId, { name }); } catch { setTasks(prev); throw new Error('Failed'); } finally { clearUpdating(taskId); }
  }, [tasks]);

  const handleQuickAdd = useCallback(async (name: string) => {
    if (!listId) return;
    const newTask = await api.createTask({ listId, name });
    setTasks((t) => [...t, newTask]);
    onTaskUpdate?.();
  }, [listId, onTaskUpdate]);

  const getWorkspaceId = useCallback(() => {
    if (workspaceId) return workspaceId;
    try { const s = localStorage.getItem('workora-workspace'); return s ? JSON.parse(s)?.state?.currentWorkspace?.id : null; } catch { return null; }
  }, [workspaceId]);

  const handleTimerStart = useCallback(async (taskId: string) => {
    const wsId = getWorkspaceId(); if (!wsId) return;
    if (runningTimer) await api.stopTimer(wsId);
    const r = await api.startTimer(wsId, taskId);
    setRunningTimer({ taskId, startTime: parseInt(r.start) || Date.now() }); setTimerElapsed(0);
  }, [getWorkspaceId, runningTimer]);

  const handleTimerStop = useCallback(async (taskId: string) => {
    const wsId = getWorkspaceId(); if (!wsId) return;
    await api.stopTimer(wsId);
    const el = timerElapsed;
    setTasks((t) => t.map((x) => x.id === taskId ? { ...x, time_spent: (x.time_spent || 0) + el } as Task : x));
    setRunningTimer(null); setTimerElapsed(0); onTaskUpdate?.();
  }, [getWorkspaceId, timerElapsed, onTaskUpdate]);

  const handleComplete = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId); if (!task) return;
    const isDone = ['closed', 'complete', 'done', 'completed'].includes(task.status?.status?.toLowerCase() || '');
    const ns = isDone
      ? statuses.find((s) => s.status?.toLowerCase() === 'to do' || s.status?.toLowerCase() === 'open' || s.type === 'open')
      : statuses.find((s) => s.status?.toLowerCase() === 'complete' || s.status?.toLowerCase() === 'done' || s.status?.toLowerCase() === 'closed' || s.type === 'closed');
    if (ns) await handleStatusChange(taskId, ns);
  }, [tasks, statuses, handleStatusChange]);

  const handleDelete = useCallback(async (taskId: string) => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    markUpdating(taskId);
    const prev = [...tasks];
    setTasks((t) => t.filter((x) => x.id !== taskId));
    try { await api.deleteTask(taskId); onTaskUpdate?.(); } catch { setTasks(prev); } finally { clearUpdating(taskId); }
  }, [tasks, onTaskUpdate]);

  const handleDuplicate = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId); if (!task || !listId) return;
    markUpdating(taskId);
    try {
      const n = await api.createTask({ listId, name: `${task.name} (copy)`, description: task.description, priority: task.priority?.id ? Number(task.priority.id) : undefined, dueDate: task.due_date ? String(task.due_date) : undefined });
      setTasks((t) => [...t, n]); onTaskUpdate?.();
    } catch {} finally { clearUpdating(taskId); }
  }, [tasks, listId, onTaskUpdate]);

  const handleArchive = useCallback(async (taskId: string) => {
    markUpdating(taskId);
    const prev = [...tasks];
    setTasks((t) => t.filter((x) => x.id !== taskId));
    try { await api.updateTask(taskId, { archived: true }); onTaskUpdate?.(); } catch { setTasks(prev); } finally { clearUpdating(taskId); }
  }, [tasks, onTaskUpdate]);

  // Tag handlers
  const handleAddTag = useCallback(async (taskId: string, tagName: string) => {
    markUpdating(taskId);
    const prev = [...tasks];
    const tag = spaceTags.find((t) => t.name === tagName) || { name: tagName };
    setTasks((t) => t.map((x) => x.id === taskId ? { ...x, tags: [...(x.tags || []), tag] } as Task : x));
    try { await api.addTaskTag(taskId, tagName); } catch { setTasks(prev); } finally { clearUpdating(taskId); }
  }, [tasks, spaceTags]);

  const handleRemoveTag = useCallback(async (taskId: string, tagName: string) => {
    markUpdating(taskId);
    const prev = [...tasks];
    setTasks((t) => t.map((x) => x.id === taskId ? { ...x, tags: (x.tags || []).filter((tg: any) => tg.name !== tagName) } as Task : x));
    try { await api.removeTaskTag(taskId, tagName); } catch { setTasks(prev); } finally { clearUpdating(taskId); }
  }, [tasks]);

  // Generic update handler for remaining fields (tags, etc.)
  const handleGenericUpdate = useCallback(async (taskId: string, field: string, value: any) => {
    if (field === 'addTag') { await handleAddTag(taskId, value); return; }
    if (field === 'removeTag') { await handleRemoveTag(taskId, value); return; }
    // Fallback: direct API update
    markUpdating(taskId);
    try { await api.updateTask(taskId, { [field]: value }); onTaskUpdate?.(); } catch {} finally { clearUpdating(taskId); }
  }, [handleAddTag, handleRemoveTag, onTaskUpdate]);

  // Bulk handlers
  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedSet);
    if (!ids.length || !confirm(`Delete ${ids.length} task${ids.length > 1 ? 's' : ''}? This cannot be undone.`)) return;
    const prev = [...tasks];
    setTasks((t) => t.filter((x) => !selectedSet.has(x.id)));
    clearSelection();
    try { await Promise.all(ids.map((id) => api.deleteTask(id))); onTaskUpdate?.(); } catch { setTasks(prev); }
  }, [tasks, selectedSet, clearSelection, onTaskUpdate]);

  const handleBulkDuplicate = useCallback(async () => {
    const ids = Array.from(selectedSet);
    if (!ids.length || !listId) return;
    for (const id of ids) { await handleDuplicate(id); }
    clearSelection();
  }, [selectedSet, listId, handleDuplicate, clearSelection]);

  const handleBulkStatusChange = useCallback(async (status: StatusOption) => {
    const ids = Array.from(selectedSet);
    if (!ids.length) return;
    for (const id of ids) { await handleStatusChange(id, status); }
    clearSelection();
  }, [selectedSet, handleStatusChange, clearSelection]);

  const handleBulkPriorityChange = useCallback(async (priority: number | null) => {
    const ids = Array.from(selectedSet);
    if (!ids.length) return;
    for (const id of ids) { await handlePriorityChange(id, priority); }
    clearSelection();
  }, [selectedSet, handlePriorityChange, clearSelection]);

  const handleBulkAssigneeAdd = useCallback(async (userId: number) => {
    const ids = Array.from(selectedSet);
    if (!ids.length) return;
    for (const id of ids) { await handleAssigneesChange(id, { add: [userId] }); }
    clearSelection();
  }, [selectedSet, handleAssigneesChange, clearSelection]);

  const handleBulkDateChange = useCallback(async (timestamp: number | null) => {
    const ids = Array.from(selectedSet);
    if (!ids.length) return;
    for (const id of ids) { await handleDueDateChange(id, timestamp); }
    clearSelection();
  }, [selectedSet, handleDueDateChange, clearSelection]);

  // Sort / filter / group
  const handleSort = useCallback((col: string, dir: 'asc' | 'desc') => { setSortBy(col); setSortDirection(dir); }, []);
  const toggleGroup = useCallback((id: string) => { setCollapsedGroups((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }, []);
  const handleGroupByChange = useCallback((g: 'status' | 'priority' | 'assignee' | 'none') => { setInternalGroupBy(g); onGroupByChange?.(g); }, [onGroupByChange]);
  const handleToggleColumn = useCallback((id: string) => { updateColumns(columns.map((c) => c.id === id && !c.fixed ? { ...c, visible: !c.visible } : c)); }, [columns, updateColumns]);

  const filteredTasks = useMemo(() => {
    let r = tasks;
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); r = r.filter((t) => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)); }
    if (!showClosed) r = r.filter((t) => !['closed', 'complete', 'done', 'completed'].includes(t.status?.status?.toLowerCase() || ''));
    return r;
  }, [tasks, searchQuery, showClosed]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'dueDate': cmp = (a.due_date ? new Date(a.due_date).getTime() : Infinity) - (b.due_date ? new Date(b.due_date).getTime() : Infinity); break;
        case 'priority': { const po: Record<string, number> = { '1': 1, '2': 2, '3': 3, '4': 4 }; cmp = (po[String(a.priority?.id || '4')] || 4) - (po[String(b.priority?.id || '4')] || 4); break; }
        case 'status': cmp = (a.status?.orderindex || 0) - (b.status?.orderindex || 0); break;
      }
      return sortDirection === 'desc' ? -cmp : cmp;
    });
  }, [filteredTasks, sortBy, sortDirection]);

  const groupedTasks = useMemo((): TaskGroup[] => {
    if (internalGroupBy === 'none') return [{ id: 'all', name: listName, color: listColor, tasks: sortedTasks }];
    const groups = new Map<string, TaskGroup>();
    const priorityColors: Record<string, string> = { '1': '#F42A2A', '2': '#FFCC00', '3': '#6B7AFF', '4': '#808080' };

    sortedTasks.forEach((t) => {
      let gid = 'unknown', gname = 'Unknown', gcolor: string | undefined;
      switch (internalGroupBy) {
        case 'status': gid = String(t.status?.id || 'no-status'); gname = t.status?.status || 'No Status'; gcolor = t.status?.color; break;
        case 'priority': gid = String(t.priority?.id || 'no-priority'); gname = t.priority?.priority || 'No Priority'; gcolor = priorityColors[String(t.priority?.id || '4')]; break;
        case 'assignee': { const a = t.assignees?.[0]; gid = String(a?.id || 'unassigned'); gname = a?.username || 'Unassigned'; break; }
      }
      if (!groups.has(gid)) groups.set(gid, { id: gid, name: gname, color: gcolor, tasks: [] });
      groups.get(gid)!.tasks.push(t);
    });
    return Array.from(groups.values());
  }, [sortedTasks, internalGroupBy, listName, listColor]);

  const filterCount = useMemo(() => { let c = 0; if (searchQuery) c++; if (showClosed) c++; return c; }, [searchQuery, showClosed]);

  // Selection helpers
  const allTaskIds = filteredTasks.map((t) => t.id);
  const allSelected = allTaskIds.length > 0 && allTaskIds.every((id) => selectedSet.has(id));
  const someSelected = allTaskIds.some((id) => selectedSet.has(id));
  const selectionCount = Array.from(selectedSet).filter((id) => allTaskIds.includes(id)).length;

  if (isLoading) return <SkeletonTaskList rows={8} />;

  return (
    <div className={cn('flex flex-col h-full bg-white overflow-hidden', className)}>
      {/* Metadata loading */}
      {loadingMetadata && (
        <div className="flex items-center justify-center gap-2 py-1.5 bg-purple-50 border-b border-purple-100">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
          <span className="text-xs text-purple-600">Loading metadata...</span>
        </div>
      )}

      <TopToolbar
        listName={listName}
        onAddTask={onAddTask}
        showSearch={showSearch}
        onSearchToggle={() => setShowSearch(!showSearch)}
        showHidePanel={showHidePanel}
        onHideToggle={() => setShowHidePanel(!showHidePanel)}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      <FilterRow
        groupBy={internalGroupBy}
        onGroupByChange={handleGroupByChange}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        showClosed={showClosed}
        onToggleClosed={() => setShowClosed(!showClosed)}
        showSearch={showSearch}
        filterCount={filterCount}
      />

      {/* Scrollable list — flex-1 fills remaining height */}
      <div className="overflow-auto flex-1">
        <TaskListHeader
          columns={columns}
          onColumnsChange={updateColumns}
          onSort={handleSort}
          sortBy={sortBy}
          sortDirection={sortDirection}
          allSelected={allSelected}
          someSelected={someSelected && !allSelected}
          onSelectAll={handleSelectAll}
          taskCount={filteredTasks.length}
        />

        {groupedTasks.map((group) => (
          <div key={group.id}>
            {internalGroupBy !== 'none' && (
              <TaskGroupHeader group={group} isCollapsed={collapsedGroups.has(group.id)} onToggle={() => toggleGroup(group.id)} onAddTask={onAddTask} columns={columns} />
            )}
            {!collapsedGroups.has(group.id) && (
              <>
                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    accountability={accountabilityMap[task.id]}
                    columns={columns}
                    isSelected={selectedSet.has(task.id)}
                    onSelect={handleSelect}
                    onClick={handleTaskClick}
                    onUpdate={handleGenericUpdate}
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
                    availablePriorities={CLICKUP_PRIORITIES}
                    availableUsers={members}
                    availableTags={spaceTags}
                    isUpdating={updatingTasks.has(task.id)}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onArchive={handleArchive}
                  />
                ))}
                <AddTaskRow columns={columns} onAdd={onAddTask || (() => {})} onQuickAdd={listId ? handleQuickAdd : undefined} />
              </>
            )}
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <LayoutList className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">No tasks found</h3>
            <p className="text-sm text-gray-500 mb-4">{searchQuery ? 'Try a different search term' : 'Create your first task to get started'}</p>
            {onAddTask && (
              <button onClick={onAddTask} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-sm">
                <Plus className="h-4 w-4" /> Create Task
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        count={selectionCount}
        onClear={clearSelection}
        statuses={statuses}
        priorities={CLICKUP_PRIORITIES}
        members={members}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkPriorityChange={handleBulkPriorityChange}
        onBulkAssigneeAdd={handleBulkAssigneeAdd}
        onBulkDateChange={handleBulkDateChange}
        onBulkDelete={handleBulkDelete}
        onBulkDuplicate={handleBulkDuplicate}
      />
    </div>
  );
};

export default TaskList;