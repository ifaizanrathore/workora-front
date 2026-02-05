'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Star,
  Share2,
  Eye,
  Bell,
  ChevronDown,
  Calendar,
  User,
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
  Image,
  Send,
  Check,
  Maximize2,
  Minimize2,
  FileText,
  Loader2,
  MoreHorizontal,
  Video,
  Mic,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskStore, useWorkspaceStore } from '@/stores';
import { api } from '@/lib/api';
import { useCreateComment, useCountdown, useTaskAccountability } from '@/hooks';
import { Avatar } from '@/components/ui/avatar';
import toast from 'react-hot-toast';

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
      isOverdue ? "text-red-500" : "text-[#1A1A2E]"
    )}>
      {isOverdue ? "00" : String(value).padStart(2, '0')}
    </div>
    <div className={cn(
      "text-[10px] mt-0.5",
      isOverdue ? "text-red-400" : "text-[#9CA3AF]"
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
  <div className="flex items-center gap-3 py-2.5 border-b border-[#F3F4F6] last:border-0">
    <div className="flex items-center gap-2.5 w-[120px] flex-shrink-0">
      <span className="text-[#9CA3AF]">{icon}</span>
      <span className="text-[13px] text-[#6B7280] font-medium">{label}</span>
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
      active ? 'bg-[#F3F0FF] text-[#7C3AED]' : 'text-[#9CA3AF] hover:bg-[#F5F5F7] hover:text-[#6B7280]'
    )}
  >
    {icon}
  </button>
);

const formatDateShort = (date: string | number | undefined | null): string => {
  if (!date || date === 'null' || date === 'undefined') return 'Set date';
  const d = new Date(typeof date === 'string' ? (parseInt(date, 10) || date) : date);
  if (isNaN(d.getTime()) || d.getTime() <= 0) return 'Set date';
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

const getPriorityConfig = (priority: any) => {
  const id = priority?.id?.toString() || priority?.priority?.toLowerCase() || '';
  switch (id) {
    case '1': case 'urgent': return { color: '#EF4444', label: 'Urgent' };
    case '2': case 'high': return { color: '#F59E0B', label: 'High' };
    case '3': case 'normal': return { color: '#3B82F6', label: 'Normal' };
    case '4': case 'low': return { color: '#6B7280', label: 'Low' };
    default: return { color: '#9CA3AF', label: 'None' };
  }
};

// Get ETA status colors based on accountability data
// Priority: 1. status (RED/ORANGE) 2. isExpired 3. <24h warning 4. GREEN/default
const getEtaStatusColors = (accountability?: any, countdown?: any) => {
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
// Comment Input Bar (small, kept inline)
// ============================================================

const CommentInputBar: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}> = ({ value, onChange, onSubmit, submitting }) => (
  <div className="p-3 border-t border-[#ECEDF0] bg-white">
    <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder='Comment press "space" for AI, "/" for commands'
        className="w-full px-3 py-2.5 text-[12px] text-[#1A1A2E] placeholder-[#9CA3AF] resize-none focus:outline-none bg-white"
        rows={2}
      />
      <div className="flex items-center justify-between px-3 py-2 bg-white border-t border-[#F3F4F6]">
        <div className="flex items-center gap-3">
          {[Plus, Smile, Paperclip, AtSign, MessageSquare, Image, Video, Mic].map((Icon, i) => (
            <button key={i} className="text-[#B0B0B0] hover:text-[#6B7280] transition-colors">
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <button
          onClick={onSubmit}
          disabled={!value.trim() || submitting}
          className={cn(
            'p-2 rounded-lg transition-colors',
            value.trim() ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white' : 'text-[#C4C4C4]'
          )}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
    <p className="text-[10px] text-[#9CA3AF] mt-1.5 text-center">Press Cmd + Enter to send</p>
  </div>
);

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
  const [members, setMembers] = useState<any[]>([]);

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
            const total = timeEntries.reduce((s: number, e: any) => s + (parseInt(e.duration) || 0), 0);
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
          comments.forEach((comment: any) => {
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
    async (status: any) => {
      if (!status || !taskId) return;
      const statusStr = typeof status === 'string' ? status : status.status;
      updateTask(taskId, { status: typeof status === 'object' ? status : { status: statusStr } });
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
    async (priority: any) => {
      if (!taskId) return;
      const priorityId = priority ? Number(priority.id) : null;
      updateTask(taskId, { priority: priority || undefined });
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
    async (assignee: any) => {
      if (!taskId) return;
      const userId = Number(assignee.user?.id || assignee.id);
      const isSelected = assignees.some((a: any) => (a.id || a.user?.id) == userId);

      if (isSelected) {
        updateTask(taskId, {
          assignees: assignees.filter((a: any) => a.id != userId && a.user?.id != userId),
        });
        try {
          await api.updateTask(taskId, { assignees: { rem: [userId] } });
          toast.success('Assignee removed');
        } catch {
          toast.error('Failed to remove assignee');
        }
      } else {
        const user = assignee.user || assignee;
        updateTask(taskId, { assignees: [...assignees, user] });
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
    (tag: any) => {
      if (!taskId) return;
      const isSelected = tags.some((t: any) => t.name === tag.name);
      if (isSelected) {
        api.removeTaskTag(taskId, tag.name).catch(() => toast.error('Failed to remove tag'));
        updateTask(taskId, { tags: tags.filter((t: any) => t.name !== tag.name) });
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
          'relative bg-white rounded-2xl shadow-2xl flex transition-all duration-300',
          isMaximized
            ? 'w-full h-full max-w-full max-h-full rounded-none m-0'
            : 'w-full max-w-[1100px] max-h-[90vh] mx-4'
        )}
      >
        {/* ==================== LEFT PANEL ==================== */}
        <div className="w-[480px] flex flex-col border-r border-[#ECEDF0]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#ECEDF0]">
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 text-[13px] text-[#5C5C6D] hover:text-[#1A1A2E]">
                <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                <span>Tasks</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] text-[#8C8C9A] hover:text-[#7C3AED] hover:bg-[#F3F0FF] rounded-lg transition-colors">
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
              <button className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#60A5FA] hover:bg-[#DBEAFE] flex items-center justify-center transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
              <button className="w-9 h-9 rounded-lg bg-[#FEF9C3] text-[#FACC15] hover:bg-[#FEF08A] flex items-center justify-center transition-colors">
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
              <h1 className="text-[22px] font-semibold text-[#1A1A2E] leading-tight">
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
              <div className="bg-[#F8F9FB] rounded-lg p-4 mb-5">
                {/* Due Date Display */}
                {task?.due_date && (
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#E5E7EB]">
                    <Calendar className="h-4 w-4 text-[#7C3AED]" />
                    <span className="text-sm font-medium text-[#1A1A2E]">
                      Due: {formatDueDateFull(task.due_date)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "text-[12px] font-medium leading-tight",
                    countdown.isOverdue ? "text-red-500" : "text-[#6B7280]"
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
                    <span className={cn("text-lg", countdown.isOverdue ? "text-red-300" : "text-[#E5E7EB]")}>|</span>
                    <TimeBox value={countdown.hours} label="Hours" isOverdue={countdown.isOverdue} />
                    <span className={cn("text-lg", countdown.isOverdue ? "text-red-300" : "text-[#E5E7EB]")}>|</span>
                    <TimeBox value={countdown.minutes} label="Minutes" isOverdue={countdown.isOverdue} />
                    <span className={cn("text-lg", countdown.isOverdue ? "text-red-300" : "text-[#E5E7EB]")}>|</span>
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
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-[#8C8C9A] hover:bg-[#F5F5F7] hover:text-[#7C3AED] transition-colors">
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

                <FieldRow icon={<User className="h-4 w-4" />} label="Assignees">
                  <AssigneePopover
                    selected={assignees as any}
                    onSelect={handleAssigneeSelect}
                    members={members as any}
                  >
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-[#8C8C9A] hover:bg-[#F5F5F7] hover:text-[#7C3AED] transition-colors">
                      {assignees.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {assignees.slice(0, 3).map((a: any, i: number) => (
                            <Avatar
                              key={a.id || i}
                              src={a.profilePicture}
                              name={a.username || a.email || 'User'}
                              size="xs"
                            />
                          ))}
                          {assignees.length > 3 && (
                            <span className="text-[11px] text-[#6B7280]">
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
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-[#8C8C9A] hover:bg-[#F5F5F7] hover:text-[#7C3AED] transition-colors">
                      <span>{formatDateShort(task?.start_date)}</span>
                      <span className="text-[#D1D5DB]">→</span>
                      <span>{formatDateShort(task?.due_date)}</span>
                    </button>
                  </DueDatePopover>
                </FieldRow>

                <FieldRow icon={<Flag className="h-4 w-4" />} label="Priority">
                  <PriorityPopover selected={task?.priority as any} onSelect={handlePriorityChange}>
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-[#8C8C9A] hover:bg-[#F5F5F7] hover:text-[#7C3AED] transition-colors">
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
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-[#8C8C9A] hover:bg-[#F5F5F7] hover:text-[#7C3AED] transition-colors">
                      {tags.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {tags.slice(0, 3).map((tag: any) => (
                            <span
                              key={tag.name}
                              className="px-2 py-0.5 rounded text-[11px] font-medium"
                              style={{
                                backgroundColor: tag.tag_bg || tag.color || '#5B4FD1',
                                color: tag.tag_fg || '#FFFFFF',
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {tags.length > 3 && (
                            <span className="text-[11px] text-[#9CA3AF]">+{tags.length - 3}</span>
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
                <span className="text-[13px] font-medium text-[#1A1A2E]">Hashtags</span>
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
                      className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-[#F3F0FF] text-[#7C3AED] hover:bg-[#E9E3FF] transition-colors"
                    >
                      {hashtag}
                    </button>
                  ))
                ) : (
                  <span className="text-[13px] text-[#9CA3AF]">No hashtags yet</span>
                )}
              </div>
            </div>

            {/* Subtasks / Checklist / Actions */}
            <TaskItemsTabs taskId={taskId} listId={listId} />
          </div>
        </div>

        {/* ==================== RIGHT PANEL ==================== */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#ECEDF0]">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-[12px] text-[#5C5C6D] hover:bg-[#F5F5F7]">
              <Check className="h-3.5 w-3.5" />
              Mark complete
            </button>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-2 hover:bg-[#F5F5F7] text-[#9CA3AF] hover:text-[#6B7280] rounded-lg transition-colors"
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
          <div className="flex items-center justify-between px-4 py-2 bg-[#FAFBFC] border-b border-[#ECEDF0]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
              <Lock className="h-3.5 w-3.5" />
              <span>This task is private to you.</span>
            </div>
            <button className="text-[11px] text-[#7C3AED] font-medium hover:underline">
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

              <CommentInputBar
                value={comment}
                onChange={setComment}
                onSubmit={handleSubmitComment}
                submitting={submittingComment}
              />
            </div>

            {/* Right Sidebar Icons */}
            <div className="w-14 flex flex-col items-center py-3 gap-1 border-l border-[#ECEDF0] bg-[#FAFBFC]">
              <SidebarIcon
                icon={<FileText className="h-4 w-4" />}
                active={activeRightTab === 'activity'}
                onClick={() => setActiveRightTab('activity')}
                label="Activity"
              />
              <div className="w-8 border-t border-[#ECEDF0] my-2" />
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
              <SidebarIcon
                icon={<Plus className="h-4 w-4" />}
                active={false}
                onClick={() => {}}
                label="Add"
              />
              <div className="flex-1" />
              <SidebarIcon
                icon={<MoreHorizontal className="h-4 w-4" />}
                active={false}
                onClick={() => {}}
                label="More"
              />
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