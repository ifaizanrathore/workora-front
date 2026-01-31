'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Star,
  Share2,
  Eye,
  Bell,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  User,
  Flag,
  Clock,
  Hash,
  Plus,
  Sparkles,
  CheckCircle2,
  Circle,
  MessageSquare,
  Activity,
  Lock,
  Smile,
  Paperclip,
  AtSign,
  Image,
  Send,
  Check,
  Link2,
  Play,
} from 'lucide-react';
import { Task } from '@/types';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/stores';

// ============================================================
// TYPES
// ============================================================

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
}

interface ChecklistItem {
  id: string;
  name: string;
  resolved?: boolean;
  checked?: boolean;
}

// ============================================================
// COUNTDOWN HOOK
// ============================================================

const useCountdown = (targetDate: string | number | undefined): CountdownTime | null => {
  const [countdown, setCountdown] = useState<CountdownTime | null>(null);

  const timestamp = useMemo(() => {
    if (!targetDate) return null;
    if (typeof targetDate === 'number') return targetDate;
    const parsed = parseInt(targetDate as string, 10);
    if (!isNaN(parsed)) return parsed;
    const date = new Date(targetDate);
    return !isNaN(date.getTime()) ? date.getTime() : null;
  }, [targetDate]);

  useEffect(() => {
    if (!timestamp) {
      setCountdown(null);
      return;
    }

    const calculate = () => {
      const now = Date.now();
      const diff = timestamp - now;
      const isOverdue = diff < 0;
      const absDiff = Math.abs(diff);

      const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds, isOverdue });
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [timestamp]);

  return countdown;
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const formatDateShort = (date: string | number | undefined): string => {
  if (!date) return 'Set date';
  const d = typeof date === 'number' ? new Date(date) : new Date(parseInt(date as string) || date);
  if (isNaN(d.getTime())) return 'Set date';
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
};

const getPriorityConfig = (priority: any) => {
  const id = priority?.id?.toString() || priority?.priority?.toLowerCase() || '';
  switch (id) {
    case '1':
    case 'urgent':
      return { color: '#EF4444', bg: '#FEE2E2', label: 'Urgent' };
    case '2':
    case 'high':
      return { color: '#F59E0B', bg: '#FEF3C7', label: 'High' };
    case '3':
    case 'normal':
      return { color: '#3B82F6', bg: '#DBEAFE', label: 'Normal' };
    case '4':
    case 'low':
      return { color: '#6B7280', bg: '#F3F4F6', label: 'Low' };
    default:
      return { color: '#9CA3AF', bg: '#F9FAFB', label: 'None' };
  }
};

const getUserInitials = (name: string | undefined): string => {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
};

const getAvatarColor = (name: string | undefined): string => {
  const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

// Time Box for countdown
const TimeBox: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="text-2xl font-bold text-[#1A1A2E] tabular-nums">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-[11px] text-[#8C8C9A] mt-0.5">{label}</span>
  </div>
);

// Field Row
const FieldRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}> = ({ icon, label, children }) => (
  <div className="flex items-center gap-4 py-2">
    <div className="flex items-center gap-2 w-28 text-[#8C8C9A]">
      {icon}
      <span className="text-[13px]">{label}</span>
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

// Tab Button
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={cn(
      "pb-3 text-[13px] font-medium transition-colors relative",
      active ? "text-[#1A1A2E]" : "text-[#8C8C9A] hover:text-[#5C5C6D]"
    )}
  >
    {children}
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED] rounded-full" />
    )}
  </button>
);

// Tag Pill
const TagPill: React.FC<{ label: string; bg?: string; color?: string }> = ({ 
  label, 
  bg = '#F3F4F6', 
  color = '#5C5C6D' 
}) => (
  <span 
    className="px-3 py-1.5 rounded-full text-[12px] font-medium"
    style={{ backgroundColor: bg, color }}
  >
    {label}
  </span>
);

// Sidebar Icon Button
const SidebarIcon: React.FC<{
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  label?: string;
}> = ({ icon, active, onClick, label }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
      active 
        ? "bg-[#F3F0FF] text-[#7C3AED]" 
        : "text-[#8C8C9A] hover:bg-[#F5F5F7] hover:text-[#5C5C6D]"
    )}
  >
    {icon}
    {label && <span className="text-[10px] font-medium">{label}</span>}
  </button>
);

// Comment Action Button
const CommentAction: React.FC<{ icon: React.ReactNode; active?: boolean }> = ({ icon, active }) => (
  <button className={cn(
    "p-2 rounded-lg transition-colors",
    active 
      ? "bg-[#FEE2E2] text-[#EF4444]" 
      : "text-[#9CA3AF] hover:bg-[#F5F5F7] hover:text-[#5C5C6D]"
  )}>
    {icon}
  </button>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

export const TaskDetailModal: React.FC = () => {
  const { selectedTask, isModalOpen, closeTaskModal, updateTask } = useTaskStore();
  
  // State
  const [activeTab, setActiveTab] = useState<'subtasks' | 'checklist' | 'actions'>('subtasks');
  const [activeRightTab, setActiveRightTab] = useState<'activity' | 'links' | 'tags' | 'more' | 'chat'>('activity');
  const [isFieldsExpanded, setIsFieldsExpanded] = useState(true);
  const [isTagsExpanded, setIsTagsExpanded] = useState(true);
  const [comment, setComment] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  // Countdown
  const countdown = useCountdown(selectedTask?.due_date);
  const priorityConfig = getPriorityConfig(selectedTask?.priority);

  // Initialize checklist items from task
  useEffect(() => {
    if (selectedTask?.checklists?.[0]?.items) {
      setChecklistItems(selectedTask.checklists[0].items);
    } else {
      // Default items if none exist
      setChecklistItems([
        { id: '1', name: 'Website design', resolved: false },
        { id: '2', name: 'Branding - visiting card,', resolved: false },
        { id: '3', name: 'Social media post', resolved: false },
      ]);
    }
  }, [selectedTask]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTaskModal();
    };
    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen, closeTaskModal]);

  // Toggle checklist item
  const toggleChecklistItem = (itemId: string) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, resolved: !item.resolved, checked: !item.checked }
          : item
      )
    );
  };

  if (!isModalOpen || !selectedTask) return null;

  const task = selectedTask;
  const assignees = task.assignees || [];
  const tags = task.tags || [];
  
  const completedCount = checklistItems.filter(item => item.resolved || item.checked).length;
  const totalCount = checklistItems.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Activity data
  const activities = [
    { id: 1, action: 'You created this task', time: '2 min', type: 'create' },
    { id: 2, action: 'You set status to', value: task.status?.status || 'To Do', time: 'Just now', type: 'status' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40"
        onClick={closeTaskModal}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[1100px] max-h-[90vh] overflow-hidden flex mx-4">
        
        {/* ==================== LEFT PANEL ==================== */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-[#ECEDF0]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECEDF0]">
            <div className="flex items-center gap-4">
              {/* Task Type Dropdown */}
              <button className="flex items-center gap-2 text-[14px] text-[#5C5C6D] hover:text-[#1A1A2E] transition-colors">
                <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
                <span>Tasks</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Ask AI Button */}
              <button className="flex items-center gap-2 px-3 py-1.5 text-[14px] text-[#8C8C9A] hover:text-[#7C3AED] hover:bg-[#F3F0FF] rounded-lg transition-colors">
                <Sparkles className="h-4 w-4" />
                <span>Ask AI</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Colored Action Buttons */}
              <button 
                onClick={() => setIsStarred(!isStarred)}
                className={cn(
                  "p-2.5 rounded-lg transition-colors",
                  isStarred ? "bg-amber-100 text-amber-500" : "bg-[#FEE2E2] text-[#EF4444]"
                )}
              >
                <Star className="h-5 w-5" fill={isStarred ? "currentColor" : "none"} />
              </button>
              <button className="p-2.5 rounded-lg bg-[#DBEAFE] text-[#3B82F6] hover:bg-blue-200 transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
              <button className="p-2.5 rounded-lg bg-[#FEF3C7] text-[#F59E0B] hover:bg-amber-200 transition-colors">
                <Eye className="h-5 w-5" />
              </button>
              <button className="p-2.5 rounded-lg bg-[#F3F4F6] text-[#6B7280] hover:bg-gray-200 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            
            {/* Task Title + Countdown Badge */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <h1 className="text-[26px] font-semibold text-[#1A1A2E] leading-tight">
                {task.name}
              </h1>
              
              {/* Countdown Badge */}
              {countdown && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap flex-shrink-0",
                  countdown.isOverdue 
                    ? "bg-red-100 text-red-600"
                    : "bg-red-50 text-red-500"
                )}>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span>
                    {countdown.isOverdue 
                      ? 'Overdue' 
                      : `${countdown.days}d, ${countdown.hours}h, ${countdown.minutes}m, ${countdown.seconds}s left`
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Time Left to Deliver Box */}
            {countdown && (
              <div className="bg-[#F8F9FB] rounded-xl p-5 mb-6">
                <div className="flex items-center gap-8">
                  <div className="text-[14px] text-[#5C5C6D] font-medium leading-tight">
                    Time left<br />to deliver
                  </div>
                  <div className="flex items-center gap-6">
                    <TimeBox value={countdown.days} label="Days" />
                    <div className="text-2xl text-[#D1D5DB] font-light">|</div>
                    <TimeBox value={countdown.hours} label="Hours" />
                    <div className="text-2xl text-[#D1D5DB] font-light">|</div>
                    <TimeBox value={countdown.minutes} label="Minutes" />
                    <div className="text-2xl text-[#D1D5DB] font-light">|</div>
                    <TimeBox value={countdown.seconds} label="Seconds" />
                  </div>
                </div>
              </div>
            )}

            {/* Fields Section */}
            <div className="mb-6">
              <button
                onClick={() => setIsFieldsExpanded(!isFieldsExpanded)}
                className="flex items-center justify-between w-full group mb-3"
              >
                <span className="text-[16px] font-semibold text-[#1A1A2E]">Fields</span>
                <div className="flex items-center gap-2">
                  <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[#F5F5F7] transition-all">
                    <MoreHorizontal className="h-4 w-4 text-[#8C8C9A]" />
                  </button>
                  <ChevronDown className={cn(
                    "h-5 w-5 text-[#8C8C9A] transition-transform",
                    !isFieldsExpanded && "-rotate-90"
                  )} />
                </div>
              </button>

              {isFieldsExpanded && (
                <div className="space-y-1">
                  {/* Status */}
                  <FieldRow icon={<CheckCircle2 className="h-4 w-4" />} label="Status">
                    <button className="flex items-center gap-2 px-2 py-1 rounded-md text-[13px] font-medium hover:bg-[#F5F5F7] transition-colors">
                      <span style={{ color: task.status?.color || '#6B7280' }}>
                        {task.status?.status || 'To Do'}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-[#8C8C9A]" />
                      <Check className="h-3.5 w-3.5 text-[#10B981]" />
                    </button>
                  </FieldRow>

                  {/* Assignees */}
                  <FieldRow icon={<User className="h-4 w-4" />} label="Assignees">
                    <div className="flex items-center gap-1">
                      {assignees.length > 0 ? (
                        assignees.map((assignee: any) => (
                          <div
                            key={assignee.id}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold"
                            style={{ backgroundColor: getAvatarColor(assignee.username || assignee.email) }}
                            title={assignee.username || assignee.email}
                          >
                            {getUserInitials(assignee.username || assignee.email)}
                          </div>
                        ))
                      ) : (
                        <button className="w-7 h-7 rounded-full border-2 border-dashed border-[#D1D5DB] flex items-center justify-center hover:border-[#7C3AED] transition-colors">
                          <Plus className="h-3 w-3 text-[#9CA3AF]" />
                        </button>
                      )}
                    </div>
                  </FieldRow>

                  {/* Dates */}
                  <FieldRow icon={<Calendar className="h-4 w-4" />} label="Dates">
                    <div className="flex items-center gap-2 text-[13px]">
                      <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#F5F5F7] transition-colors">
                        <Calendar className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        <span className="text-[#9CA3AF]">Start</span>
                      </button>
                      <span className="text-[#D1D5DB]">→</span>
                      <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#F5F5F7] transition-colors">
                        <Calendar className="h-3.5 w-3.5 text-[#5C5C6D]" />
                        <span className="text-[#5C5C6D]">{formatDateShort(task.due_date)}</span>
                      </button>
                    </div>
                  </FieldRow>

                  {/* Priority */}
                  <FieldRow icon={<Flag className="h-4 w-4" />} label="Priority">
                    <button className="flex items-center gap-2 px-2 py-1 rounded-md text-[13px] font-medium hover:bg-[#F5F5F7] transition-colors">
                      <Flag className="h-3.5 w-3.5" style={{ color: priorityConfig.color }} fill={priorityConfig.color} />
                      <span style={{ color: priorityConfig.color }}>{priorityConfig.label}</span>
                    </button>
                  </FieldRow>

                  {/* Track Time */}
                  <FieldRow icon={<Clock className="h-4 w-4" />} label="Track Time">
                    <button className="flex items-center gap-2 px-2 py-1 rounded-md text-[13px] text-[#9CA3AF] hover:bg-[#F5F5F7] hover:text-[#7C3AED] transition-colors">
                      <Play className="h-3.5 w-3.5" />
                      <span>Add time</span>
                    </button>
                  </FieldRow>
                </div>
              )}
            </div>

            {/* Tags Section */}
            <div className="mb-6">
              <button
                onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                className="flex items-center justify-between w-full mb-3"
              >
                <span className="text-[16px] font-semibold text-[#1A1A2E]">Use Tags</span>
                <ChevronDown className={cn(
                  "h-5 w-5 text-[#8C8C9A] transition-transform",
                  !isTagsExpanded && "-rotate-90"
                )} />
              </button>

              {isTagsExpanded && (
                <div className="flex flex-wrap gap-2">
                  {tags.length > 0 ? (
                    tags.map((tag: any) => (
                      <TagPill
                        key={tag.name}
                        label={`#${tag.name}`}
                        bg={tag.tag_bg || '#F3F4F6'}
                        color={tag.tag_fg || '#5C5C6D'}
                      />
                    ))
                  ) : (
                    <>
                      <TagPill label="#Details" />
                      <TagPill label="#Details" />
                      <TagPill label="#Details" />
                      <TagPill label="#Details" />
                      <TagPill label="#Details" />
                      <TagPill label="#Details" />
                      <TagPill label="#Details" />
                      <TagPill label="#office" />
                      <TagPill label="#Details" />
                      <TagPill label="#Details" />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Subtasks/Checklist Tabs */}
            <div>
              <div className="flex items-center gap-6 border-b border-[#ECEDF0]">
                <TabButton 
                  active={activeTab === 'subtasks'} 
                  onClick={() => setActiveTab('subtasks')}
                >
                  Subtasks
                </TabButton>
                <TabButton 
                  active={activeTab === 'checklist'} 
                  onClick={() => setActiveTab('checklist')}
                >
                  checklist
                </TabButton>
                <TabButton 
                  active={activeTab === 'actions'} 
                  onClick={() => setActiveTab('actions')}
                >
                  Action items
                </TabButton>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3 mt-4 mb-3">
                <CheckCircle2 className="h-5 w-5 text-[#7C3AED]" />
                <div className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#7C3AED] rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[13px] text-[#8C8C9A] font-medium">
                  {completedCount}/{totalCount}
                </span>
                <ChevronDown className="h-4 w-4 text-[#8C8C9A]" />
              </div>

              {/* Checklist Items */}
              <div className="space-y-0.5">
                {checklistItems.map((item) => {
                  const isChecked = item.resolved || item.checked;
                  return (
                    <div 
                      key={item.id} 
                      className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-[#F8F9FB] group cursor-pointer"
                      onClick={() => toggleChecklistItem(item.id)}
                    >
                      <div className="flex-shrink-0">
                        {isChecked ? (
                          <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-[#D1D5DB] group-hover:border-[#7C3AED] transition-colors" />
                        )}
                      </div>
                      <span className={cn(
                        "flex-1 text-[14px]",
                        isChecked ? "text-[#9CA3AF] line-through" : "text-[#1A1A2E]"
                      )}>
                        {item.name}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 hover:bg-[#ECEDF0] rounded" onClick={(e) => e.stopPropagation()}>
                          <Clock className="h-4 w-4 text-[#8C8C9A]" />
                        </button>
                        <button className="p-1.5 hover:bg-[#ECEDF0] rounded" onClick={(e) => e.stopPropagation()}>
                          <User className="h-4 w-4 text-[#8C8C9A]" />
                        </button>
                        <button className="p-1.5 hover:bg-[#ECEDF0] rounded" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4 text-[#8C8C9A]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Item */}
              <button className="flex items-center gap-2 mt-3 px-2 py-2 text-[13px] text-[#8C8C9A] hover:text-[#7C3AED] transition-colors">
                <Plus className="h-4 w-4" />
                Add an item
              </button>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT PANEL ==================== */}
        <div className="w-[420px] flex flex-col bg-white">
          
          {/* Header with Mark Complete & Close */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECEDF0]">
            <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg text-[14px] text-[#5C5C6D] hover:bg-[#F5F5F7] transition-colors">
              <Check className="h-4 w-4" />
              Mark complete
            </button>
            
            {/* Close Button */}
            <button
              onClick={closeTaskModal}
              className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Privacy Notice */}
          <div className="flex items-center justify-between px-6 py-3 bg-[#F8F9FB] border-b border-[#ECEDF0]">
            <div className="flex items-center gap-2 text-[13px] text-[#5C5C6D]">
              <Lock className="h-4 w-4" />
              <span>This task is private to you.</span>
            </div>
            <button className="text-[13px] text-[#7C3AED] font-medium hover:underline">
              Make public
            </button>
          </div>

          {/* Activity Content + Sidebar */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Activity List */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Activity Header */}
              <div className="px-6 py-4">
                <h2 className="text-[20px] font-semibold text-[#1A1A2E]">Activity</h2>
              </div>

              {/* Activity Items */}
              <div className="flex-1 overflow-y-auto px-6">
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-[13px] text-[#5C5C6D]">
                          {activity.action}
                          {activity.value && (
                            <span 
                              className="ml-2 px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] rounded text-[12px] font-medium"
                            >
                              {activity.value}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-[12px] text-[#9CA3AF] whitespace-nowrap">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              <div className="px-6 py-4 border-t border-[#ECEDF0]">
                <div className="relative">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder='Comment press "space" for AI, "/" for commands'
                    className="w-full px-4 py-3 bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl text-[13px] text-[#1A1A2E] placeholder-[#9CA3AF] resize-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    rows={2}
                  />
                </div>
                
                {/* Comment Actions */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-0.5">
                    <CommentAction icon={<Plus className="h-4 w-4" />} />
                    <CommentAction icon={<Smile className="h-4 w-4" />} active />
                    <CommentAction icon={<Paperclip className="h-4 w-4" />} />
                    <CommentAction icon={<AtSign className="h-4 w-4" />} />
                    <CommentAction icon={<MessageSquare className="h-4 w-4" />} />
                    <CommentAction icon={<Image className="h-4 w-4" />} />
                    <CommentAction icon={<Paperclip className="h-4 w-4" />} />
                  </div>
                  <button className="p-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg transition-colors">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Icon Sidebar */}
            <div className="w-16 flex flex-col items-center py-4 gap-1 border-l border-[#ECEDF0] bg-[#FAFBFC]">
              <SidebarIcon 
                icon={<Activity className="h-5 w-5" />} 
                active={activeRightTab === 'activity'}
                onClick={() => setActiveRightTab('activity')}
                label="Activity"
              />
              
              <div className="w-8 border-t border-[#ECEDF0] my-2" />
              
              <SidebarIcon 
                icon={<Link2 className="h-5 w-5" />} 
                active={activeRightTab === 'links'}
                onClick={() => setActiveRightTab('links')}
              />
              <SidebarIcon 
                icon={<Hash className="h-5 w-5" />} 
                active={activeRightTab === 'tags'}
                onClick={() => setActiveRightTab('tags')}
              />
              <SidebarIcon 
                icon={<Plus className="h-5 w-5" />} 
                active={activeRightTab === 'more'}
                onClick={() => setActiveRightTab('more')}
                label="More"
              />
              <SidebarIcon 
                icon={<MessageSquare className="h-5 w-5" />} 
                active={activeRightTab === 'chat'}
                onClick={() => setActiveRightTab('chat')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;