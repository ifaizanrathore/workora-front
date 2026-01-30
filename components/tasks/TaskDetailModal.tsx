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
  Globe,
  Lock,
  Smile,
  Paperclip,
  AtSign,
  Code,
  Image,
  Send,
  Check,
} from 'lucide-react';
import { Task } from '@/types';
import { cn, formatDate, getCountdown, getUserInitials, getAvatarColor, type CountdownTime } from '@/lib/utils';
import { useTaskStore, useAuthStore } from '@/stores';

// Countdown Timer Display Component
const CountdownDisplay: React.FC<{ dueDate: string | number | undefined }> = ({ dueDate }) => {
  const [countdown, setCountdown] = useState<CountdownTime | null>(null);

  const timestamp = useMemo(() => {
    if (!dueDate) return null;
    if (typeof dueDate === 'number') return dueDate;
    const parsed = parseInt(dueDate as string, 10);
    if (!isNaN(parsed)) return parsed;
    const date = new Date(dueDate);
    return !isNaN(date.getTime()) ? date.getTime() : null;
  }, [dueDate]);

  useEffect(() => {
    if (!timestamp) return;
    
    setCountdown(getCountdown(timestamp));
    const timer = setInterval(() => {
      setCountdown(getCountdown(timestamp));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timestamp]);

  if (!countdown) return null;

  return (
    <div className="bg-[#F8F9FB] rounded-xl p-4 mt-4">
      <div className="flex items-center gap-6">
        <span className="text-[13px] text-[#5C5C6D] font-medium">
          Time left<br />to deliver
        </span>
        <div className="flex items-center gap-3">
          <TimeBox value={countdown.days} label="Days" />
          <TimeBox value={countdown.hours} label="Hours" />
          <TimeBox value={countdown.minutes} label="Minutes" />
          <TimeBox value={countdown.seconds} label="Seconds" />
        </div>
      </div>
    </div>
  );
};

const TimeBox: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-[#ECEDF0] min-w-[56px]">
      <span className="text-2xl font-bold text-[#1A1A2E]">
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className="text-[11px] text-[#8C8C9A] mt-1">{label}</span>
  </div>
);

// Main Task Detail Modal Component
export const TaskDetailModal: React.FC = () => {
  const { selectedTask, isModalOpen, closeTaskModal } = useTaskStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'subtasks' | 'checklist' | 'actions'>('subtasks');
  const [activeRightTab, setActiveRightTab] = useState<'activity' | 'progress' | 'world' | 'tags'>('activity');
  const [isFieldsExpanded, setIsFieldsExpanded] = useState(true);
  const [isTagsExpanded, setIsTagsExpanded] = useState(true);
  const [comment, setComment] = useState('');
  const [isStarred, setIsStarred] = useState(false);

  // Countdown for header badge
  const [headerCountdown, setHeaderCountdown] = useState<CountdownTime | null>(null);

  const dueTimestamp = useMemo(() => {
    if (!selectedTask?.due_date) return null;
    const dueDate = selectedTask.due_date;
    if (typeof dueDate === 'number') return dueDate;
    const parsed = parseInt(dueDate as string, 10);
    if (!isNaN(parsed)) return parsed;
    const date = new Date(dueDate);
    return !isNaN(date.getTime()) ? date.getTime() : null;
  }, [selectedTask?.due_date]);

  useEffect(() => {
    if (!dueTimestamp) return;
    
    setHeaderCountdown(getCountdown(dueTimestamp));
    const timer = setInterval(() => {
      setHeaderCountdown(getCountdown(dueTimestamp));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [dueTimestamp]);

  if (!isModalOpen || !selectedTask) return null;

  const task = selectedTask;

  // Mock activity data
  const activities = [
    { id: 1, action: 'You created this task', time: '2 min', type: 'create' },
    { id: 2, action: 'You set status to', value: task.status?.status || 'To Do', time: 'Just now', type: 'status' },
  ];

  // Mock subtasks/checklist
  const checklistItems = task.checklists?.[0]?.items || [
    { id: '1', name: 'Website design', resolved: false },
    { id: '2', name: 'Branding - visiting card,', resolved: false },
    { id: '3', name: 'Social media post', resolved: false },
  ];

  const completedCount = checklistItems.filter((item: any) => item.resolved).length;

  const getPriorityConfig = (priority: string | undefined) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case '1':
        return { color: '#EF4444', bg: '#FEE2E2', label: 'Urgent' };
      case 'high':
      case '2':
        return { color: '#F59E0B', bg: '#FEF3C7', label: 'High' };
      case 'normal':
      case '3':
        return { color: '#3B82F6', bg: '#DBEAFE', label: 'Normal' };
      case 'low':
      case '4':
        return { color: '#6B7280', bg: '#F3F4F6', label: 'Low' };
      default:
        return { color: '#9CA3AF', bg: '#F9FAFB', label: 'None' };
    }
  };

  const priorityConfig = getPriorityConfig(task.priority?.priority || task.priority?.id?.toString());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeTaskModal}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[1000px] max-h-[90vh] overflow-hidden flex">
        {/* Left Panel - Task Details */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-[#ECEDF0]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECEDF0]">
            <div className="flex items-center gap-3">
              {/* Task Type Dropdown */}
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F5F7] rounded-lg text-[13px] text-[#5C5C6D] hover:bg-[#ECEDF0] transition-colors">
                <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                <span>Tasks</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {/* Ask AI Button */}
              <button className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-[#8C8C9A] hover:text-[#7C3AED] hover:bg-[#F3F0FF] rounded-lg transition-colors">
                <Sparkles className="h-4 w-4" />
                <span>Ask AI</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Action Buttons */}
              <button 
                onClick={() => setIsStarred(!isStarred)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isStarred ? "bg-amber-100 text-amber-500" : "bg-[#FEE2E2] text-[#EF4444] hover:bg-red-100"
                )}
              >
                <Star className="h-4 w-4" fill={isStarred ? "currentColor" : "none"} />
              </button>
              <button className="p-2 rounded-lg bg-[#E0E7FF] text-[#6366F1] hover:bg-indigo-200 transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg bg-[#FEF3C7] text-[#F59E0B] hover:bg-amber-200 transition-colors">
                <Eye className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg bg-[#F3F4F6] text-[#6B7280] hover:bg-gray-200 transition-colors">
                <Bell className="h-4 w-4" />
              </button>

              {/* Countdown Badge */}
              {headerCountdown && (
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium ml-2",
                  headerCountdown.isOverdue 
                    ? "bg-red-100 text-red-600"
                    : "bg-red-50 text-red-500"
                )}>
                  <div className="w-2 h-2 rounded-full bg-current" />
                  <span>
                    {headerCountdown.isOverdue 
                      ? 'Overdue' 
                      : `${headerCountdown.days}d, ${headerCountdown.hours}h, ${headerCountdown.minutes}m, ${headerCountdown.seconds}s left`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Task Title */}
            <h1 className="text-2xl font-semibold text-[#1A1A2E] mb-1">
              {task.name}
            </h1>

            {/* Countdown Timer Display */}
            <CountdownDisplay dueDate={task.due_date} />

            {/* Fields Section */}
            <div className="mt-6">
              <button
                onClick={() => setIsFieldsExpanded(!isFieldsExpanded)}
                className="flex items-center justify-between w-full group"
              >
                <span className="text-[15px] font-semibold text-[#1A1A2E]">Fields</span>
                <div className="flex items-center gap-2">
                  <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[#F5F5F7] transition-all">
                    <MoreHorizontal className="h-4 w-4 text-[#8C8C9A]" />
                  </button>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-[#8C8C9A] transition-transform",
                    !isFieldsExpanded && "-rotate-90"
                  )} />
                </div>
              </button>

              {isFieldsExpanded && (
                <div className="mt-3 space-y-3">
                  {/* Status */}
                  <FieldRow
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    label="Status"
                  >
                    <button className="flex items-center gap-2 px-2.5 py-1 rounded-md text-[13px] font-medium hover:bg-[#F5F5F7] transition-colors"
                      style={{ color: task.status?.color || '#6B7280' }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: task.status?.color || '#6B7280' }}
                      />
                      {task.status?.status || 'To Do'}
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      <Check className="h-3.5 w-3.5 text-[#10B981]" />
                    </button>
                  </FieldRow>

                  {/* Assignees */}
                  <FieldRow
                    icon={<User className="h-4 w-4" />}
                    label="Assignees"
                  >
                    <div className="flex items-center gap-1">
                      {task.assignees?.length > 0 ? (
                        task.assignees.map((assignee) => (
                          <div
                            key={assignee.id}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                            style={{ backgroundColor: getAvatarColor(assignee.username || assignee.email) }}
                            title={assignee.username}
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
                  <FieldRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="Dates"
                  >
                    <div className="flex items-center gap-2 text-[13px]">
                      <span className="text-[#9CA3AF]">Start</span>
                      <span className="text-[#9CA3AF]">→</span>
                      <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#F5F5F7] transition-colors">
                        <Calendar className="h-3.5 w-3.5 text-[#8C8C9A]" />
                        <span className="text-[#5C5C6D]">
                          {task.due_date ? formatDate(dueTimestamp || 0, { short: true }) : 'Set date'}
                        </span>
                      </button>
                    </div>
                  </FieldRow>

                  {/* Priority */}
                  <FieldRow
                    icon={<Flag className="h-4 w-4" />}
                    label="Priority"
                  >
                    <button 
                      className="flex items-center gap-2 px-2.5 py-1 rounded-md text-[13px] font-medium hover:bg-[#F5F5F7] transition-colors"
                      style={{ color: priorityConfig.color }}
                    >
                      <Flag className="h-3.5 w-3.5" fill="currentColor" />
                      {priorityConfig.label}
                    </button>
                  </FieldRow>

                  {/* Track Time */}
                  <FieldRow
                    icon={<Clock className="h-4 w-4" />}
                    label="Track Time"
                  >
                    <button className="flex items-center gap-2 px-2.5 py-1 rounded-md text-[13px] text-[#9CA3AF] hover:bg-[#F5F5F7] hover:text-[#7C3AED] transition-colors">
                      <Clock className="h-3.5 w-3.5" />
                      Add time
                    </button>
                  </FieldRow>
                </div>
              )}
            </div>

            {/* Tags Section */}
            <div className="mt-6">
              <button
                onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                className="flex items-center justify-between w-full"
              >
                <span className="text-[15px] font-semibold text-[#1A1A2E]">Use Tags</span>
                <ChevronDown className={cn(
                  "h-4 w-4 text-[#8C8C9A] transition-transform",
                  !isTagsExpanded && "-rotate-90"
                )} />
              </button>

              {isTagsExpanded && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {task.tags?.length > 0 ? (
                    task.tags.map((tag) => (
                      <span
                        key={tag.name}
                        className="px-3 py-1.5 rounded-full text-[12px] font-medium"
                        style={{
                          backgroundColor: tag.tag_bg || '#F3F4F6',
                          color: tag.tag_fg || '#5C5C6D',
                        }}
                      >
                        #{tag.name}
                      </span>
                    ))
                  ) : (
                    <>
                      <TagPill label="#Details" />
                      <TagPill label="#Details" />
                      <TagPill label="#Details" />
                      <TagPill label="#office" />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Subtasks/Checklist Tabs */}
            <div className="mt-6">
              <div className="flex items-center gap-4 border-b border-[#ECEDF0]">
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
              <div className="flex items-center gap-3 mt-4">
                <CheckCircle2 className="h-4 w-4 text-[#7C3AED]" />
                <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#7C3AED] rounded-full transition-all"
                    style={{ width: `${(completedCount / checklistItems.length) * 100}%` }}
                  />
                </div>
                <span className="text-[13px] text-[#8C8C9A]">
                  {completedCount}/{checklistItems.length}
                </span>
                <ChevronDown className="h-4 w-4 text-[#8C8C9A]" />
              </div>

              {/* Checklist Items */}
              <div className="mt-3 space-y-1">
                {checklistItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#F8F9FB] group">
                    <button className="flex-shrink-0">
                      {item.resolved ? (
                        <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                      ) : (
                        <div className="w-5 h-5 rounded border-2 border-[#D1D5DB] group-hover:border-[#7C3AED] transition-colors" />
                      )}
                    </button>
                    <span className={cn(
                      "flex-1 text-[14px]",
                      item.resolved ? "text-[#9CA3AF] line-through" : "text-[#1A1A2E]"
                    )}>
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 hover:bg-[#ECEDF0] rounded">
                        <Clock className="h-3.5 w-3.5 text-[#8C8C9A]" />
                      </button>
                      <button className="p-1 hover:bg-[#ECEDF0] rounded">
                        <User className="h-3.5 w-3.5 text-[#8C8C9A]" />
                      </button>
                      <button className="p-1 hover:bg-[#ECEDF0] rounded">
                        <MoreHorizontal className="h-3.5 w-3.5 text-[#8C8C9A]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Item */}
              <button className="flex items-center gap-2 mt-2 px-2 py-2 text-[13px] text-[#8C8C9A] hover:text-[#7C3AED] transition-colors">
                <Plus className="h-4 w-4" />
                Add an item
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Activity */}
        <div className="w-[400px] flex flex-col bg-[#FAFBFC]">
          {/* Close Button */}
          <button
            onClick={closeTaskModal}
            className="absolute top-4 right-4 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Activity Header */}
          <div className="px-6 py-4 border-b border-[#ECEDF0]">
            <h2 className="text-xl font-semibold text-[#1A1A2E]">Activity</h2>
          </div>

          {/* Privacy Notice */}
          <div className="flex items-center justify-between px-6 py-3 bg-[#F8F9FB]">
            <div className="flex items-center gap-2 text-[13px] text-[#5C5C6D]">
              <Lock className="h-4 w-4" />
              <span>This task is private to you.</span>
            </div>
            <button className="text-[13px] text-[#7C3AED] hover:underline">
              Make public
            </button>
          </div>

          {/* Activity Content with Sidebar */}
          <div className="flex-1 flex overflow-hidden">
            {/* Activity List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-[13px] text-[#5C5C6D]">
                        {activity.action}
                        {activity.value && (
                          <span className="ml-2 px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] rounded text-[12px] font-medium">
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

            {/* Right Icon Sidebar */}
            <div className="w-14 flex flex-col items-center py-4 gap-2 border-l border-[#ECEDF0]">
              <SidebarIcon 
                icon={<Activity className="h-5 w-5" />} 
                active={activeRightTab === 'activity'}
                onClick={() => setActiveRightTab('activity')}
                label="Activity"
              />
              <SidebarIcon 
                icon={<ChevronRight className="h-5 w-5" />} 
                active={activeRightTab === 'progress'}
                onClick={() => setActiveRightTab('progress')}
                label="Progress"
              />
              <SidebarIcon 
                icon={<Globe className="h-5 w-5" />} 
                active={activeRightTab === 'world'}
                onClick={() => setActiveRightTab('world')}
                label="World"
              />
              <SidebarIcon 
                icon={<Hash className="h-5 w-5" />} 
                active={activeRightTab === 'tags'}
                onClick={() => setActiveRightTab('tags')}
                label="Tags"
              />
              <div className="flex-1" />
              <SidebarIcon 
                icon={<Plus className="h-5 w-5" />} 
                onClick={() => {}}
                label="More"
              />
              <SidebarIcon 
                icon={<Sparkles className="h-5 w-5" />} 
                onClick={() => {}}
                label="AI"
              />
            </div>
          </div>

          {/* Comment Input */}
          <div className="px-4 py-4 border-t border-[#ECEDF0] bg-white">
            <div className="relative">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder='Comment press "space" for AI, "/" for commands'
                className="w-full px-4 py-3 pr-12 bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl text-[13px] text-[#1A1A2E] placeholder-[#9CA3AF] resize-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                rows={2}
              />
              
              {/* Action Bar */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <CommentAction icon={<Plus className="h-4 w-4" />} />
                  <CommentAction icon={<Smile className="h-4 w-4" />} active />
                  <CommentAction icon={<Paperclip className="h-4 w-4" />} />
                  <CommentAction icon={<AtSign className="h-4 w-4" />} />
                  <CommentAction icon={<Smile className="h-4 w-4" />} />
                  <CommentAction icon={<Image className="h-4 w-4" />} />
                  <CommentAction icon={<Code className="h-4 w-4" />} />
                  <CommentAction icon={<Paperclip className="h-4 w-4" />} />
                </div>
                <button className="p-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg transition-colors">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const FieldRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}> = ({ icon, label, children }) => (
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2 w-28 text-[#8C8C9A]">
      {icon}
      <span className="text-[13px]">{label}</span>
    </div>
    {children}
  </div>
);

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={cn(
      "pb-2 text-[13px] font-medium transition-colors relative",
      active 
        ? "text-[#1A1A2E]" 
        : "text-[#8C8C9A] hover:text-[#5C5C6D]"
    )}
  >
    {children}
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED] rounded-full" />
    )}
  </button>
);

const TagPill: React.FC<{ label: string }> = ({ label }) => (
  <span className="px-3 py-1.5 bg-[#F3F4F6] rounded-full text-[12px] font-medium text-[#5C5C6D]">
    {label}
  </span>
);

const SidebarIcon: React.FC<{
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  label: string;
}> = ({ icon, active, onClick, label }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
      active 
        ? "bg-[#F3F0FF] text-[#7C3AED]" 
        : "text-[#8C8C9A] hover:bg-[#F5F5F7] hover:text-[#5C5C6D]"
    )}
    title={label}
  >
    {icon}
    <span className="text-[9px] font-medium">{label}</span>
  </button>
);

const CommentAction: React.FC<{ icon: React.ReactNode; active?: boolean }> = ({ icon, active }) => (
  <button className={cn(
    "p-1.5 rounded transition-colors",
    active 
      ? "bg-[#FEE2E2] text-[#EF4444]" 
      : "text-[#9CA3AF] hover:bg-[#F5F5F7] hover:text-[#5C5C6D]"
  )}>
    {icon}
  </button>
);

export default TaskDetailModal;