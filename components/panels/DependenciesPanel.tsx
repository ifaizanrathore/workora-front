'use client';

import React, { useState, useCallback } from 'react';
import { Link2, ArrowRight, ArrowLeft, Plus, X, Search, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useDependencies, useAddDependency, useRemoveDependency, useAddTaskLink, useRemoveTaskLink } from '@/hooks';
import { api } from '@/lib/api';
import { EmptyDependencies } from '@/components/ui/empty-states';
import type { Task, Dependency, LinkedTask } from '@/types';
import toast from 'react-hot-toast';

interface DependenciesPanelProps {
  taskId: string;
}

export const DependenciesPanel: React.FC<DependenciesPanelProps> = ({ taskId }) => {
  const { data, isLoading, refetch } = useDependencies(taskId);
  const addDependency = useAddDependency();
  const removeDependency = useRemoveDependency();
  const addLink = useAddTaskLink();
  const removeLink = useRemoveTaskLink();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addMode, setAddMode] = useState<'waiting_on' | 'blocking' | 'link'>('waiting_on');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [searching, setSearching] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    waiting_on: true,
    blocking: true,
    linked: true,
  });

  const waitingOn = data.dependencies.filter(d => d.depends_on && d.depends_on !== taskId);
  const blocking = data.dependencies.filter(d => d.task_id && d.task_id !== taskId);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      // Search tasks - we need a listId, but we can use the task's list
      const task = await api.getTask(taskId);
      if (task.list?.id) {
        const tasks = await api.getTasks(task.list.id);
        const filtered = tasks.filter((t: Task) =>
          t.id !== taskId &&
          t.name.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered.slice(0, 10));
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [taskId]);

  const handleAdd = async (targetTaskId: string) => {
    try {
      if (addMode === 'waiting_on') {
        await addDependency.mutate({ taskId, depends_on: targetTaskId });
        toast.success('Dependency added');
      } else if (addMode === 'blocking') {
        await addDependency.mutate({ taskId, dependency_of: targetTaskId });
        toast.success('Dependency added');
      } else {
        await addLink.mutate({ taskId, linksTo: targetTaskId });
        toast.success('Task linked');
      }
      setShowAddDialog(false);
      setSearchQuery('');
      setSearchResults([]);
      refetch();
    } catch {
      toast.error('Failed to add dependency');
    }
  };

  const handleRemoveDependency = async (dep: Dependency) => {
    try {
      if (dep.depends_on && dep.depends_on !== taskId) {
        await removeDependency.mutate({ taskId, depends_on: dep.depends_on });
      } else {
        await removeDependency.mutate({ taskId, dependency_of: dep.task_id });
      }
      toast.success('Dependency removed');
      refetch();
    } catch {
      toast.error('Failed to remove dependency');
    }
  };

  const handleRemoveLink = async (link: LinkedTask) => {
    try {
      await removeLink.mutate({ taskId, linksTo: link.task_id });
      toast.success('Link removed');
      refetch();
    } catch {
      toast.error('Failed to remove link');
    }
  };

  const totalItems = data.dependencies.length + data.linked_tasks.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Dependencies</span>
          {totalItems > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
              {totalItems}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="p-1.5 rounded-md text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 dark:hover:text-purple-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {totalItems === 0 && !showAddDialog ? (
          <EmptyDependencies
            size="sm"
            onAction={() => setShowAddDialog(true)}
          />
        ) : (
          <>
            {/* Waiting On */}
            {waitingOn.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('waiting_on')}
                  className="flex items-center gap-1.5 mb-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {expandedSections.waiting_on ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <ArrowLeft className="h-3 w-3 text-orange-500" />
                  Waiting on ({waitingOn.length})
                </button>
                {expandedSections.waiting_on && (
                  <div className="space-y-1.5">
                    {waitingOn.map((dep) => (
                      <DependencyCard
                        key={`dep-${dep.depends_on}`}
                        label={dep.task?.name || dep.depends_on}
                        statusColor={dep.task?.status?.color}
                        onRemove={() => handleRemoveDependency(dep)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Blocking */}
            {blocking.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('blocking')}
                  className="flex items-center gap-1.5 mb-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {expandedSections.blocking ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <ArrowRight className="h-3 w-3 text-red-500" />
                  Blocking ({blocking.length})
                </button>
                {expandedSections.blocking && (
                  <div className="space-y-1.5">
                    {blocking.map((dep) => (
                      <DependencyCard
                        key={`blk-${dep.task_id}`}
                        label={dep.task?.name || dep.task_id}
                        statusColor={dep.task?.status?.color}
                        onRemove={() => handleRemoveDependency(dep)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Linked Tasks */}
            {data.linked_tasks.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('linked')}
                  className="flex items-center gap-1.5 mb-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {expandedSections.linked ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <Link2 className="h-3 w-3 text-blue-500" />
                  Linked ({data.linked_tasks.length})
                </button>
                {expandedSections.linked && (
                  <div className="space-y-1.5">
                    {data.linked_tasks.map((link) => (
                      <DependencyCard
                        key={`link-${link.task_id}`}
                        label={link.task?.name || link.task_id}
                        statusColor={link.task?.status?.color}
                        onRemove={() => handleRemoveLink(link)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Dialog */}
      {showAddDialog && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-3">
          {/* Mode Selector */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {(['waiting_on', 'blocking', 'link'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setAddMode(mode)}
                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  addMode === mode
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {mode === 'waiting_on' ? 'Waiting on' : mode === 'blocking' ? 'Blocking' : 'Link'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
            />
            {searching && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-gray-400" />
            )}
          </div>

          {/* Results */}
          {searchResults.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1">
              {searchResults.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleAdd(task.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-sm text-left rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: task.status?.color || '#d3d3d3' }}
                  />
                  <span className="text-gray-900 dark:text-white truncate">{task.name}</span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setShowAddDialog(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
            className="w-full py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

// Sub-component for dependency/link cards
const DependencyCard: React.FC<{
  label: string;
  statusColor?: string;
  onRemove: () => void;
}> = ({ label, statusColor, onRemove }) => (
  <div className="group flex items-center gap-2 px-2.5 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
    <div
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: statusColor || '#d3d3d3' }}
    />
    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{label}</span>
    <button
      onClick={onRemove}
      className="p-0.5 rounded opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  </div>
);
