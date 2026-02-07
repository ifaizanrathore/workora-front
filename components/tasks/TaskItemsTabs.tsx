'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, CheckSquare, ListTodo, Zap, Loader2, Trash2, Check, Circle, Flag, Link2, Sparkles, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { Task } from '@/types';
import toast from 'react-hot-toast';

interface TaskItemsTabsProps {
  taskId: string;
  listId: string;
  taskDescription?: string;
  taskName?: string;
}

type TabType = 'subtasks' | 'checklist' | 'actions' | 'dependencies';

const PRIORITY_COLORS: Record<string, string> = {
  '1': '#F42A2A',
  '2': '#FFCC00',
  '3': '#6B7AFF',
  '4': '#808080',
};

export const TaskItemsTabs: React.FC<TaskItemsTabsProps> = ({ taskId, listId, taskDescription, taskName }) => {
  const [activeTab, setActiveTab] = useState<TabType>('subtasks');

  // Subtask state
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [creatingSubtask, setCreatingSubtask] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch subtasks on mount / taskId change
  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    setLoadingSubtasks(true);
    api.getSubtasks(taskId)
      .then((data) => {
        if (!cancelled) setSubtasks(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setSubtasks([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSubtasks(false);
      });
    return () => { cancelled = true; };
  }, [taskId]);

  // Focus input when shown
  useEffect(() => {
    if (showInput) inputRef.current?.focus();
  }, [showInput]);

  const handleCreateSubtask = async () => {
    const name = newSubtaskName.trim();
    if (!name || !taskId || !listId) return;

    setCreatingSubtask(true);
    try {
      const newTask = await api.createSubtask(taskId, listId, { name });
      setSubtasks((prev) => [...prev, newTask]);
      setNewSubtaskName('');
      inputRef.current?.focus();
      toast.success('Subtask created');
    } catch (err) {
      console.error('Failed to create subtask:', err);
      toast.error('Failed to create subtask');
    } finally {
      setCreatingSubtask(false);
    }
  };

  const handleToggleComplete = async (subtask: Task) => {
    const isDone = ['closed', 'complete', 'done', 'completed'].includes(subtask.status?.status?.toLowerCase() || '');
    const newStatus = isDone ? 'to do' : 'complete';

    // Optimistic update
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === subtask.id
          ? { ...s, status: { ...s.status, status: newStatus, color: isDone ? '#87909e' : '#6bc950' } }
          : s
      ) as Task[]
    );

    try {
      await api.updateSubtask(subtask.id, { status: newStatus });
    } catch (err) {
      // Revert on failure
      setSubtasks((prev) =>
        prev.map((s) => (s.id === subtask.id ? subtask : s))
      );
      toast.error('Failed to update subtask');
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const prev = [...subtasks];
    setSubtasks((s) => s.filter((t) => t.id !== subtaskId));

    try {
      await api.deleteSubtask(subtaskId);
      toast.success('Subtask deleted');
    } catch (err) {
      setSubtasks(prev);
      toast.error('Failed to delete subtask');
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'subtasks', label: 'Subtasks', icon: <ListTodo className="h-3.5 w-3.5" />, count: subtasks.length },
    { id: 'checklist', label: 'Checklist', icon: <CheckSquare className="h-3.5 w-3.5" /> },
    { id: 'actions', label: 'Actions', icon: <Zap className="h-3.5 w-3.5" /> },
    { id: 'dependencies', label: 'Dependencies', icon: <Link2 className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="border-t border-[#ECEDF0] dark:border-gray-700 pt-4">
      {/* Tab Headers */}
      <div className="flex items-center gap-1 mb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-[#F3F0FF] dark:bg-purple-900/30 text-[#7C3AED] dark:text-purple-400'
                : 'text-[#9CA3AF] dark:text-gray-500 hover:text-[#6B7280] dark:hover:text-gray-300 hover:bg-[#F5F5F7] dark:hover:bg-gray-800'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[100px]">
        {activeTab === 'subtasks' && (
          <div className="space-y-1">
            {/* Loading */}
            {loadingSubtasks && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 text-purple-500 animate-spin" />
              </div>
            )}

            {/* Subtask List */}
            {!loadingSubtasks && subtasks.map((subtask) => {
              const isDone = ['closed', 'complete', 'done', 'completed'].includes(subtask.status?.status?.toLowerCase() || '');
              return (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#F5F5F7] dark:hover:bg-gray-800 transition-colors group"
                >
                  {/* Status toggle */}
                  <button
                    onClick={() => handleToggleComplete(subtask)}
                    className={cn(
                      'flex-shrink-0 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all',
                      isDone
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400'
                    )}
                  >
                    {isDone && <Check className="h-3 w-3" strokeWidth={3} />}
                  </button>

                  {/* Name */}
                  <span
                    className={cn(
                      'flex-1 text-[13px] truncate',
                      isDone
                        ? 'text-gray-400 dark:text-gray-500 line-through'
                        : 'text-gray-800 dark:text-gray-200'
                    )}
                  >
                    {subtask.name}
                  </span>

                  {/* Priority flag */}
                  {subtask.priority?.id && (
                    <Flag
                      className="h-3.5 w-3.5 flex-shrink-0"
                      style={{ color: PRIORITY_COLORS[subtask.priority.id] || '#808080' }}
                    />
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-all"
                    aria-label={`Delete subtask: ${subtask.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}

            {/* Empty state */}
            {!loadingSubtasks && subtasks.length === 0 && !showInput && (
              <div className="text-center py-4 text-xs text-gray-400 dark:text-gray-500">
                No subtasks yet
              </div>
            )}

            {/* Add subtask input */}
            {showInput ? (
              <div className="flex items-center gap-2 px-3 py-1.5">
                {creatingSubtask ? (
                  <Loader2 className="h-4 w-4 text-purple-500 animate-spin flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                )}
                <input
                  ref={inputRef}
                  value={newSubtaskName}
                  onChange={(e) => setNewSubtaskName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleCreateSubtask(); }
                    if (e.key === 'Escape') { setNewSubtaskName(''); setShowInput(false); }
                  }}
                  onBlur={() => { if (!newSubtaskName.trim()) setShowInput(false); }}
                  disabled={creatingSubtask}
                  placeholder="Subtask name (Enter to save, Esc to cancel)"
                  className="flex-1 text-[13px] bg-transparent border-none outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            ) : (
              <button
                onClick={() => setShowInput(true)}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#9CA3AF] dark:text-gray-500 hover:text-[#7C3AED] dark:hover:text-purple-400 hover:bg-[#F5F5F7] dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add subtask</span>
              </button>
            )}
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="space-y-2">
            <button className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#9CA3AF] dark:text-gray-500 hover:text-[#7C3AED] dark:hover:text-purple-400 hover:bg-[#F5F5F7] dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Plus className="h-4 w-4" />
              <span>Add checklist item</span>
            </button>
          </div>
        )}

        {activeTab === 'actions' && (
          <AIActionsTab taskId={taskId} listId={listId} taskDescription={taskDescription} taskName={taskName} />
        )}

        {activeTab === 'dependencies' && (
          <DependenciesPanelInline taskId={taskId} />
        )}
      </div>
    </div>
  );
};

// AI Actions tab — Simplify task + Explain steps
const AIActionsTab: React.FC<{ taskId: string; listId: string; taskDescription?: string; taskName?: string }> = ({ taskId, listId, taskDescription, taskName }) => {
  const [simplifyLoading, setSimplifyLoading] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [explainLoading, setExplainLoading] = useState<number | null>(null);
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const handleSimplify = async () => {
    setSimplifyLoading(true);
    try {
      const result = await api.simplifyTask(taskId, listId, taskDescription || taskName || '', []);
      if (result?.data?.steps) {
        setSteps(result.data.steps);
        toast.success(`Generated ${result.data.steps.length} steps`);
      } else {
        toast.error('No steps generated');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to simplify task');
    } finally {
      setSimplifyLoading(false);
    }
  };

  const handleExplainStep = async (index: number, step: string) => {
    if (explanations[index]) {
      setExpandedStep(expandedStep === index ? null : index);
      return;
    }
    setExplainLoading(index);
    setExpandedStep(index);
    try {
      const result = await api.explainStep(step, `Task: ${taskName || ''}\n${taskDescription || ''}`);
      if (result?.data?.explanation) {
        setExplanations(prev => ({ ...prev, [index]: result.data.explanation }));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to explain step');
    } finally {
      setExplainLoading(null);
    }
  };

  const handleAddAsChecklist = async () => {
    if (steps.length === 0) return;
    try {
      const checklist = await api.addChecklist(taskId, 'AI Simplified Steps');
      if (!checklist?.id) throw new Error('Failed to create checklist');
      for (const step of steps) {
        await api.addChecklistItem(checklist.id, step);
      }
      toast.success(`Added ${steps.length} steps as checklist`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add checklist');
    }
  };

  return (
    <div className="space-y-3">
      {/* Simplify Button */}
      {steps.length === 0 && (
        <button
          onClick={handleSimplify}
          disabled={simplifyLoading}
          className="flex items-center gap-2 w-full px-3 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-60"
        >
          {simplifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {simplifyLoading ? 'Breaking down task...' : 'Simplify Task with AI'}
        </button>
      )}

      {/* Generated Steps */}
      {steps.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{steps.length} steps generated</span>
            <button
              onClick={handleAddAsChecklist}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
            >
              <CheckSquare className="h-3 w-3" />
              Add as checklist
            </button>
          </div>
          {steps.map((step, i) => (
            <div key={i} className="rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="flex-1 text-[13px] text-gray-700 dark:text-gray-300">{step}</span>
                <button
                  onClick={() => handleExplainStep(i, step)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 rounded transition-colors"
                  title="Explain this step"
                >
                  {explainLoading === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Info className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                >
                  {expandedStep === i ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>
              {expandedStep === i && explanations[i] && (
                <div className="px-3 py-2 bg-purple-50/50 dark:bg-purple-900/10 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{explanations[i]}</p>
                </div>
              )}
            </div>
          ))}
          <button
            onClick={() => { setSteps([]); setExplanations({}); setExpandedStep(null); }}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-2"
          >
            Clear & regenerate
          </button>
        </div>
      )}
    </div>
  );
};

// Inline compact dependencies view for the tab
const DependenciesPanelInline: React.FC<{ taskId: string }> = ({ taskId }) => {
  const [deps, setDeps] = React.useState<any[]>([]);
  const [links, setLinks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    setLoading(true);
    api.getTask(taskId)
      .then((task) => {
        if (!cancelled) {
          setDeps((task as any).dependencies || []);
          setLinks((task as any).linked_tasks || []);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
      </div>
    );
  }

  const total = deps.length + links.length;
  if (total === 0) {
    return (
      <div className="text-center py-6">
        <Link2 className="h-6 w-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-xs text-gray-400 dark:text-gray-500">No dependencies</p>
        <p className="text-[11px] text-gray-400 dark:text-gray-600">Use the Dependencies panel to add relationships</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {deps.map((dep: any, i: number) => (
        <div key={`dep-${i}`} className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-md text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
          <span className="text-gray-700 dark:text-gray-300 truncate">{dep.task?.name || dep.depends_on || dep.task_id}</span>
        </div>
      ))}
      {links.map((link: any, i: number) => (
        <div key={`link-${i}`} className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-md text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
          <span className="text-gray-700 dark:text-gray-300 truncate">{link.task?.name || link.task_id}</span>
        </div>
      ))}
    </div>
  );
};

export default TaskItemsTabs;
