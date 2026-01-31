'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// Sub-components
import { AIAssistantPanel, ExtractedTaskData } from './AIAssistantPanel';
import { AskAIChat } from './AskAIChat';
import { AddFieldsDropdown } from './AddFieldsDropdown';
import { ChooseFieldModal } from './ChooseFieldModal';

// Popovers
import { AssigneePopover } from './popovers/AssigneePopover';
import { PriorityPopover } from './popovers/PriorityPopover';
import { StatusPopover } from './popovers/StatusPopover';
import { TagsPopover } from './popovers/TagsPopover';
import { DueDatePopover } from './popovers/DueDatePopover';
import { ChecklistPopover } from './popovers/ChecklistPopover';

// Types
export interface Assignee {
  id: number;
  username: string;
  email: string;
  profilePicture?: string;
}

export interface TaskTag {
  name: string;
  tag_bg: string;
  tag_fg: string;
}

export interface TaskStatus {
  id: string;
  status: string;
  color: string;
  type?: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  completed: boolean;
}

export interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export interface Priority {
  id: string;
  label: string;
  color: string;
  textColor: string;
}

export const priorityOptions: Priority[] = [
  { id: '1', label: 'Urgent', color: 'bg-red-500', textColor: 'text-red-600' },
  { id: '2', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { id: '3', label: 'Normal', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { id: '4', label: 'Low', color: 'bg-gray-400', textColor: 'text-gray-600' },
];

// Priority color mapping
const getPriorityColor = (id: string) => {
  switch (id) {
    case '1': return '#EF4444';
    case '2': return '#F97316';
    case '3': return '#3B82F6';
    case '4': return '#6B7280';
    default: return '#6B7280';
  }
};

export const CreateTaskModal: React.FC = () => {
  const { isCreateModalOpen, closeCreateModal, addTask } = useTaskStore();
  const { currentList, currentSpace, currentWorkspace, lists, setCurrentList } = useWorkspaceStore();

  const inputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [showChooseFieldModal, setShowChooseFieldModal] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showAskAIChat, setShowAskAIChat] = useState(false);

  // Form state
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [tags, setTags] = useState<TaskTag[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [watchers, setWatchers] = useState<Assignee[]>([]);

  // Visible fields state
  const [visibleFields, setVisibleFields] = useState({
    assignee: true,
    dueDate: true,
    priority: true,
    tags: true,
    checklist: false,
    timeEstimate: false,
    startDate: false,
    watchers: false,
    dependencies: false,
    recurring: false,
    attachments: false,
  });

  // Data from API
  const [availableStatuses, setAvailableStatuses] = useState<TaskStatus[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Assignee[]>([]);
  const [availableTags, setAvailableTags] = useState<TaskTag[]>([]);
  const [availableLists, setAvailableLists] = useState<any[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState<Record<string, string>>({});
  const [showTimeEstimateInput, setShowTimeEstimateInput] = useState(false);
  const timeEstimateRef = useRef<HTMLDivElement>(null);

  // Fetch data when modal opens
  useEffect(() => {
    if (!isCreateModalOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch lists if we don't have any
        if (lists.length === 0) {
          let fetchedLists: any[] = [];
          
          if (currentSpace?.id) {
            try {
              fetchedLists = await api.getFolderlessLists(currentSpace.id);
            } catch (e) {
              console.warn('Failed to fetch lists from space:', e);
            }
          }
          
          if (fetchedLists.length === 0 && currentWorkspace?.id) {
            try {
              const spaces = await api.getSpaces(currentWorkspace.id);
              if (spaces && spaces.length > 0) {
                if (!currentSpace) {
                  useWorkspaceStore.getState().setCurrentSpace(spaces[0]);
                }
                const spaceId = currentSpace?.id || spaces[0]?.id;
                if (spaceId) {
                  fetchedLists = await api.getFolderlessLists(spaceId);
                }
              }
            } catch (e) {
              console.warn('Failed to fetch spaces/lists from workspace:', e);
            }
          }
          
          if (fetchedLists && fetchedLists.length > 0) {
            useWorkspaceStore.getState().setLists(fetchedLists);
            setAvailableLists(fetchedLists);
            if (!currentList) {
              setCurrentList(fetchedLists[0]);
            }
          }
        } else if (!currentList && lists.length > 0) {
          setCurrentList(lists[0]);
          setAvailableLists(lists);
        } else {
          setAvailableLists(lists);
        }

        // Fetch statuses if we have a list
        const listId = currentList?.id || lists[0]?.id;
        if (listId) {
          const statuses = await api.getListStatuses(listId);
          setAvailableStatuses(statuses as TaskStatus[]);
          const defaultStatus = (statuses as TaskStatus[]).find(s => s.type !== 'closed');
          if (defaultStatus) setStatus(defaultStatus);
        }

        if (currentWorkspace?.id) {
          const members = await api.getMembers(currentWorkspace.id);
          setAvailableMembers(members);
        }

        if (currentSpace?.id) {
          const spaceTags = await api.getSpaceTags(currentSpace.id);
          setAvailableTags(spaceTags);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isCreateModalOpen, currentList?.id, currentWorkspace?.id, currentSpace?.id, lists.length]);

  // Fetch statuses when currentList changes
  useEffect(() => {
    if (!currentList?.id || !isCreateModalOpen) return;
    
    const fetchStatuses = async () => {
      try {
        const statuses = await api.getListStatuses(currentList.id);
        setAvailableStatuses(statuses as TaskStatus[]);
        const defaultStatus = (statuses as TaskStatus[]).find(s => s.type !== 'closed');
        if (defaultStatus && !status) setStatus(defaultStatus);
      } catch (error) {
        console.error('Failed to fetch statuses:', error);
      }
    };
    
    fetchStatuses();
  }, [currentList?.id, isCreateModalOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isCreateModalOpen) {
      resetForm();
    }
  }, [isCreateModalOpen]);

  // Close time estimate input on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (timeEstimateRef.current && !timeEstimateRef.current.contains(e.target as Node)) {
        setShowTimeEstimateInput(false);
      }
    };
    if (showTimeEstimateInput) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTimeEstimateInput]);

  const resetForm = () => {
    setTaskName('');
    setDescription('');
    setShowDescription(false);
    setStatus(null);
    setPriority(null);
    setAssignees([]);
    setTags([]);
    setChecklists([]);
    setDueDate('');
    setStartDate('');
    setTimeEstimate('');
    setWatchers([]);
    setShowAIPanel(false);
    setShowAskAIChat(false);
    setNewChecklistItem({});
    setShowTimeEstimateInput(false);
    setError(null);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '/' && taskName === '') {
      e.preventDefault();
      setShowAIPanel(true);
    }
    if (e.key === 'Enter' && !e.shiftKey && taskName.trim()) {
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
    
    if (!taskName.trim()) {
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
        name: taskName.trim(),
        description: description.trim() || undefined,
        status: status?.status,
        priority: priority ? parseInt(priority.id) : undefined,
        assignees: assignees.map(a => a.id),
        tags: tags.map(t => t.name),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        timeEstimate: timeEstimate ? parseFloat(timeEstimate) * 60 * 60 * 1000 : undefined,
        checklist: checklists.length > 0
          ? checklists.map(c => ({ name: c.name, items: c.items.map(i => i.name) }))
          : undefined,
      };

      const task = await api.createTask(taskData);
      addTask(task);
      closeCreateModal();
    } catch (error: any) {
      console.error('Failed to create task:', error);
      setError(error?.message || 'Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIExtract = (data: ExtractedTaskData) => {
    if (data.name) setTaskName(data.name);
    if (data.description) {
      setDescription(data.description);
      setShowDescription(true);
    }
    if (data.priority) setPriority(data.priority);
    if (data.tags && data.tags.length > 0) {
      setTags(prev => {
        const newTags = data.tags!.filter(
          newTag => !prev.some(existing => existing.name === newTag.name)
        );
        return [...prev, ...newTags];
      });
    }
    if (data.dueDate) setDueDate(data.dueDate);
    if (data.timeEstimate) {
      setTimeEstimate(data.timeEstimate);
      setVisibleFields(prev => ({ ...prev, timeEstimate: true }));
    }
    if (data.checklist && data.checklist.length > 0) {
      const newChecklist: Checklist = {
        id: Date.now().toString(),
        name: 'AI Generated Checklist',
        items: data.checklist.map((item, index) => ({
          id: `${Date.now()}-${index}`,
          name: item.name,
          completed: false,
        })),
      };
      setChecklists(prev => [...prev, newChecklist]);
      setVisibleFields(prev => ({ ...prev, checklist: true }));
    }
    
    setShowAIPanel(false);
  };

  const toggleField = (field: string) => {
    setVisibleFields(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
  };

  const handleAddChecklistItem = (checklistId: string) => {
    const itemName = newChecklistItem[checklistId]?.trim();
    if (!itemName) return;

    setChecklists(checklists.map(c =>
      c.id === checklistId
        ? { ...c, items: [...c.items, { id: Date.now().toString(), name: itemName, completed: false }] }
        : c
    ));
    setNewChecklistItem({ ...newChecklistItem, [checklistId]: '' });
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
          className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Plus className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Create Task</h2>
                <p className="text-xs text-gray-500">Add a new task to your list</p>
              </div>
            </div>
            <button
              onClick={closeCreateModal}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : (
              <div className="space-y-5">
                {/* List Selector */}
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">List:</span>
                  {(availableLists.length > 0 || lists.length > 0) ? (
                    <div className="relative">
                      <select
                        value={currentList?.id || ''}
                        onChange={(e) => {
                          const allLists = availableLists.length > 0 ? availableLists : lists;
                          const selectedList = allLists.find(l => l.id === e.target.value);
                          if (selectedList) {
                            setCurrentList(selectedList);
                            setError(null);
                          }
                        }}
                        className={cn(
                          "appearance-none pl-3 pr-8 py-1.5 rounded-lg text-sm font-medium border cursor-pointer",
                          "focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500",
                          currentList
                            ? "bg-purple-50 border-purple-200 text-purple-700"
                            : "bg-red-50 border-red-200 text-red-600"
                        )}
                      >
                        <option value="">Select a list...</option>
                        {(availableLists.length > 0 ? availableLists : lists).map((list) => (
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={taskName}
                      onChange={(e) => {
                        setTaskName(e.target.value);
                        if (error) setError(null);
                      }}
                      onKeyDown={handleInputKeyDown}
                      onPaste={handlePaste}
                      placeholder="What needs to be done?"
                      className={cn(
                        "w-full px-4 py-3 rounded-xl text-gray-900 placeholder-gray-400",
                        "border-2 transition-all",
                        "focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10",
                        error ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50/50"
                      )}
                    />
                    <button
                      onClick={() => setShowAIPanel(!showAIPanel)}
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
                        showAIPanel
                          ? "bg-purple-100 text-purple-600"
                          : "text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                      )}
                      title="AI Assistant (press /)"
                    >
                      <Sparkles className="h-4 w-4" />
                    </button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠️</span> {error}
                    </p>
                  )}
                </div>

                {/* Description */}
                {!showDescription ? (
                  <button
                    onClick={() => setShowDescription(true)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Add description</span>
                  </button>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add more details..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 resize-none h-24 bg-gray-50/50"
                    />
                  </div>
                )}

                {/* AI Assistant Panel */}
                <AIAssistantPanel
                  isOpen={showAIPanel}
                  onClose={() => setShowAIPanel(false)}
                  onExtract={handleAIExtract}
                  listId={currentList?.id}
                  currentTaskName={taskName}
                />

                {/* Checklists */}
                {checklists.length > 0 && (
                  <div className="space-y-3">
                    {checklists.map((checklist) => (
                      <div
                        key={checklist.id}
                        className="border border-gray-200 rounded-xl p-4 bg-gray-50/50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-sm text-gray-900">
                            {checklist.name}
                          </span>
                          <button
                            onClick={() => setChecklists(checklists.filter(c => c.id !== checklist.id))}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          {checklist.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 group">
                              <div className="w-4 h-4 border-2 border-gray-300 rounded" />
                              <span className="text-sm text-gray-600 flex-1">{item.name}</span>
                              <button
                                onClick={() => {
                                  setChecklists(checklists.map(c =>
                                    c.id === checklist.id
                                      ? { ...c, items: c.items.filter(i => i.id !== item.id) }
                                      : c
                                  ));
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <input
                            value={newChecklistItem[checklist.id] || ''}
                            onChange={(e) =>
                              setNewChecklistItem({ ...newChecklistItem, [checklist.id]: e.target.value })
                            }
                            placeholder="Add item..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddChecklistItem(checklist.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddChecklistItem(checklist.id)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Fields Row */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Task Details
                  </label>
                  
                  {/* Selected Items Display */}
                  {(tags.length > 0 || assignees.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button
                          key={tag.name}
                          onClick={() => setTags(tags.filter(t => t.name !== tag.name))}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
                          style={{
                            backgroundColor: tag.tag_bg,
                            color: tag.tag_fg || '#fff',
                          }}
                        >
                          #{tag.name}
                          <X className="w-3 h-3" />
                        </button>
                      ))}

                      {assignees.map((assignee) => (
                        <button
                          key={assignee.id}
                          onClick={() => setAssignees(assignees.filter(a => a.id !== assignee.id))}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
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

                  {/* Field Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {/* Status */}
                    <StatusPopover
                      selected={status}
                      onSelect={setStatus}
                      statuses={availableStatuses}
                    >
                      <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: status?.color || '#9CA3AF' }}
                        />
                        <span>{status?.status || 'Status'}</span>
                        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    </StatusPopover>

                    {/* Priority */}
                    {visibleFields.priority && (
                      <PriorityPopover selected={priority} onSelect={setPriority}>
                        <button
                          className={cn(
                            "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                            priority
                              ? "text-white"
                              : "border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                          )}
                          style={priority ? { backgroundColor: getPriorityColor(priority.id) } : undefined}
                        >
                          <Flag className="h-3.5 w-3.5" />
                          <span>{priority?.label || 'Priority'}</span>
                          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                        </button>
                      </PriorityPopover>
                    )}

                    {/* Due Date */}
                    {visibleFields.dueDate && (
                      <DueDatePopover
                        dueDate={dueDate}
                        startDate={startDate}
                        timeEstimate={timeEstimate}
                        onDueDateChange={setDueDate}
                        onStartDateChange={setStartDate}
                        onTimeEstimateChange={setTimeEstimate}
                      >
                        <button
                          className={cn(
                            "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                            dueDate
                              ? "bg-purple-50 border border-purple-200 text-purple-700"
                              : "border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                          )}
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{dueDate ? new Date(dueDate).toLocaleDateString() : 'Due date'}</span>
                        </button>
                      </DueDatePopover>
                    )}

                    {/* Assignee */}
                    {visibleFields.assignee && (
                      <AssigneePopover
                        selected={assignees}
                        onSelect={(member) => {
                          if (!assignees.some(a => a.id === member.id)) {
                            setAssignees([...assignees, member]);
                          }
                        }}
                        members={availableMembers}
                      >
                        <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                          <User className="h-3.5 w-3.5" />
                          <span>Assignee</span>
                        </button>
                      </AssigneePopover>
                    )}

                    {/* Tags */}
                    {visibleFields.tags && (
                      <TagsPopover
                        selected={tags}
                        onSelect={(tag) => {
                          if (!tags.some(t => t.name === tag.name)) {
                            setTags([...tags, tag]);
                          }
                        }}
                        tags={availableTags}
                      >
                        <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                          <Tag className="h-3.5 w-3.5" />
                          <span>Tags</span>
                        </button>
                      </TagsPopover>
                    )}

                    {/* Time Estimate */}
                    {visibleFields.timeEstimate && (
                      <div className="relative" ref={timeEstimateRef}>
                        <button
                          onClick={() => setShowTimeEstimateInput(!showTimeEstimateInput)}
                          className={cn(
                            "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                            timeEstimate
                              ? "bg-purple-50 border border-purple-200 text-purple-700"
                              : "border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                          )}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>{timeEstimate ? `${timeEstimate}h` : 'Estimate'}</span>
                        </button>

                        {showTimeEstimateInput && (
                          <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50 w-52">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Time Estimate
                            </label>
                            <input
                              type="number"
                              value={timeEstimate}
                              onChange={(e) => setTimeEstimate(e.target.value)}
                              placeholder="Hours"
                              min="0"
                              step="0.5"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 mb-3"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setTimeEstimate('');
                                  setShowTimeEstimateInput(false);
                                }}
                                className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                Clear
                              </button>
                              <button
                                onClick={() => setShowTimeEstimateInput(false)}
                                className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Checklist */}
                    {visibleFields.checklist && (
                      <ChecklistPopover
                        onAdd={(name) => {
                          setChecklists([
                            ...checklists,
                            { id: Date.now().toString(), name, items: [] },
                          ]);
                        }}
                      >
                        <button className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                          <CheckSquare className="h-3.5 w-3.5" />
                          <span>Checklist</span>
                        </button>
                      </ChecklistPopover>
                    )}

                    {/* Add More Fields */}
                    <AddFieldsDropdown
                      visibleFields={visibleFields}
                      onToggleField={toggleField}
                      onOpenAllFields={() => setShowChooseFieldModal(true)}
                    />
                  </div>
                </div>

                {/* Ask AI Chat Panel */}
                <AskAIChat
                  isOpen={showAskAIChat}
                  onClose={() => setShowAskAIChat(false)}
                  taskName={taskName}
                  description={description}
                  onApplyPriority={setPriority}
                  onApplyTags={(newTags) => setTags([...tags, ...newTags])}
                  onApplyDueDate={setDueDate}
                  availableTags={availableTags}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setShowAskAIChat(!showAskAIChat)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                showAskAIChat
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Sparkles className="h-4 w-4 text-purple-500" />
              Ask AI
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={closeCreateModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!taskName.trim() || submitting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
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
          if (fieldId in visibleFields) {
            setVisibleFields(prev => ({ ...prev, [fieldId]: visible }));
          }
        }}
      />
    </>
  );
};

export default CreateTaskModal;