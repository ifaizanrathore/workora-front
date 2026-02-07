'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import {
  X,
  ChevronDown,
  Sparkles,
  Loader2,
  Clock,
  User,
  Calendar,
  Flag,
  Tag,
  CheckSquare,
  Plus,
  Eye,
  Link2,
  FileText,
  List,
} from 'lucide-react';
import { useTaskStore, useWorkspaceStore } from '@/stores';
import { cn, getPriorityColor } from '@/lib/utils';
import { api } from '@/lib/api';
import { useCreateTaskForm, useTaskFormData, type Priority, type Checklist, type ChecklistItem, type Assignee } from '@/hooks';

// Sub-components
import { AIAssistantPanel, ExtractedTaskData } from './AIAssistantPanel';
import { AskAIChat } from './AskAIChat';
import { AddFieldsDropdown } from './AddFieldsDropdown';
import { ChooseFieldModal } from './ChooseFieldModal';
import { ChecklistSection } from './ChecklistSection';
import { TaskFieldsRow } from './TaskFieldsRow';
import { SkeletonCreateTaskForm } from '@/components/ui/skeleton';

// Popovers
import { AssigneePopover } from './popovers/AssigneePopover';
import { PriorityPopover } from './popovers/PriorityPopover';
import { StatusPopover } from './popovers/StatusPopover';
import { TagsPopover } from './popovers/TagsPopover';
import { DueDatePopover } from './popovers/DueDatePopover';
import { ChecklistPopover } from './popovers/ChecklistPopover';

// Types (re-export from hook for consistency)
export type { Assignee, TaskTag, TaskStatus, ChecklistItem, Checklist } from '@/hooks';

export const priorityOptions: Priority[] = [
  { id: '1', label: 'Urgent', color: 'bg-red-500', textColor: 'text-red-600' },
  { id: '2', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { id: '3', label: 'Normal', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { id: '4', label: 'Low', color: 'bg-gray-400', textColor: 'text-gray-600' },
];


export const CreateTaskModal: React.FC = () => {
  const { isCreateModalOpen, closeCreateModal, addTask } = useTaskStore();
  const { currentList, setCurrentList } = useWorkspaceStore();

  // Form management
  const {
    state: formState,
    setTaskName,
    setDescription,
    toggleShowDescription,
    setStatus,
    setPriority,
    addAssignee,
    removeAssignee,
    addTag,
    removeTag,
    addWatcher,
    removeWatcher,
    setDueDate,
    setStartDate,
    setTimeEstimate,
    addChecklist,
    removeChecklist,
    addChecklistItem,
    removeChecklistItem,
    setNewChecklistItem,
    setRecurrence,
    toggleFieldVisibility,
    setError,
    resetForm,
  } = useCreateTaskForm();

  // Data fetching
  const { data: formData, loading } = useTaskFormData({
    isOpen: isCreateModalOpen,
    listId: currentList?.id,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [showChooseFieldModal, setShowChooseFieldModal] = React.useState(false);
  const [showAIPanel, setShowAIPanel] = React.useState(false);
  const [showAskAIChat, setShowAskAIChat] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const timeEstimateRef = useRef<HTMLDivElement>(null);

  // Focus input on modal open
  useEffect(() => {
    if (isCreateModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isCreateModalOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isCreateModalOpen) {
      resetForm();
      setShowAIPanel(false);
      setShowAskAIChat(false);
    }
  }, [isCreateModalOpen]);

  // Set default status when statuses are loaded
  useEffect(() => {
    if (formState.status === null && formData.statuses.length > 0) {
      const defaultStatus = formData.statuses.find(s => s.type !== 'closed');
      if (defaultStatus) {
        setStatus(defaultStatus);
      }
    }
  }, [formData.statuses, formState.status, setStatus]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '/' && formState.taskName === '') {
      e.preventDefault();
      setShowAIPanel(true);
    }
    if (e.key === 'Enter' && !e.shiftKey && formState.taskName.trim()) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      if (showAIPanel) {
        setShowAIPanel(false);
      } else if (showAskAIChat) {
        setShowAskAIChat(false);
      } else {
        closeCreateModal();
      }
    }
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const hasImage = Array.from(e.clipboardData.items).some(item =>
      item.type.startsWith('image/')
    );
    if (hasImage) {
      setShowAIPanel(true);
    }
  }, []);

  const handleSubmit = async () => {
    setError(null);

    if (!formState.taskName.trim()) {
      setError('Task name is required');
      return;
    }

    if (!currentList?.id) {
      setError('Please select a list first');
      return;
    }

    setSubmitting(true);
    try {
      const taskData = {
        listId: currentList.id,
        name: formState.taskName.trim(),
        description: formState.description.trim() || undefined,
        status: formState.status?.status,
        priority: formState.priority ? parseInt(formState.priority.id) : undefined,
        assignees: formState.assignees.map(a => a.id),
        tags: formState.tags.map(t => t.name),
        dueDate: formState.dueDate ? new Date(formState.dueDate).toISOString() : undefined,
        startDate: formState.startDate ? new Date(formState.startDate).toISOString() : undefined,
        timeEstimate: formState.timeEstimate ? parseFloat(formState.timeEstimate) * 60 * 60 * 1000 : undefined,
        checklist: formState.checklists.length > 0
          ? formState.checklists.map(c => ({ name: c.name, items: c.items.map(i => i.name) }))
          : undefined,
      };

      const task = await api.createTask(taskData);
      addTask(task);
      closeCreateModal();
    } catch (error) {
      console.error('Failed to create task:', error);
      setError(error instanceof Error ? error.message : 'Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIExtract = (data: ExtractedTaskData) => {
    if (data.name) setTaskName(data.name);
    if (data.description) {
      setDescription(data.description);
      toggleShowDescription();
    }
    if (data.priority) setPriority(data.priority);
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach(tag => {
        if (!formState.tags.some(existing => existing.name === tag.name)) {
          addTag(tag);
        }
      });
    }
    if (data.dueDate) setDueDate(data.dueDate);
    if (data.timeEstimate) {
      setTimeEstimate(data.timeEstimate);
    }
    if (data.checklist && data.checklist.length > 0) {
      const newChecklist: Checklist = {
        id: Date.now().toString(),
        name: 'AI Generated Checklist',
        items: data.checklist.map((item, index): ChecklistItem => ({
          id: `${Date.now()}-${index}`,
          name: item.name,
          completed: false,
        })),
      };
      addChecklist(newChecklist);
    }

    setShowAIPanel(false);
  };

  const handleAddChecklistItem = (checklistId: string) => {
    const itemName = formState.newChecklistItem[checklistId]?.trim();
    if (!itemName) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      name: itemName,
      completed: false,
    };
    addChecklistItem(checklistId, newItem);
  };

  const getInitial = (user: Assignee): string => {
    return (user.username || user.email || 'U').charAt(0).toUpperCase();
  };

  if (!isCreateModalOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={closeCreateModal}
      >
        {/* Modal */}
        <div
          className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <Plus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Task</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Add a new task to your list</p>
              </div>
            </div>
            <button
              onClick={closeCreateModal}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loading ? (
              <SkeletonCreateTaskForm />
            ) : (
              <div className="space-y-5">
                {/* List Selector */}
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">List:</span>
                  {(formData.lists.length > 0) ? (
                    <div className="relative">
                      <select
                        value={currentList?.id || ''}
                        onChange={(e) => {
                          const selectedList = formData.lists.find(l => l.id === e.target.value);
                          if (selectedList) {
                            setCurrentList(selectedList);
                            setError(null);
                          }
                        }}
                        className={cn(
                          "appearance-none pl-3 pr-8 py-1.5 rounded-lg text-sm font-medium border cursor-pointer",
                          "focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500",
                          currentList
                            ? "bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                            : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400"
                        )}
                        aria-label="Select a task list"
                      >
                        <option value="">Select a list...</option>
                        {formData.lists.map((list) => (
                          <option key={list.id} value={list.id}>
                            {list.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  ) : (
                    <span className="text-sm text-amber-600">No lists available</span>
                  )}
                </div>

                {/* Task Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="task-name">
                    Task Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="task-name"
                      ref={inputRef}
                      type="text"
                      value={formState.taskName}
                      onChange={(e) => {
                        setTaskName(e.target.value);
                        if (formState.error) setError(null);
                      }}
                      onKeyDown={handleInputKeyDown}
                      onPaste={handlePaste}
                      placeholder="What needs to be done?"
                      className={cn(
                        "w-full px-4 py-3 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500",
                        "border-2 transition-all",
                        "focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10",
                        formState.error ? "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700" : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
                      )}
                      aria-invalid={!!formState.error}
                      aria-describedby={formState.error ? 'task-name-error' : undefined}
                    />
                    <button
                      onClick={() => setShowAIPanel(!showAIPanel)}
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
                        showAIPanel
                          ? "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
                          : "text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                      )}
                      title="AI Assistant (press /)"
                      aria-label="Toggle AI assistant"
                    >
                      <Sparkles className="h-4 w-4" />
                    </button>
                  </div>
                  {formState.error && (
                    <p id="task-name-error" className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠️</span> {formState.error}
                    </p>
                  )}
                </div>

                {/* Description */}
                {!formState.showDescription ? (
                  <button
                    onClick={toggleShowDescription}
                    className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    aria-label="Add task description"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Add description</span>
                  </button>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="task-description">
                      Description
                    </label>
                    <textarea
                      id="task-description"
                      value={formState.description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add more details..."
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 resize-none h-24 bg-gray-50/50 dark:bg-gray-800/50"
                      aria-label="Task description"
                    />
                  </div>
                )}

                {/* AI Assistant Panel */}
                <AIAssistantPanel
                  isOpen={showAIPanel}
                  onClose={() => setShowAIPanel(false)}
                  onExtract={handleAIExtract}
                  listId={currentList?.id}
                  currentTaskName={formState.taskName}
                />

                {/* Checklists */}
                <ChecklistSection
                  checklists={formState.checklists}
                  newChecklistItem={formState.newChecklistItem}
                  onRemoveChecklist={removeChecklist}
                  onRemoveChecklistItem={removeChecklistItem}
                  onSetNewChecklistItem={setNewChecklistItem}
                  onAddChecklistItem={handleAddChecklistItem}
                />

                {/* Quick Fields Row */}
                <div className="space-y-3">
                  {/* Selected Items Display */}
                  {(formState.tags.length > 0 || formState.assignees.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {formState.tags.map((tag) => (
                        <button
                          key={tag.name}
                          onClick={() => removeTag(tag.name)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
                          style={{
                            backgroundColor: tag.tag_bg,
                            color: tag.tag_fg || '#fff',
                          }}
                          aria-label={`Remove tag: ${tag.name}`}
                        >
                          #{tag.name}
                          <X className="w-3 h-3" />
                        </button>
                      ))}

                      {formState.assignees.map((assignee) => (
                        <button
                          key={assignee.id}
                          onClick={() => removeAssignee(assignee.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          aria-label={`Remove assignee: ${assignee.username || assignee.email}`}
                        >
                          <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px]">
                            {getInitial(assignee)}
                          </div>
                          {assignee.username || assignee.email}
                          <X className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Task Fields Row Component */}
                  <TaskFieldsRow
                    status={formState.status}
                    priority={formState.priority}
                    assignees={formState.assignees}
                    tags={formState.tags}
                    dueDate={formState.dueDate}
                    startDate={formState.startDate}
                    timeEstimate={formState.timeEstimate}
                    visibleFields={formState.visibleFields}
                    availableStatuses={formData.statuses}
                    availableMembers={formData.members}
                    availableTags={formData.tags}
                    onStatusChange={setStatus}
                    onPriorityChange={setPriority}
                    onAddAssignee={addAssignee}
                    onAddTag={addTag}
                    onDueDateChange={setDueDate}
                    onStartDateChange={setStartDate}
                    onTimeEstimateChange={setTimeEstimate}
                    onAddChecklist={(name) => {
                      addChecklist({
                        id: Date.now().toString(),
                        name,
                        items: [],
                      });
                    }}
                    recurrence={formState.recurrence}
                    onRecurrenceChange={setRecurrence}
                    onToggleFieldVisibility={toggleFieldVisibility}
                    onOpenChooseFieldModal={() => setShowChooseFieldModal(true)}
                  />
                </div>

                {/* Ask AI Chat Panel */}
                <AskAIChat
                  isOpen={showAskAIChat}
                  onClose={() => setShowAskAIChat(false)}
                  taskName={formState.taskName}
                  description={formState.description}
                  onApplyPriority={setPriority}
                  onApplyTags={(newTags) => {
                    newTags.forEach(tag => {
                      if (!formState.tags.some(t => t.name === tag.name)) {
                        addTag(tag);
                      }
                    });
                  }}
                  onApplyDueDate={setDueDate}
                  availableTags={formData.tags}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <button
              onClick={() => setShowAskAIChat(!showAskAIChat)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                showAskAIChat
                  ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              aria-label="Ask AI for help"
            >
              <Sparkles className="h-4 w-4 text-purple-500" />
              Ask AI
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={closeCreateModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Cancel task creation"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formState.taskName.trim() || submitting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                aria-disabled={!formState.taskName.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Choose Field Modal */}
      <ChooseFieldModal
        isOpen={showChooseFieldModal}
        onClose={() => setShowChooseFieldModal(false)}
        onFieldToggle={(fieldId, visible) => {
          if (fieldId in formState.visibleFields) {
            const currentValue = formState.visibleFields[fieldId as keyof typeof formState.visibleFields];
            if (currentValue !== visible) {
              toggleFieldVisibility(fieldId);
            }
          }
        }}
      />
    </>
  );
};

export default CreateTaskModal;