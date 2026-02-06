'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Star,
  Share2,
  Eye,
  Bell,
  ChevronDown,
  Calendar,
  User as UserIcon,
  Flag,
  Clock,
  Hash,
  Plus,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  MessageCircle,
  Lock,
  Smile,
  Paperclip,
  AtSign,
  Send,
  Check,
  Maximize2,
  Minimize2,
  FileText,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import { cn, type CountdownTime } from '@/lib/utils';
import { useTaskStore, useWorkspaceStore } from '@/stores';
import { api } from '@/lib/api';
import { useCreateComment, useCountdown, useTaskAccountability } from '@/hooks';
import { Avatar } from '@/components/ui/avatar';
import toast from 'react-hot-toast';
import type { User, Status, Tag, TaskAccountability, TimeEntry, Priority } from '@/types';

// Priority type from PriorityPopover (uses 'label' instead of 'priority')
interface PopoverPriority {
  id: string;
  label: string;
  color: string;
  textColor: string;
}

// Panels — self-contained, just need taskId
import { ActivityPanel, CommentsPanel, HashtagsPanel, LinksPanel } from '@/components/panels';

// Popovers — render-prop pattern (children = trigger)
import {
  StatusPopover,
  PriorityPopover,
  AssigneePopover,
  DueDatePopover,
  TagsPopover,
} from '@/components/tasks/popovers';

// Extracted components
import TrackTimeDropdown from './TrackTimeDropdown';
import TaskItemsTabs from './TaskItemsTabs';
import SetETADialog from './SetETADialog';
import ETAExpiredDialog from './ETAExpiredDialog';

// ============================================================
// Small Inline Helpers
// ============================================================

type RightPanelTab = 'activity' | 'hashtags' | 'documents' | 'comments';

const TimeBox: React.FC<{ value: number; label: string; isOverdue?: boolean }> = ({ value, label, isOverdue }) => (
  <div className="text-center">
    <div className={cn(
      "text-[24px] font-bold leading-none",
      isOverdue ? "text-red-500" : "text-[#1A1A2E] dark:text-white"
    )}>
      {isOverdue ? "00" : String(value).padStart(2, '0')}
    </div>
    <div className={cn(
      "text-[10px] mt-0.5",
      isOverdue ? "text-red-400" : "text-[#9CA3AF] dark:text-gray-500"
    )}>
      {label}
    </div>
  </div>
);

const FieldRow: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({
  icon,
  label,
  children,
}) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-[#F3F4F6] dark:border-gray-700 last:border-0">
    <div className="flex items-center gap-2.5 w-[120px] flex-shrink-0">
      <span className="text-[#9CA3AF] dark:text-gray-500">{icon}</span>
      <span className="text-[13px] text-[#6B7280] dark:text-gray-400 font-medium">{label}</span>
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

const SidebarIcon: React.FC<{
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  label?: string;
}> = ({ icon, active, onClick, label }) => (
  <button
    onClick={onClick}
    title={label}
    className={cn(
      'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
      active ? 'bg-[#F3F0FF] dark:bg-purple-900/30 text-[#7C3AED] dark:text-purple-400' : 'text-[#9CA3AF] dark:text-gray-500 hover:bg-[#F5F5F7] dark:hover:bg-gray-700 hover:text-[#6B7280] dark:hover:text-gray-300'
    )}
  >
    {icon}
  </button>
);

const formatDateShort = (date: string | number | undefined | null): string => {
  if (!date || date === 'null' || date === 'undefined' || date === 0) return 'Set date';
  
  let d: Date;
  if (typeof date === 'string') {
    const parsed = parseInt(date, 10);
    // Only use parsed number if it's a valid positive timestamp
    if (!isNaN(parsed) && parsed > 1000000000) {
      d = new Date(parsed);
    } else {
      d = new Date(date);
    }
  } else {
    d = new Date(date);
  }
  
  if (isNaN(d.getTime()) || d.getTime() <= 0 || d.getFullYear() === 1970) return 'Set date';
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
};

const formatDueDateFull = (date: string | number | undefined | null): string => {
  if (!date || date === 'null' || date === 'undefined') return '';
  const d = new Date(typeof date === 'string' ? (parseInt(date, 10) || date) : date);
  if (isNaN(d.getTime()) || d.getTime() <= 0) return '';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Handles both @/types Priority (with 'priority' field) and PopoverPriority (with 'label' field)
const getPriorityConfig = (priority: Priority | PopoverPriority | null | undefined) => {
  if (!priority) return { color: '#9CA3AF', label: 'None' };

  // Check for 'priority' field (from @/types) or 'label' field (from popover)
  const priorityName = ('priority' in priority && priority.priority)
    ? priority.priority?.toLowerCase()
    : ('label' in priority ? (priority as PopoverPriority).label?.toLowerCase() : '');
  const id = priority.id?.toString() || '';

  switch (id) {
    case '1': return { color: '#EF4444', label: 'Urgent' };
    case '2': return { color: '#F59E0B', label: 'High' };
    case '3': return { color: '#3B82F6', label: 'Normal' };
    case '4': return { color: '#6B7280', label: 'Low' };
  }

  // Fallback to name matching
  switch (priorityName) {
    case 'urgent': return { color: '#EF4444', label: 'Urgent' };
    case 'high': return { color: '#F59E0B', label: 'High' };
    case 'normal': return { color: '#3B82F6', label: 'Normal' };
    case 'low': return { color: '#6B7280', label: 'Low' };
    default: return { color: '#9CA3AF', label: 'None' };
  }
};

// Get ETA status colors based on accountability data
// Priority: 1. status (RED/ORANGE) 2. isExpired 3. <24h warning 4. GREEN/default
const getEtaStatusColors = (accountability?: TaskAccountability | null, countdown?: CountdownTime | null) => {
  // 1. Check status first (strike-based)
  const status = (accountability?.status || '').toUpperCase();

  if (status === 'RED') {
    return { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' };
  }
  if (status === 'ORANGE') {
    return { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' };
  }

  // 2. Check if expired
  if (accountability?.isExpired) {
    return { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' };
  }

  // 3. Check if less than 24 hours remaining (warning)
  if (countdown && !countdown.isOverdue && countdown.totalSeconds < 86400) {
    return { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' };
  }

  // 4. Green status or default
  if (status === 'GREEN' || accountability?.currentEta) {
    return { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500' };
  }

  // Default: gray (no accountability set)
  return { bg: 'bg-[#F3F4F6]', text: 'text-[#1A1A2E]', dot: 'bg-gray-400' };
};

// ============================================================
// Common Emoji List
// ============================================================

const EMOJI_LIST = [
  { category: 'Smileys', emojis: ['😀', '😂', '😊', '🥰', '😎', '🤔', '😅', '😢', '😡', '🥳'] },
  { category: 'Hands', emojis: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '💪', '👋', '🫡'] },
  { category: 'Objects', emojis: ['🔥', '⭐', '💡', '🎯', '🚀', '✅', '❌', '⚡', '💬', '📌'] },
  { category: 'Symbols', emojis: ['❤️', '💜', '💚', '🏆', '🎉', '📎', '🔗', '⏰', '📝', '🏷️'] },
];

// ============================================================
// Comment Input Bar (small, kept inline)
// ============================================================

const CommentInputBar: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  taskId: string;
  members?: User[];
}> = ({ value, onChange, onSubmit, submitting, taskId, members = [] }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const mentionRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (mentionRef.current && !mentionRef.current.contains(e.target as Node)) {
        setShowMentionList(false);
        setMentionSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.slice(0, start) + text + value.slice(end);
    onChange(newValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    });
  }, [value, onChange]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    insertAtCursor(emoji);
    setShowEmojiPicker(false);
  }, [insertAtCursor]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;
    setIsUploading(true);
    try {
      await api.uploadAttachment(taskId, file);
      toast.success(`Uploaded: ${file.name}`);
      insertAtCursor(`[📎 ${file.name}] `);
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [taskId, insertAtCursor]);

  const handleMentionSelect = useCallback((user: User) => {
    insertAtCursor(`@${user.username || user.email || 'user'} `);
    setShowMentionList(false);
    setMentionSearch('');
  }, [insertAtCursor]);

  const handleHashtagInsert = useCallback(() => {
    insertAtCursor('#');
  }, [insertAtCursor]);

  const filteredMembers = members.filter((m) => {
    if (!mentionSearch) return true;
    const q = mentionSearch.toLowerCase();
    return (m.username?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q));
  });

  return (
    <div className="p-3 border-t border-[#ECEDF0] dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="border border-[#E5E7EB] dark:border-gray-700 rounded-lg overflow-hidden">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder='Type a message... Use # for hashtags'
          className="w-full px-3 py-2.5 text-[12px] text-[#1A1A2E] dark:text-white placeholder-[#9CA3AF] dark:placeholder-gray-500 resize-none focus:outline-none bg-white dark:bg-gray-800"
          rows={2}
        />
        <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 border-t border-[#F3F4F6] dark:border-gray-700">
          <div className="flex items-center gap-2 relative">
            {/* Emoji Picker */}
            <div ref={emojiRef} className="relative">
              <button
                onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowMentionList(false); }}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  showEmojiPicker ? 'text-[#7C3AED] bg-[#F3F0FF]' : 'text-[#B0B0B0] dark:text-gray-500 hover:text-[#6B7280] dark:hover:text-gray-300'
                )}
                title="Insert emoji"
              >
                <Smile className="h-4 w-4" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 w-[280px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-[#E5E7EB] dark:border-gray-700 p-3 z-50">
                  {EMOJI_LIST.map((group) => (
                    <div key={group.category} className="mb-2 last:mb-0">
                      <p className="text-[10px] font-medium text-[#9CA3AF] dark:text-gray-500 mb-1 uppercase tracking-wide">{group.category}</p>
                      <div className="flex flex-wrap gap-1">
                        {group.emojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleEmojiSelect(emoji)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F0FF] dark:hover:bg-gray-700 text-lg transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* File Attachment */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={cn(
                'p-1.5 rounded transition-colors',
                isUploading ? 'text-[#7C3AED]' : 'text-[#B0B0B0] dark:text-gray-500 hover:text-[#6B7280] dark:hover:text-gray-300'
              )}
              title="Attach file"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </button>

            {/* @Mention */}
            <div ref={mentionRef} className="relative">
              <button
                onClick={() => { setShowMentionList(!showMentionList); setShowEmojiPicker(false); }}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  showMentionList ? 'text-[#7C3AED] bg-[#F3F0FF]' : 'text-[#B0B0B0] dark:text-gray-500 hover:text-[#6B7280] dark:hover:text-gray-300'
                )}
                title="Mention someone"
              >
                <AtSign className="h-4 w-4" />
              </button>
              {showMentionList && (
                <div className="absolute bottom-full left-0 mb-2 w-[220px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-[#E5E7EB] dark:border-gray-700 z-50 overflow-hidden">
                  <div className="p-2 border-b border-[#F3F4F6] dark:border-gray-700">
                    <input
                      type="text"
                      value={mentionSearch}
                      onChange={(e) => setMentionSearch(e.target.value)}
                      placeholder="Search members..."
                      className="w-full px-2 py-1.5 text-xs bg-[#F5F5F7] dark:bg-gray-700 rounded-md focus:outline-none text-[#1A1A2E] dark:text-white placeholder-[#9CA3AF]"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-[180px] overflow-y-auto py-1">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => handleMentionSelect(member)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F5F5F7] dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <Avatar name={member.username || member.email || 'U'} src={member.profilePicture} size="xs" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[#1A1A2E] dark:text-white truncate">{member.username || 'User'}</p>
                            {member.email && <p className="text-[10px] text-[#9CA3AF] truncate">{member.email}</p>}
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-[#9CA3AF] text-center py-3">No members found</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Hashtag Insertion */}
            <button
              onClick={handleHashtagInsert}
              className="p-1.5 text-[#B0B0B0] dark:text-gray-500 hover:text-[#7C3AED] dark:hover:text-purple-400 hover:bg-[#F3F0FF] dark:hover:bg-purple-900/30 rounded transition-colors"
              title="Insert hashtag"
            >
              <Hash className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={onSubmit}
            disabled={!value.trim() || submitting}
            className={cn(
              'p-2 rounded-lg transition-colors',
              value.trim() ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white' : 'text-[#C4C4C4] dark:text-gray-600'
            )}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <p className="text-[10px] text-[#9CA3AF] dark:text-gray-500 mt-1.5 text-center">Press Cmd + Enter to send</p>
    </div>
  );
};

// ============================================================
// Main Modal Component
// ============================================================

export const TaskDetailModal: React.FC = () => {
  // ---- Store ----
  const { selectedTask, isModalOpen, closeTaskModal, updateTask } = useTaskStore();
  const { currentWorkspace, currentSpace, currentList } = useWorkspaceStore();

  // ---- Local state ----
  const [activeRightTab, setActiveRightTab] = useState<RightPanelTab>('activity');
  const [comment, setComment] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [hashtagFilter, setHashtagFilter] = useState<string | null>(null);
  const [extractedHashtags, setExtractedHashtags] = useState<string[]>([]);

  // ETA Dialog state
  const [showSetETADialog, setShowSetETADialog] = useState(false);
  const [showETAExpiredDialog, setShowETAExpiredDialog] = useState(false);

  // Timer state (kept local until useTimerStore is wired)
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeTracked, setTimeTracked] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);

  // Members for AssigneePopover
  const [members, setMembers] = useState<User[]>([]);

  // ---- Hooks ----
  const createComment = useCreateComment();
  const countdown = useCountdown(selectedTask?.due_date);
  const { data: accountability } = useTaskAccountability(selectedTask?.id ? String(selectedTask.id) : null);

  // ---- Derived values ----
  const task = selectedTask;
  const taskId = task ? String(task.id) : '';
  const listId = task?.list?.id || currentList?.id || '';
  const teamId = currentWorkspace?.id || '';
  const assignees = task?.assignees || [];
  const tags = task?.tags || [];
  const priorityConfig = getPriorityConfig(task?.priority);

  // ---- Data fetching ----
  useEffect(() => {
    if (!isModalOpen || !teamId) return;

    const fetchData = async () => {
      try {
        const membersData = await api.getMembers(teamId);
        setMembers(Array.isArray(membersData) ? membersData : []);
      } catch {
        if (task?.assignees) setMembers(task.assignees);
      }

      if (task?.id) {
        const tid = String(task.id);
        try {
          if (task.time_spent) setTimeTracked(Number(task.time_spent) || 0);
          const timeEntries = await api.getTimeEntries(tid);
          if (Array.isArray(timeEntries) && timeEntries.length > 0) {
            const total = timeEntries.reduce((s: number, e: TimeEntry) => s + (e.duration || 0), 0);
            if (total > 0) setTimeTracked(total);
          }
        } catch {
          if (task.time_spent) setTimeTracked(Number(task.time_spent) || 0);
        }

        if (teamId) {
          try {
            const runningTimer = await api.getRunningTimer(teamId);
            if (runningTimer?.data?.task?.id === tid) {
              setTimerRunning(true);
              setTimerStartTime(parseInt(runningTimer.data.start) || Date.now());
            }
          } catch {}
        }
      }
    };

    fetchData();
  }, [isModalOpen, teamId, task?.id, task?.time_spent, task?.assignees]);

  // Fetch hashtags from comments
  useEffect(() => {
    if (!taskId) return;

    const fetchHashtags = async () => {
      try {
        const comments = await api.getTaskComments(taskId);
        if (Array.isArray(comments)) {
          const hashtagSet = new Set<string>();
          comments.forEach((comment: { comment_text?: string; text?: string }) => {
            const text = comment.comment_text || comment.text || '';
            const matches = text.match(/#[\w]+/g) || [];
            matches.forEach((tag: string) => hashtagSet.add(tag.toLowerCase()));
          });
          setExtractedHashtags(Array.from(hashtagSet));
        }
      } catch (err) {
        console.error('Failed to fetch hashtags:', err);
      }
    };

    fetchHashtags();
  }, [taskId]);

  // Show ETAExpiredDialog when accountability requires action
  useEffect(() => {
    if (accountability?.requiresAction && accountability?.isExpired && !accountability?.completedAt) {
      setShowETAExpiredDialog(true);
    }
  }, [accountability?.requiresAction, accountability?.isExpired, accountability?.completedAt]);

  // ---- Handlers ----
  const handleStatusChange = useCallback(
    async (status: Status | string | null) => {
      if (!status || !taskId) return;
      const statusStr = typeof status === 'string' ? status : status.status;
      updateTask(taskId, { status: typeof status === 'object' ? status : { status: statusStr, color: '' } });
      try {
        await api.updateTask(taskId, { status: statusStr });
        toast.success('Status updated');
      } catch {
        toast.error('Failed to update status');
      }
    },
    [taskId, updateTask]
  );

  const handlePriorityChange = useCallback(
    async (priority: Priority | PopoverPriority | null) => {
      if (!taskId) return;
      const priorityId = priority ? Number(priority.id) : null;

      // Convert PopoverPriority to @/types Priority format for the store
      const storePriority: Priority | undefined = priority
        ? {
            id: priority.id,
            priority: 'label' in priority ? priority.label : (priority as Priority).priority,
            color: priority.color,
          }
        : undefined;

      updateTask(taskId, { priority: storePriority });
      try {
        await api.updateTask(taskId, { priority: priorityId });
        toast.success('Priority updated');
      } catch {
        toast.error('Failed to update priority');
      }
    },
    [taskId, updateTask]
  );

  const handleAssigneeSelect = useCallback(
    async (assignee: User) => {
      if (!taskId) return;
      const userId = Number(assignee.id);
      const isSelected = assignees.some((a: User) => Number(a.id) === userId);

      if (isSelected) {
        updateTask(taskId, {
          assignees: assignees.filter((a: User) => Number(a.id) !== userId),
        });
        try {
          await api.updateTask(taskId, { assignees: { rem: [userId] } });
          toast.success('Assignee removed');
        } catch {
          toast.error('Failed to remove assignee');
        }
      } else {
        updateTask(taskId, { assignees: [...assignees, assignee] });
        try {
          await api.updateTask(taskId, { assignees: { add: [userId] } });
          toast.success('Assignee added');
        } catch {
          toast.error('Failed to add assignee');
        }
      }
    },
    [taskId, assignees, updateTask]
  );

  const handleDueDateChange = useCallback(
    async (date: string) => {
      if (!taskId) return;
      const timestamp = date ? new Date(date).getTime() : null;
      updateTask(taskId, { due_date: date || undefined });
      try {
        await api.updateTask(taskId, { due_date: timestamp });
        toast.success('Due date updated');
      } catch {
        toast.error('Failed to update due date');
      }
    },
    [taskId, updateTask]
  );

  const handleStartDateChange = useCallback(
    async (date: string) => {
      if (!taskId) return;
      const timestamp = date ? new Date(date).getTime() : null;
      updateTask(taskId, { start_date: date || undefined });
      try {
        await api.updateTask(taskId, { start_date: timestamp });
        toast.success('Start date updated');
      } catch {
        toast.error('Failed to update start date');
      }
    },
    [taskId, updateTask]
  );

  const handleTagSelect = useCallback(
    (tag: Tag) => {
      if (!taskId) return;
      const isSelected = tags.some((t: Tag) => t.name === tag.name);
      if (isSelected) {
        api.removeTaskTag(taskId, tag.name).catch(() => toast.error('Failed to remove tag'));
        updateTask(taskId, { tags: tags.filter((t: Tag) => t.name !== tag.name) });
      } else {
        api.addTaskTag(taskId, tag.name).catch(() => toast.error('Failed to add tag'));
        updateTask(taskId, { tags: [...tags, tag] });
      }
    },
    [taskId, tags, updateTask]
  );

  const handleStartTimer = useCallback(async () => {
    if (!taskId || !teamId) return;
    try {
      await api.startTimer(teamId, taskId);
    } catch {}
    setTimerRunning(true);
    setTimerStartTime(Date.now());
    toast.success('Timer started');
  }, [taskId, teamId]);

  const handleStopTimer = useCallback(async () => {
    if (!taskId || !timerStartTime || !teamId) return;
    const duration = Date.now() - timerStartTime;
    try {
      await api.stopTimer(teamId);
    } catch {}
    setTimerRunning(false);
    setTimeTracked((prev) => prev + duration);
    setTimerStartTime(null);
    toast.success('Timer stopped');
  }, [taskId, teamId, timerStartTime]);

  const handleAddManualTime = useCallback(
    async (minutes: number) => {
      if (!taskId || !teamId) return;
      const durationMs = minutes * 60 * 1000;
      try {
        await api.addTimeEntry(teamId, {
          taskId,
          start: Date.now() - durationMs,
          duration: durationMs,
        });
      } catch {}
      setTimeTracked((prev) => prev + durationMs);
      toast.success(`Added ${minutes} minutes`);
    },
    [taskId, teamId]
  );

  const handleSubmitComment = useCallback(async () => {
    if (!comment.trim() || !taskId || submittingComment) return;
    setSubmittingComment(true);
    try {
      await createComment.mutate({ taskId, text: comment.trim() });
      setComment('');
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  }, [comment, taskId, submittingComment, createComment]);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMaximized) setIsMaximized(false);
        else closeTaskModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen, closeTaskModal, isMaximized]);

  // ---- Guard ----
  if (!isModalOpen || !selectedTask) return null;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={closeTaskModal} />

      <div
        className={cn(
          'relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex transition-all duration-300',
          isMaximized
            ? 'w-full h-full max-w-full max-h-full rounded-none m-0'
            : 'w-full max-w-[1100px] max-h-[90vh] mx-4'
        )}
      >
        {/* ==================== LEFT PANEL ==================== */}
        <div className="w-[480px] flex flex-col border-r border-[#ECEDF0] dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#ECEDF0] dark:border-gray-700">
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 text-[13px] text-[#5C5C6D] dark:text-gray-400 hover:text-[#1A1A2E] dark:hover:text-white">
                <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                <span>Tasks</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => toast('AI features coming soon!')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] text-[#8C8C9A] dark:text-gray-500 hover:text-[#7C3AED] dark:hover:text-purple-400 hover:bg-[#F3F0FF] dark:hover:bg-purple-900/30 rounded-lg transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ask AI</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsStarred(!isStarred)}
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                  isStarred
                    ? 'bg-amber-50 text-amber-500'
                    : 'bg-[#FEF2F2] text-[#F87171] hover:bg-[#FEE2E2]'
                )}
              >
                <Star className="h-4 w-4" fill={isStarred ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => {
                  if (task?.url) { navigator.clipboard.writeText(task.url); toast.success('Task link copied!'); }
                  else { toast.success('Link copied!'); }
                }}
                title="Copy task link"
                className="w-9 h-9 rounded-lg bg-[#EFF6FF] dark:bg-blue-900/30 text-[#60A5FA] hover:bg-[#DBEAFE] dark:hover:bg-blue-900/50 flex items-center justify-center transition-colors"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  if (task?.url) window.open(task.url, '_blank');
                  else toast('No ClickUp URL available');
                }}
                title="Open in ClickUp"
                className="w-9 h-9 rounded-lg bg-[#FEF9C3] dark:bg-yellow-900/30 text-[#FACC15] hover:bg-[#FEF08A] dark:hover:bg-yellow-900/50 flex items-center justify-center transition-colors"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowSetETADialog(true)}
                title="Set ETA"
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                  accountability?.currentEta && !accountability?.completedAt
                    ? 'bg-[#F3F0FF] text-[#7C3AED]'
                    : 'bg-[#F3F4F6] text-[#9CA3AF] hover:bg-[#E5E7EB]'
                )}
              >
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overflow-x-visible px-5 py-4">
            {/* Title + Countdown Badge */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <h1 className="text-[22px] font-semibold text-[#1A1A2E] dark:text-white leading-tight">
                {task?.name}
              </h1>
              {countdown && (() => {
                const etaColors = getEtaStatusColors(accountability, countdown);
                return (
                  <div
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap flex-shrink-0',
                      etaColors.bg
                    )}
                  >
                    <div className={cn('w-2.5 h-2.5 rounded-full', etaColors.dot)} />
                    <span className={etaColors.text}>
                      {countdown.isOverdue
                        ? `${countdown.days}d, ${countdown.hours}h, ${countdown.minutes}m overdue`
                        : `${countdown.days}d, ${countdown.hours}h, ${countdown.minutes}m, ${countdown.seconds}s left`}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Countdown Timer Boxes */}
            {countdown && (
              <div className="bg-[#F8F9FB] dark:bg-gray-800 rounded-lg p-4 mb-5">
                {/* Due Date Display */}
                {task?.due_date && (
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#E5E7EB] dark:border-gray-700">
                    <Calendar className="h-4 w-4 text-[#7C3AED] dark:text-purple-400" />
                    <span className="text-sm font-medium text-[#1A1A2E] dark:text-white">
                      Due: {formatDueDateFull(task.due_date)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "text-[12px] font-medium leading-tight",
                    countdown.isOverdue ? "text-red-500" : "text-[#6B7280] dark:text-gray-400"
                  )}>
                    {countdown.isOverdue ? (
                      <>
                        Task
                        <br />
                        Overdue
                      </>
                    ) : (
                      <>
                        Time left
                        <br />
                        to deliver
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <TimeBox value={countdown.days} label="Days" isOverdue={countdown.isOverdue} />
                    <span className={cn("text-lg", countdown.isOverdue ? "text-red-300" : "text-[#E5E7EB] dark:text-gray-600")}>|</span>
                    <TimeBox value={countdown.hours} label="Hours" isOverdue={countdown.isOverdue} />
                    <span className={cn("text-lg", countdown.isOverdue ? "text-red-300" : "text-[#E5E7EB] dark:text-gray-600")}>|</span>
                    <TimeBox value={countdown.minutes} label="Minutes" isOverdue={countdown.isOverdue} />
                    <span className={cn("text-lg", countdown.isOverdue ? "text-red-300" : "text-[#E5E7EB] dark:text-gray-600")}>|</span>
                    <TimeBox value={countdown.seconds} label="Seconds" isOverdue={countdown.isOverdue} />
                  </div>
                </div>
              </div>
            )}

            {/* Task Fields — wired to existing popovers */}
            <div className="mb-6">
              <div className="space-y-0">
                <FieldRow icon={<CheckCircle2 className="h-4 w-4" />} label="Status">
                  <StatusPopover
                    selected={task?.status as any}
                    onSelect={handleStatusChange}
                    statuses={currentSpace?.statuses as any}
                  >
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-[#8C8C9A] dark:text-gray-400 hover:bg-[#F5F5F7] dark:hover:bg-gray-700 hover:text-[#7C3AED] dark:hover:text-purple-400 transition-colors">
                      {task?.status?.color && (
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: task?.status?.color }}
                        />
                      )}
                      <span>{task?.status?.status || 'Set status'}</span>
                    </button>
                  </StatusPopover>
                </FieldRow>

                <FieldRow icon={<UserIcon className="h-4 w-4" />} label="Assignees">
                  <AssigneePopover
                    selected={assignees as any}
                    onSelect={handleAssigneeSelect}
                    members={members as any}
                  >
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-[#8C8C9A] dark:text-gray-400 hover:bg-[#F5F5F7] dark:hover:bg-gray-700 hover:text-[#7C3AED] dark:hover:text-purple-400 transition-colors">
                      {assignees.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {assignees.slice(0, 3).map((a: User, i: number) => (
                            <Avatar
                              key={a.id || i}
                              src={a.profilePicture}
                              name={a.username || a.email || 'User'}
                              size="xs"
                            />
                          ))}
                          {assignees.length > 3 && (
                            <span className="text-[11px] text-[#6B7280] dark:text-gray-500">
                              +{assignees.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span>Assign</span>
                      )}
                    </button>
                  </AssigneePopover>
                </FieldRow>

                <FieldRow icon={<Calendar className="h-4 w-4" />} label="Dates">
                  <DueDatePopover
                    dueDate={task?.due_date || ''}
                    startDate={task?.start_date || ''}
                    timeEstimate={task?.time_estimate?.toString() || ''}
                    onDueDateChange={handleDueDateChange}
                    onStartDateChange={handleStartDateChange}
                    onTimeEstimateChange={() => {}}
                  >
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-[#8C8C9A] dark:text-gray-400 hover:bg-[#F5F5F7] dark:hover:bg-gray-700 hover:text-[#7C3AED] dark:hover:text-purple-400 transition-colors">
                      <span>{formatDateShort(task?.start_date)}</span>
                      <span className="text-[#D1D5DB] dark:text-gray-600">→</span>
                      <span>{formatDateShort(task?.due_date)}</span>
                    </button>
                  </DueDatePopover>
                </FieldRow>

                <FieldRow icon={<Flag className="h-4 w-4" />} label="Priority">
                  <PriorityPopover selected={task?.priority as any} onSelect={handlePriorityChange}>
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-[#8C8C9A] dark:text-gray-400 hover:bg-[#F5F5F7] dark:hover:bg-gray-700 hover:text-[#7C3AED] dark:hover:text-purple-400 transition-colors">
                      <Flag className="h-3.5 w-3.5" style={{ color: priorityConfig.color }} />
                      <span>{priorityConfig.label}</span>
                    </button>
                  </PriorityPopover>
                </FieldRow>

                <FieldRow icon={<Clock className="h-4 w-4" />} label="Track Time">
                  <TrackTimeDropdown
                    taskId={taskId}
                    timeTracked={timeTracked}
                    timerRunning={timerRunning}
                    onStartTimer={handleStartTimer}
                    onStopTimer={handleStopTimer}
                    onAddTime={handleAddManualTime}
                  />
                </FieldRow>

                <FieldRow icon={<Hash className="h-4 w-4" />} label="Tags">
                  <TagsPopover
                    selected={tags as any}
                    onSelect={handleTagSelect}
                  >
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-[#8C8C9A] dark:text-gray-400 hover:bg-[#F5F5F7] dark:hover:bg-gray-700 hover:text-[#7C3AED] dark:hover:text-purple-400 transition-colors">
                      {tags.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {tags.slice(0, 3).map((tag: Tag, index: number) => {
                            // Handle different tag name properties from API (name, tag, or label)
                            const tagAny = tag as unknown as Record<string, string>;
                            const tagName = tag.name || tagAny.tag || 'Tag';
                            return (
                              <span
                                key={`${tagName}-${index}`}
                                className="px-2 py-0.5 rounded text-[11px] font-medium"
                                style={{
                                  backgroundColor: tag.tag_bg || tag.color || '#5B4FD1',
                                  color: tag.tag_fg || '#FFFFFF',
                                }}
                              >
                                {tagName}
                              </span>
                            );
                          })}
                          {tags.length > 3 && (
                            <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500">+{tags.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span>Add tags</span>
                      )}
                    </button>
                  </TagsPopover>
                </FieldRow>
              </div>
            </div>

            {/* Hashtags Section - Click to open chat filtered by hashtag */}
            <div className="mb-5">
              <div className="flex items-center justify-between py-2">
                <span className="text-[13px] font-medium text-[#1A1A2E] dark:text-white">Hashtags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {extractedHashtags.length > 0 ? (
                  extractedHashtags.map((hashtag) => (
                    <button
                      key={hashtag}
                      onClick={() => {
                        setHashtagFilter(hashtag);
                        setActiveRightTab('hashtags');
                      }}
                      className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-[#F3F0FF] dark:bg-purple-900/30 text-[#7C3AED] dark:text-purple-400 hover:bg-[#E9E3FF] dark:hover:bg-purple-900/50 transition-colors"
                    >
                      {hashtag}
                    </button>
                  ))
                ) : (
                  <span className="text-[13px] text-[#9CA3AF] dark:text-gray-500">No hashtags yet</span>
                )}
              </div>
            </div>

            {/* Subtasks / Checklist / Actions */}
            <TaskItemsTabs taskId={taskId} listId={listId} />
          </div>
        </div>

        {/* ==================== RIGHT PANEL ==================== */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#ECEDF0] dark:border-gray-700">
            <button
              onClick={async () => {
                if (!taskId) return;
                const isDone = ['closed', 'complete', 'done', 'completed'].includes(task?.status?.status?.toLowerCase() || '');
                const newStatus = isDone ? 'to do' : 'complete';
                try {
                  await api.updateTask(taskId, { status: newStatus });
                  updateTask(taskId, { status: { ...task?.status, status: newStatus, color: isDone ? '#87909e' : '#6bc950' } as any });
                  toast.success(isDone ? 'Task reopened' : 'Task completed');
                } catch { toast.error('Failed to update status'); }
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-[12px] transition-colors',
                ['closed', 'complete', 'done', 'completed'].includes(task?.status?.status?.toLowerCase() || '')
                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'border-[#E5E7EB] dark:border-gray-600 text-[#5C5C6D] dark:text-gray-400 hover:bg-[#F5F5F7] dark:hover:bg-gray-700'
              )}
            >
              <Check className="h-3.5 w-3.5" />
              {['closed', 'complete', 'done', 'completed'].includes(task?.status?.status?.toLowerCase() || '') ? 'Completed' : 'Mark complete'}
            </button>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-2 hover:bg-[#F5F5F7] dark:hover:bg-gray-700 text-[#9CA3AF] dark:text-gray-500 hover:text-[#6B7280] dark:hover:text-gray-300 rounded-lg transition-colors"
                title={isMaximized ? 'Minimize' : 'Maximize'}
              >
                {isMaximized ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={closeTaskModal}
                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#FAFBFC] dark:bg-gray-800 border-b border-[#ECEDF0] dark:border-gray-700">
            <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] dark:text-gray-400">
              <Lock className="h-3.5 w-3.5" />
              <span>This task is private to you.</span>
            </div>
            <button
              onClick={() => toast('Privacy settings are managed in ClickUp')}
              className="text-[11px] text-[#7C3AED] dark:text-purple-400 font-medium hover:underline"
            >
              Make public
            </button>
          </div>

          {/* Tab Content + Sidebar */}
          <div className="flex-1 flex overflow-hidden">
            {/* Panel Content — self-contained panels handle their own data */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {activeRightTab === 'activity' && <ActivityPanel taskId={taskId} />}
              {activeRightTab === 'hashtags' && <HashtagsPanel taskId={taskId} initialFilter={hashtagFilter} />}
              {activeRightTab === 'documents' && <LinksPanel taskId={taskId} />}
              {activeRightTab === 'comments' && <CommentsPanel taskId={taskId} />}

            </div>

            {/* Right Sidebar Icons */}
            <div className="w-14 flex flex-col items-center py-3 gap-1 border-l border-[#ECEDF0] dark:border-gray-700 bg-[#FAFBFC] dark:bg-gray-800">
              <SidebarIcon
                icon={<FileText className="h-4 w-4" />}
                active={activeRightTab === 'activity'}
                onClick={() => setActiveRightTab('activity')}
                label="Activity"
              />
              <div className="w-8 border-t border-[#ECEDF0] dark:border-gray-700 my-2" />
              <SidebarIcon
                icon={<Hash className="h-4 w-4" />}
                active={activeRightTab === 'hashtags'}
                onClick={() => setActiveRightTab('hashtags')}
                label="Hashtags"
              />
              <SidebarIcon
                icon={<Paperclip className="h-4 w-4" />}
                active={activeRightTab === 'documents'}
                onClick={() => setActiveRightTab('documents')}
                label="Docs"
              />
              <div className="flex-1" />
              <SidebarIcon
                icon={<MessageCircle className="h-4 w-4" />}
                active={activeRightTab === 'comments'}
                onClick={() => setActiveRightTab('comments')}
                label="Chat"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ETA Dialogs */}
      <SetETADialog
        open={showSetETADialog}
        onOpenChange={setShowSetETADialog}
        taskId={taskId}
        listId={listId}
        taskName={task?.name || ''}
        dueDate={task?.due_date}
        accountability={accountability}
        onSuccess={() => {
          // Refetch accountability data
          setShowSetETADialog(false);
        }}
      />

      {accountability && (
        <ETAExpiredDialog
          open={showETAExpiredDialog}
          onOpenChange={setShowETAExpiredDialog}
          taskId={taskId}
          taskName={task?.name || ''}
          dueDate={task?.due_date}
          accountability={accountability}
          onSuccess={(result, action) => {
            setShowETAExpiredDialog(false);
            if (action === 'completed') {
              toast.success('Task completed!');
            }
          }}
        />
      )}
    </div>
  );
};

export default TaskDetailModal;