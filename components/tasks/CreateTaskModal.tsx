'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Download,
  ChevronDown,
  Sparkles,
  Loader2,
  Settings2,
  Circle,
  Clock,
  User,
  Calendar,
  Flag,
  Tag,
  CheckSquare,
  Plus,
  Eye,
  Link2,
  RefreshCw,
  Paperclip,
  FileText,
} from 'lucide-react';
import { useTaskStore, useWorkspaceStore } from '@/stores';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// Sub-components
import { AIAssistantPanel, ExtractedTaskData } from './AIAssistantPanel';
import { AskAIChat } from './AskAIChat';
import { AddFieldsDropdown } from './AddFieldsDropdown';
import { ChooseFieldModal } from './ChooseFieldModal';

// Popovers - import these from your existing popovers
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
        console.log('🔍 CreateTaskModal - Fetching data...');
        console.log('🔍 currentWorkspace:', currentWorkspace?.id, currentWorkspace?.name);
        console.log('🔍 currentSpace:', currentSpace?.id, currentSpace?.name);
        console.log('🔍 currentList:', currentList?.id, currentList?.name);
        console.log('🔍 lists in store:', lists.length);

        // Fetch lists if we don't have any
        if (lists.length === 0) {
          let fetchedLists: any[] = [];
          
          // Try to get lists from current space first
          if (currentSpace?.id) {
            try {
              console.log('📋 Fetching lists from space:', currentSpace.id);
              fetchedLists = await api.getFolderlessLists(currentSpace.id);
              console.log('📋 Got lists from space:', fetchedLists);
            } catch (e) {
              console.warn('Failed to fetch lists from space:', e);
            }
          }
          
          // If still no lists and we have a workspace, try to get spaces first then lists
          if (fetchedLists.length === 0 && currentWorkspace?.id) {
            try {
              console.log('📋 Fetching spaces from workspace:', currentWorkspace.id);
              const spaces = await api.getSpaces(currentWorkspace.id);
              console.log('📋 Got spaces:', spaces);
              
              if (spaces && spaces.length > 0) {
                // Set first space as current if none selected
                if (!currentSpace) {
                  useWorkspaceStore.getState().setCurrentSpace(spaces[0]);
                }
                
                // Get lists from first space
                const spaceId = currentSpace?.id || spaces[0]?.id;
                if (spaceId) {
                  fetchedLists = await api.getFolderlessLists(spaceId);
                  console.log('📋 Got lists from first space:', fetchedLists);
                }
              }
            } catch (e) {
              console.warn('Failed to fetch spaces/lists from workspace:', e);
            }
          }
          
          if (fetchedLists && fetchedLists.length > 0) {
            useWorkspaceStore.getState().setLists(fetchedLists);
            setAvailableLists(fetchedLists);
            // Auto-select first list if none selected
            if (!currentList) {
              console.log('📋 Auto-selecting first list:', fetchedLists[0]?.name);
              setCurrentList(fetchedLists[0]);
            }
          }
        } else if (!currentList && lists.length > 0) {
          // Lists exist but none selected - auto-select first
          console.log('📋 Auto-selecting first list from store:', lists[0]?.name);
          setCurrentList(lists[0]);
          setAvailableLists(lists);
        } else {
          // Use lists from store
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
    // Don't reset availableLists - keep them for next time
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
    
    // Validation
    if (!taskName.trim()) {
      setError('Task name is required');
      return;
    }
    
    if (!currentList?.id) {
      setError('No list selected. Please select a list from the sidebar first.');
      console.error('❌ Cannot create task: No list selected. currentList:', currentList);
      return;
    }

    console.log('📤 Submitting task...');
    console.log('📤 Task Name:', taskName);
    console.log('📤 List ID:', currentList.id);

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

      console.log('📤 Task data:', taskData);

      const task = await api.createTask(taskData);
      console.log('✅ Task created:', task);
      addTask(task);
      closeCreateModal();
    } catch (error: any) {
      console.error('❌ Failed to create task:', error);
      setError(error?.message || 'Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIExtract = (data: ExtractedTaskData) => {
    console.log('AI Extract applied:', data);
    
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
        className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        onClick={closeCreateModal}
      >
        {/* Modal */}
        <div
          className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-[#ECECEC] flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#5B4FD1]">Task</h2>
                <div className="h-0.5 w-10 bg-[#5B4FD1] mt-1.5 rounded-full" />
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="h-5 w-5 text-[#9CA3AF]" strokeWidth={1.5} />
                </button>
                <button
                  onClick={closeCreateModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-[#9CA3AF]" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#5B4FD1]" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status & Task Type Dropdowns */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* List Selector Dropdown */}
                  <div className="relative">
                    {loading ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3F4F6] rounded-full text-xs text-[#6B7280]">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Loading lists...</span>
                      </div>
                    ) : (availableLists.length > 0 || lists.length > 0) ? (
                      <>
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
                            "appearance-none px-3 py-1.5 pr-8 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5B4FD1]/20",
                            currentList
                              ? "bg-[#F3F4F6] border-[#E5E7EB] text-[#374151]"
                              : "bg-red-50 border-red-200 text-red-600"
                          )}
                        >
                          <option value="">Select a list...</option>
                          {(availableLists.length > 0 ? availableLists : lists).map((list) => (
                            <option key={list.id} value={list.id}>
                              📋 {list.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF] pointer-events-none" />
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full text-xs text-yellow-700">
                        <span>⚠️</span>
                        <span>No lists found - create one in ClickUp first</span>
                      </div>
                    )}
                  </div>

                  <StatusPopover
                    selected={status}
                    onSelect={setStatus}
                    statuses={availableStatuses}
                  >
                    <button className="flex items-center gap-2 px-3 py-1.5 border border-[#E5E7EB] rounded-full bg-white text-[#6B7280] hover:bg-gray-50 hover:border-[#D1D5DB] transition-all text-sm">
                      <Settings2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span className="font-medium">{status?.status || 'Status'}</span>
                      <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </StatusPopover>

                  <button className="flex items-center gap-2 px-3 py-1.5 border border-[#E5E7EB] rounded-full bg-white text-[#6B7280] hover:bg-gray-50 hover:border-[#D1D5DB] transition-all text-sm">
                    <Circle className="h-3 w-3 fill-[#6B7280]" />
                    <span className="font-medium">Task</span>
                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>

                {/* Task Name Input */}
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
                    placeholder="Task Name or type '/' for commands"
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#5B4FD1] focus:ring-2 focus:ring-[#5B4FD1]/10 text-sm transition-all pr-10"
                  />
                  <button
                    onClick={() => setShowAIPanel(!showAIPanel)}
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all",
                      showAIPanel
                        ? "bg-[#5B4FD1]/10 text-[#5B4FD1]"
                        : "text-[#9CA3AF] hover:text-[#5B4FD1] hover:bg-[#5B4FD1]/5"
                    )}
                    title="AI Assistant (or press /)"
                  >
                    <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Add Description */}
                {!showDescription ? (
                  <button
                    onClick={() => setShowDescription(true)}
                    className="flex items-center gap-2.5 text-[#6B7280] hover:text-[#111827] transition-colors text-sm"
                  >
                    <FileText className="w-4 h-4 text-[#9CA3AF]" strokeWidth={1.5} />
                    <span>Add description</span>
                  </button>
                ) : (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter task description..."
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#5B4FD1] focus:ring-2 focus:ring-[#5B4FD1]/10 text-sm resize-none h-24 transition-all"
                  />
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
                        className="border border-[#E5E7EB] rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-[#111827]">
                            {checklist.name}
                          </span>
                          <button
                            onClick={() => setChecklists(checklists.filter(c => c.id !== checklist.id))}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <X className="w-4 h-4 text-[#9CA3AF]" />
                          </button>
                        </div>

                        {checklist.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 pl-2 group">
                            <div className="w-4 h-4 border border-[#D1D5DB] rounded flex-shrink-0" />
                            <span className="text-sm text-[#6B7280] flex-1">{item.name}</span>
                            <button
                              onClick={() => {
                                setChecklists(checklists.map(c =>
                                  c.id === checklist.id
                                    ? { ...c, items: c.items.filter(i => i.id !== item.id) }
                                    : c
                                ));
                              }}
                              className="p-0.5 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3 h-3 text-[#9CA3AF]" />
                            </button>
                          </div>
                        ))}

                        <div className="flex items-center gap-2 pl-2">
                          <input
                            value={newChecklistItem[checklist.id] || ''}
                            onChange={(e) =>
                              setNewChecklistItem({ ...newChecklistItem, [checklist.id]: e.target.value })
                            }
                            placeholder="Add item..."
                            className="flex-1 px-2 py-1 text-sm border border-[#D1D5DB] rounded focus:outline-none focus:border-[#5B4FD1]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddChecklistItem(checklist.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddChecklistItem(checklist.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Plus className="w-4 h-4 text-[#6B7280]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  {/* Selected Tags */}
                  {tags.map((tag) => (
                    <button
                      key={tag.name}
                      onClick={() => setTags(tags.filter(t => t.name !== tag.name))}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all group flex items-center gap-1"
                      style={{
                        backgroundColor: tag.tag_bg,
                        color: tag.tag_fg || '#fff',
                      }}
                    >
                      {tag.name}
                      <X className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}

                  {/* Selected Assignees */}
                  {assignees.map((assignee) => (
                    <button
                      key={assignee.id}
                      onClick={() => setAssignees(assignees.filter(a => a.id !== assignee.id))}
                      className="flex items-center gap-1.5 px-2.5 py-1 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-gray-50 text-xs font-medium group"
                    >
                      <div className="w-4 h-4 rounded-full bg-[#5B4FD1] flex items-center justify-center text-white text-[10px]">
                        {getInitial(assignee)}
                      </div>
                      <span>{assignee.username || assignee.email}</span>
                      <X className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}

                  {/* Assignee Button */}
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
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-gray-50 hover:border-[#D1D5DB] transition-all text-xs font-medium">
                        <User className="h-4 w-4" strokeWidth={1.5} />
                        <span>Assignee</span>
                      </button>
                    </AssigneePopover>
                  )}

                  {/* Due Date Button */}
                  {visibleFields.dueDate && (
                    <DueDatePopover
                      dueDate={dueDate}
                      startDate={startDate}
                      timeEstimate={timeEstimate}
                      onDueDateChange={setDueDate}
                      onStartDateChange={setStartDate}
                      onTimeEstimateChange={setTimeEstimate}
                    >
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-gray-50 hover:border-[#D1D5DB] transition-all text-xs font-medium">
                        <Calendar className="h-4 w-4" strokeWidth={1.5} />
                        <span>{dueDate ? new Date(dueDate).toLocaleDateString() : 'Due date'}</span>
                      </button>
                    </DueDatePopover>
                  )}

                  {/* Priority Button */}
                  {visibleFields.priority && (
                    <PriorityPopover selected={priority} onSelect={setPriority}>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-gray-50 hover:border-[#D1D5DB] transition-all text-xs font-medium">
                        <Flag
                          className={cn("h-4 w-4", priority?.textColor)}
                          strokeWidth={1.5}
                        />
                        <span>{priority?.label || 'Normal'}</span>
                      </button>
                    </PriorityPopover>
                  )}

                  {/* Tags Button */}
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
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-gray-50 hover:border-[#D1D5DB] transition-all text-xs font-medium">
                        <Tag className="h-4 w-4" strokeWidth={1.5} />
                        <span>Tags</span>
                      </button>
                    </TagsPopover>
                  )}

                  {/* Checklist Button */}
                  {visibleFields.checklist && (
                    <ChecklistPopover
                      onAdd={(name) => {
                        setChecklists([
                          ...checklists,
                          { id: Date.now().toString(), name, items: [] },
                        ]);
                      }}
                    >
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-gray-50 hover:border-[#D1D5DB] transition-all text-xs font-medium">
                        <CheckSquare className="h-4 w-4" strokeWidth={1.5} />
                        <span>Checklist</span>
                      </button>
                    </ChecklistPopover>
                  )}

                  {/* Time Estimate Button */}
                  {visibleFields.timeEstimate && (
                    <div className="relative" ref={timeEstimateRef}>
                      <button 
                        onClick={() => setShowTimeEstimateInput(!showTimeEstimateInput)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 border rounded-lg transition-all text-xs font-medium",
                          timeEstimate 
                            ? "border-[#5B4FD1] bg-[#5B4FD1]/5 text-[#5B4FD1]"
                            : "border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50 hover:border-[#D1D5DB]"
                        )}
                      >
                        <Clock className="h-4 w-4" strokeWidth={1.5} />
                        <span>{timeEstimate ? `${timeEstimate}h` : 'Time Est.'}</span>
                      </button>
                      
                      {showTimeEstimateInput && (
                        <div className="absolute top-full mt-2 left-0 bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-3 z-50 w-48">
                          <label className="text-xs text-[#6B7280] mb-1.5 block">Time Estimate (hours)</label>
                          <input
                            type="number"
                            value={timeEstimate}
                            onChange={(e) => setTimeEstimate(e.target.value)}
                            placeholder="0"
                            min="0"
                            step="0.5"
                            className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#5B4FD1]"
                            autoFocus
                          />
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => {
                                setTimeEstimate('');
                                setShowTimeEstimateInput(false);
                              }}
                              className="flex-1 px-2 py-1.5 text-xs text-[#6B7280] hover:bg-gray-100 rounded-lg"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => setShowTimeEstimateInput(false)}
                              className="flex-1 px-2 py-1.5 text-xs bg-[#5B4FD1] text-white rounded-lg"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Start Date Button */}
                  {visibleFields.startDate && (
                    <div className="relative">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <button className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 border rounded-lg transition-all text-xs font-medium pointer-events-none",
                        startDate 
                          ? "border-[#5B4FD1] bg-[#5B4FD1]/5 text-[#5B4FD1]"
                          : "border-[#E5E7EB] text-[#6B7280]"
                      )}>
                        <Calendar className="h-4 w-4" strokeWidth={1.5} />
                        <span>{startDate ? new Date(startDate).toLocaleDateString() : 'Start Date'}</span>
                      </button>
                    </div>
                  )}

                  {/* Watchers Button */}
                  {visibleFields.watchers && (
                    <AssigneePopover
                      selected={watchers}
                      onSelect={(member) => {
                        if (!watchers.some(w => w.id === member.id)) {
                          setWatchers([...watchers, member]);
                        }
                      }}
                      members={availableMembers}
                    >
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-gray-50 hover:border-[#D1D5DB] transition-all text-xs font-medium">
                        <Eye className="h-4 w-4" strokeWidth={1.5} />
                        <span>Watchers{watchers.length > 0 ? ` (${watchers.length})` : ''}</span>
                      </button>
                    </AssigneePopover>
                  )}

                  {/* Dependencies Button */}
                  {visibleFields.dependencies && (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-gray-50 hover:border-[#D1D5DB] transition-all text-xs font-medium">
                      <Link2 className="h-4 w-4" strokeWidth={1.5} />
                      <span>Dependencies</span>
                    </button>
                  )}

                  {/* Add Fields Dropdown */}
                  <AddFieldsDropdown
                    visibleFields={visibleFields}
                    onToggleField={toggleField}
                    onOpenAllFields={() => setShowChooseFieldModal(true)}
                  />
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
          <div className="px-6 py-3.5 bg-[#F9FAFB] border-t border-[#ECECEC] flex items-center justify-between flex-shrink-0">
            {/* Ask AI Button */}
            <button
              onClick={() => setShowAskAIChat(!showAskAIChat)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 border rounded-full transition-all text-sm font-medium",
                showAskAIChat
                  ? "border-[#5B4FD1] bg-[#5B4FD1]/5 text-[#5B4FD1]"
                  : "border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-gray-50 hover:border-[#D1D5DB]"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#5B4FD1]" strokeWidth={1.5} />
              <span>Ask AI</span>
            </button>

            {/* Timer */}
            <div className="flex items-center gap-1.5 text-[#9CA3AF]">
              <Clock className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-xs font-medium">{timeEstimate || '0'}h</span>
            </div>

            {/* Create Task Button */}
            <button
              onClick={handleSubmit}
              disabled={!taskName.trim() || submitting}
              className="flex items-center gap-1.5 px-5 py-1.5 bg-[#5B4FD1] text-white rounded-lg hover:bg-[#4A3FC0] active:bg-[#3D35A8] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create Task</span>
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
                </>
              )}
            </button>
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