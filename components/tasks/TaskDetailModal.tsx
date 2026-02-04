'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Star,
  Share2,
  Eye,
  Bell,
  ChevronDown,
  ChevronRight,
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
  Play,
  ThumbsUp,
  Timer,
  Mic,
  Video,
  Trash2,
  Maximize2,
  Minimize2,
  FileText,
  Loader2,
  AlertCircle,
  Archive,
  ListTodo,
  CheckSquare,
  MoreHorizontal,
} from 'lucide-react';
import { Task, Comment, TaskAccountability, Status } from '@/types';
import { cn } from '@/lib/utils';
import { useTaskStore, useWorkspaceStore } from '@/stores';
import { api } from '@/lib/api';
import { Avatar, AvatarGroup } from '@/components/ui/avatar';

// ============================================================
// SIMPLE TOAST NOTIFICATION (Built-in)
// ============================================================

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

const ToastContainer: React.FC<{ toasts: ToastMessage[]; onDismiss: (id: string) => void }> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] max-w-[400px] animate-in slide-in-from-right",
            toast.variant === 'destructive' 
              ? "bg-red-50 border border-red-200 text-red-800" 
              : "bg-white border border-gray-200 text-gray-800"
          )}
        >
          {toast.variant === 'destructive' ? (
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{toast.title}</p>
            {toast.description && <p className="text-xs text-gray-500 mt-0.5">{toast.description}</p>}
          </div>
          <button onClick={() => onDismiss(toast.id)} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
};

// ============================================================
// TYPES
// ============================================================

// Extended comment interface to handle various API response formats
interface ExtendedComment extends Comment {
  comment_text?: string;
  text_content?: string;
  comment?: string | { text?: string };
}

// Activity item with all possible fields
interface ActivityItem {
  id: string;
  type?: string;
  field?: string;
  description?: string;
  before?: any;
  after?: any;
  user?: any;
  date?: string;
  date_created?: string;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
}

interface Subtask {
  id: string;
  name: string;
  status: Status;
  assignees: Array<{ id: number; username: string; email: string; profilePicture?: string }>;
  due_date?: string;
}

interface PostponeItem {
  id: string;
  number: number;
  actualProjectTime: string;
  afterGracePeriodTime: string;
  graceTimeRequired: string;
  newTotalHrs: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
  reason?: string;
}

interface ChatMessage {
  id: string;
  user: { name: string; initials: string };
  text: string;
  time: string;
  date: string;
  isMe: boolean;
  attachment?: { name: string; size: string; type: string };
}

type RightPanelTab = 'activity' | 'tags' | 'documents' | 'comments';

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

      setCountdown({
        days: Math.floor(absDiff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((absDiff % (1000 * 60)) / 1000),
        isOverdue,
      });
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

const formatDateShort = (date: string | number | undefined | null): string => {
  if (!date || date === 'null' || date === 'undefined') return 'Set date';
  
  let d: Date;
  
  if (typeof date === 'number') {
    d = new Date(date);
  } else if (typeof date === 'string') {
    const timestamp = parseInt(date, 10);
    if (!isNaN(timestamp) && timestamp > 0) {
      d = new Date(timestamp);
    } else {
      d = new Date(date);
    }
  } else {
    return 'Set date';
  }
  
  if (isNaN(d.getTime()) || d.getTime() <= 0) return 'Set date';
  
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
};

const formatRelativeTime = (dateString: string | number | undefined | null): string => {
  if (!dateString || dateString === 'null' || dateString === 'undefined') return '';
  
  let date: Date;
  
  if (typeof dateString === 'number') {
    if (dateString > 946684800000) {
      date = new Date(dateString);
    } else {
      return '';
    }
  } else {
    const timestamp = parseInt(dateString, 10);
    if (!isNaN(timestamp) && timestamp > 946684800000) {
      date = new Date(timestamp);
    } else {
      date = new Date(dateString);
    }
  }
  
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
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

// ============================================================
// BASIC UI COMPONENTS
// ============================================================

const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => (
  <Loader2 className={cn("animate-spin text-[#7C3AED]", size === 'sm' ? "h-4 w-4" : "h-5 w-5")} />
);

const TimeBox: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="text-2xl font-bold text-[#1A1A2E] tabular-nums">{String(value).padStart(2, '0')}</span>
    <span className="text-[11px] text-[#8C8C9A] mt-0.5">{label}</span>
  </div>
);

const FieldRow: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div className="flex items-center gap-4 py-2.5">
    <div className="flex items-center gap-2.5 w-28 text-[#6B7280]">
      {icon}
      <span className="text-[13px]">{label}</span>
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

// ============================================================
// STATUS DROPDOWN
// ============================================================

const StatusDropdown: React.FC<{
  currentStatus: Status | undefined;
  statuses: Status[];
  onSelect: (status: string) => void;
  loading?: boolean;
}> = ({ currentStatus, statuses, onSelect, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const defaultStatuses: Status[] = statuses.length > 0 ? statuses : [
    { status: 'to do', color: '#808080', type: 'open' },
    { status: 'in progress', color: '#4169E1', type: 'custom' },
    { status: 'complete', color: '#6bc950', type: 'closed' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 text-[13px] hover:bg-[#F5F5F7] px-2 py-1.5 rounded-md transition-colors"
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <span 
              className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase"
              style={{ 
                backgroundColor: currentStatus?.color || '#808080',
                color: '#fff'
              }}
            >
              {currentStatus?.status || 'TO DO'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-[#8C8C9A]" />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 min-w-[140px] z-[60]">
          {defaultStatuses.map((status) => (
            <button
              key={status.status}
              onClick={() => {
                onSelect(status.status);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-left text-[12px] hover:bg-[#F5F5F7] flex items-center gap-2",
                currentStatus?.status?.toLowerCase() === status.status.toLowerCase() && "bg-[#F3F0FF]"
              )}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: status.color }}
              />
              <span className="capitalize">{status.status}</span>
              {currentStatus?.status?.toLowerCase() === status.status.toLowerCase() && (
                <Check className="h-3 w-3 text-[#7C3AED] ml-auto" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// PRIORITY DROPDOWN
// ============================================================

const PRIORITIES = [
  { id: '1', label: 'Urgent', color: '#EF4444' },
  { id: '2', label: 'High', color: '#F59E0B' },
  { id: '3', label: 'Normal', color: '#3B82F6' },
  { id: '4', label: 'Low', color: '#6B7280' },
  { id: null, label: 'None', color: '#9CA3AF' },
];

const PriorityDropdown: React.FC<{
  currentPriority: any;
  onSelect: (priorityId: number | null) => void;
  loading?: boolean;
}> = ({ currentPriority, onSelect, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentId = currentPriority?.id?.toString() || currentPriority?.priority?.toString() || null;
  const current = PRIORITIES.find(p => p.id === currentId) || PRIORITIES[4];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] font-medium hover:bg-[#F5F5F7] transition-colors"
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <Flag className="h-4 w-4" style={{ color: current.color }} fill={current.color} />
            <span style={{ color: current.color }}>{current.label}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#8C8C9A]" />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 min-w-[120px] z-[60]">
          {PRIORITIES.map((priority) => (
            <button
              key={priority.id || 'none'}
              onClick={() => {
                onSelect(priority.id ? parseInt(priority.id) : null);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-left text-[12px] hover:bg-[#F5F5F7] flex items-center gap-2",
                currentId === priority.id && "bg-[#F3F0FF]"
              )}
            >
              <Flag className="h-3.5 w-3.5" style={{ color: priority.color }} fill={priority.color} />
              <span style={{ color: priority.color }}>{priority.label}</span>
              {currentId === priority.id && (
                <Check className="h-3 w-3 text-[#7C3AED] ml-auto" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// ASSIGNEE DROPDOWN (✅ FIXED: Now uses Avatar with profile pics)
// ============================================================

const AssigneeDropdown: React.FC<{
  assignees: any[];
  members: any[];
  onAdd: (userId: number) => void;
  onRemove: (userId: number) => void;
  loading?: boolean;
}> = ({ assignees, members, onAdd, onRemove, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const assigneeIds = assignees.map(a => a.id?.toString());

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-1 hover:bg-[#F5F5F7] px-1 py-1 rounded-md transition-colors"
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : assignees.length > 0 ? (
          <>
            {assignees.slice(0, 3).map((a: any) => (
              <Avatar
                key={a.id}
                src={a.profilePicture}
                name={a.username || a.email}
                size="sm"
                className="-ml-1 first:ml-0 ring-2 ring-white"
              />
            ))}
            {assignees.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[10px] font-medium text-[#6B7280] -ml-1 border-2 border-white">
                +{assignees.length - 3}
              </div>
            )}
            <Plus className="h-4 w-4 text-[#9CA3AF] ml-1" />
          </>
        ) : (
          <div className="w-7 h-7 rounded-full border-2 border-dashed border-[#D1D5DB] flex items-center justify-center hover:border-[#7C3AED]">
            <Plus className="h-3 w-3 text-[#9CA3AF]" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 min-w-[200px] max-h-[250px] overflow-y-auto z-[60]">
          <div className="px-3 py-2 text-[11px] font-semibold text-[#9CA3AF] uppercase">Assignees</div>
          {members.length > 0 ? members.map((member: any) => {
            const isAssigned = assigneeIds.includes(member.user?.id?.toString() || member.id?.toString());
            const user = member.user || member;
            return (
              <button
                key={user.id}
                onClick={() => {
                  if (isAssigned) {
                    onRemove(parseInt(user.id));
                  } else {
                    onAdd(parseInt(user.id));
                  }
                }}
                className={cn(
                  "w-full px-3 py-2 text-left text-[12px] hover:bg-[#F5F5F7] flex items-center gap-2",
                  isAssigned && "bg-[#F3F0FF]"
                )}
              >
                <Avatar
                  src={user.profilePicture}
                  name={user.username || user.email}
                  size="xs"
                />
                <span className="flex-1 truncate">{user.username || user.email}</span>
                {isAssigned && <Check className="h-3 w-3 text-[#7C3AED]" />}
              </button>
            );
          }) : (
            <div className="px-3 py-4 text-[12px] text-[#9CA3AF] text-center">No team members</div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// DATE PICKER (Simple)
// ============================================================

const DatePickerButton: React.FC<{
  value: string | number | undefined | null;
  placeholder: string;
  onChange: (timestamp: number | null) => void;
  loading?: boolean;
}> = ({ value, placeholder, onChange, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const formatForInput = (val: string | number | undefined | null): string => {
    if (!val) return '';
    const d = typeof val === 'number' ? new Date(val) : new Date(parseInt(val as string) || val);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value).getTime() : null;
    onChange(date);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.showPicker(), 100);
        }}
        disabled={loading}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-[#E5E7EB] hover:bg-[#F5F5F7] text-[12px] transition-colors"
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <Calendar className="h-3.5 w-3.5 text-[#8C8C9A]" />
            <span className={value ? "text-[#374151]" : "text-[#9CA3AF]"}>
              {formatDateShort(value) !== 'Set date' ? formatDateShort(value) : placeholder}
            </span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="date"
        value={formatForInput(value)}
        onChange={handleChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </div>
  );
};

// ============================================================
// TAGS DROPDOWN
// ============================================================

const TagsDropdown: React.FC<{
  tags: any[];
  spaceTags: any[];
  onAdd: (tagName: string) => void;
  onRemove: (tagName: string) => void;
  loading?: boolean;
}> = ({ tags, spaceTags, onAdd, onRemove, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tagNames = (tags || []).map(t => t.name?.toLowerCase());
  
  const tagColors = [
    { bg: '#C4B5FD', fg: '#5B21B6' },
    { bg: '#A5F3FC', fg: '#0E7490' },
    { bg: '#FDE68A', fg: '#92400E' },
    { bg: '#FECACA', fg: '#B91C1C' },
    { bg: '#BBF7D0', fg: '#166534' },
    { bg: '#DDD6FE', fg: '#6D28D9' },
    { bg: '#FBCFE8', fg: '#9D174D' },
    { bg: '#FED7AA', fg: '#C2410C' },
  ];

  const getTagColor = (name: string) => {
    if (!name) return tagColors[0];
    const index = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return tagColors[index % tagColors.length];
  };

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      onAdd(newTagName.trim());
      setNewTagName('');
      setIsOpen(false);
    }
  };

  const handleAddExistingTag = (tagName: string) => {
    onAdd(tagName);
    setIsOpen(false);
  };

  const handleRemoveTagClick = (e: React.MouseEvent, tagName: string) => {
    e.stopPropagation();
    onRemove(tagName);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-1.5 hover:bg-[#F5F5F7] px-2 py-1.5 rounded-md transition-colors"
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (tags || []).length > 0 ? (
          <div className="flex items-center gap-1 flex-wrap">
            {(tags || []).slice(0, 3).map((tag: any) => {
              const colors = getTagColor(tag.name);
              return (
                <span 
                  key={tag.name} 
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ backgroundColor: tag.tag_bg || colors.bg, color: tag.tag_fg || colors.fg }}
                >
                  {tag.name}
                </span>
              );
            })}
            {(tags || []).length > 3 && (
              <span className="text-[10px] text-[#9CA3AF]">+{tags.length - 3}</span>
            )}
            <Plus className="h-3.5 w-3.5 text-[#9CA3AF] ml-1" />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[13px] text-[#9CA3AF]">
            <Hash className="h-3.5 w-3.5" />
            <span>Add tag</span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-2 min-w-[220px] max-h-[300px] overflow-y-auto z-[60]">
          {/* Search/Create Input */}
          <div className="px-3 pb-2 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTag();
                  if (e.key === 'Escape') setIsOpen(false);
                }}
                placeholder="Search or create tag..."
                className="flex-1 text-[12px] outline-none bg-transparent text-[#374151] placeholder-[#9CA3AF]"
                autoFocus
              />
              {newTagName && (
                <button
                  onClick={handleCreateTag}
                  className="text-[10px] text-[#7C3AED] font-medium hover:underline whitespace-nowrap"
                >
                  Create
                </button>
              )}
            </div>
          </div>

          {/* Current Tags */}
          {(tags || []).length > 0 && (
            <div className="px-3 py-2 border-b border-[#E5E7EB]">
              <div className="text-[10px] font-medium text-[#9CA3AF] uppercase mb-1.5">Current Tags</div>
              <div className="flex flex-wrap gap-1">
                {(tags || []).map((tag: any) => {
                  const colors = getTagColor(tag.name);
                  return (
                    <button
                      key={tag.name}
                      onClick={(e) => handleRemoveTagClick(e, tag.name)}
                      className="group flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors hover:opacity-80"
                      style={{ backgroundColor: tag.tag_bg || colors.bg, color: tag.tag_fg || colors.fg }}
                    >
                      {tag.name}
                      <X className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Tags from Space */}
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium text-[#9CA3AF] uppercase mb-1.5">Available Tags</div>
            {(spaceTags || []).filter(t => !tagNames.includes(t.name?.toLowerCase())).length > 0 ? (
              <div className="space-y-0.5">
                {(spaceTags || [])
                  .filter(t => !tagNames.includes(t.name?.toLowerCase()))
                  .filter(t => !newTagName || t.name?.toLowerCase().includes(newTagName.toLowerCase()))
                  .map((tag: any) => {
                    const colors = getTagColor(tag.name);
                    return (
                      <button
                        key={tag.name}
                        onClick={() => handleAddExistingTag(tag.name)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-[11px] hover:bg-[#F5F5F7] rounded transition-colors"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: tag.tag_bg || colors.bg }}
                        />
                        <span className="text-[#374151]">{tag.name}</span>
                      </button>
                    );
                  })}
              </div>
            ) : (
              <p className="text-[11px] text-[#9CA3AF]">
                {newTagName ? `Press Enter to create "${newTagName}"` : 'No more tags available'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// TRACK TIME COMPONENT
// ============================================================

const TrackTimeDropdown: React.FC<{
  taskId: string;
  timeTracked: number;
  timerRunning: boolean;
  onStartTimer: () => void;
  onStopTimer: () => void;
  onAddTime: (minutes: number) => void;
  loading?: boolean;
}> = ({ taskId, timeTracked, timerRunning, onStartTimer, onStopTimer, onAddTime, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!timerRunning) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsed(e => e + 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const totalTime = timeTracked + elapsed;

  const handleAddManualTime = () => {
    const mins = parseInt(manualMinutes);
    if (mins > 0) {
      onAddTime(mins);
      setManualMinutes('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-colors",
          timerRunning 
            ? "bg-green-50 text-green-600" 
            : "text-[#8C8C9A] hover:bg-[#F5F5F7] hover:text-[#7C3AED]"
        )}
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : timerRunning ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono">{formatTime(elapsed)}</span>
          </>
        ) : totalTime > 0 ? (
          <>
            <Clock className="h-4 w-4" />
            <span>{formatTime(totalTime)}</span>
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            <span>Add time</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-2 min-w-[200px] z-[60]">
          <div className="px-3 pb-2 border-b border-[#E5E7EB]">
            <div className="text-[10px] font-medium text-[#9CA3AF] uppercase mb-2">Timer</div>
            {timerRunning ? (
              <button
                onClick={() => { onStopTimer(); setIsOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-[12px] font-medium hover:bg-red-100 transition-colors"
              >
                <div className="w-3 h-3 bg-red-500 rounded-sm" />
                Stop Timer ({formatTime(elapsed)})
              </button>
            ) : (
              <button
                onClick={() => { onStartTimer(); setIsOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-[12px] font-medium hover:bg-green-100 transition-colors"
              >
                <Play className="h-3.5 w-3.5" fill="currentColor" />
                Start Timer
              </button>
            )}
          </div>

          <div className="px-3 py-2">
            <div className="text-[10px] font-medium text-[#9CA3AF] uppercase mb-2">Add Manual Time</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddManualTime()}
                placeholder="Minutes"
                className="flex-1 px-2 py-1.5 border border-[#E5E7EB] rounded text-[12px] outline-none focus:border-[#7C3AED]"
                min="1"
              />
              <button
                onClick={handleAddManualTime}
                disabled={!manualMinutes}
                className="px-3 py-1.5 bg-[#7C3AED] text-white rounded text-[11px] font-medium hover:bg-[#6D28D9] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          <div className="px-3 pt-1">
            <div className="flex gap-1">
              {[15, 30, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => { onAddTime(mins); setIsOpen(false); }}
                  className="flex-1 px-2 py-1 bg-[#F5F5F7] text-[#6B7280] rounded text-[10px] font-medium hover:bg-[#E5E7EB] transition-colors"
                >
                  +{mins}m
                </button>
              ))}
            </div>
          </div>

          {totalTime > 0 && (
            <div className="px-3 pt-2 mt-2 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#9CA3AF]">Total tracked</span>
                <span className="font-medium text-[#374151]">{formatTime(totalTime)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SidebarIcon: React.FC<{ icon: React.ReactNode; active?: boolean; onClick: () => void; label?: string }> = ({ icon, active, onClick, label }) => (
  <button onClick={onClick} className={cn("flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all w-full", active ? "bg-[#F3F0FF] text-[#7C3AED]" : "text-[#9CA3AF] hover:bg-[#F5F5F7] hover:text-[#6B7280]")}>
    {icon}
    {label && <span className="text-[9px] font-medium">{label}</span>}
  </button>
);

const CommentAction: React.FC<{ icon: React.ReactNode; active?: boolean }> = ({ icon, active }) => (
  <button className={cn("p-2 rounded-lg transition-colors", active ? "bg-[#FECACA] text-[#EF4444]" : "text-[#9CA3AF] hover:bg-[#F5F5F7] hover:text-[#5C5C6D]")}>{icon}</button>
);

// ============================================================
// ACTIVITY TAB VIEW
// ============================================================

const ActivityTabView: React.FC<{ taskId: string }> = ({ taskId }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const activityData = await api.getTaskActivity(taskId).catch(() => []);
        setActivities(activityData || []);
      } catch (error) {
        console.log('Could not fetch activity data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  const formatActivityValue = (value: any, field?: string): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      if (value.status) return value.status;
      if (value.priority) return value.priority;
      if (value.username) return value.username;
      if (value.email) return value.email;
      if (value.date) return formatDateShort(value.date);
      if (value.name) return value.name;
      if (value.value) return String(value.value);
      return '';
    }
    if (typeof value === 'number' && value > 1000000000000) {
      return formatDateShort(value);
    }
    if (typeof value === 'string' && /^\d{13,}$/.test(value)) {
      return formatDateShort(parseInt(value));
    }
    return String(value);
  };

  const getActivityDescription = (activity: ActivityItem): { text: string; badge?: string; badgeColor?: string } => {
    const field = activity.field?.toLowerCase() || '';
    const afterValue = formatActivityValue(activity.after, field);
    const beforeValue = formatActivityValue(activity.before, field);
    
    switch (field) {
      case 'status':
        return { text: 'Current status:', badge: afterValue || 'to do', badgeColor: '#6B7280' };
      case 'priority':
      case 'priority_set':
        const priorityColors: Record<string, string> = { 'urgent': '#EF4444', 'high': '#F59E0B', 'normal': '#3B82F6', 'low': '#6B7280' };
        const priorityLabel = afterValue?.toLowerCase() || 'none';
        return { text: 'Priority:', badge: afterValue || 'None', badgeColor: priorityColors[priorityLabel] || '#6B7280' };
      case 'due_date': case 'due_date_set':
        return { text: 'Due date set', badge: afterValue || undefined };
      case 'start_date': case 'start_date_set':
        return { text: 'Start date set', badge: afterValue || undefined };
      case 'assignee_add': case 'assignees':
        return { text: `Assignee added: ${afterValue}` };
      case 'assignee_rem':
        return { text: `Assignee removed: ${beforeValue}` };
      case 'name':
        return { text: `Task renamed to "${afterValue}"` };
      case 'task_creation':
        return { text: 'Task created', badge: afterValue || undefined, badgeColor: '#7C3AED' };
      case 'comment':
        return { text: 'Comment added' };
      case 'attachment':
        return { text: 'Attachment added' };
      case 'tag': case 'tag_added':
        return { text: `Tag added: ${afterValue}` };
      case 'tag_removed':
        return { text: `Tag removed: ${beforeValue}` };
      default:
        if (activity.description) return { text: activity.description };
        return { text: field ? `${field.replace(/_/g, ' ')} updated` : 'Task updated' };
    }
  };

  const sortedActivities = [...activities].sort((a, b) => {
    const dateA = parseInt(a.date_created || a.date || '0') || 0;
    const dateB = parseInt(b.date_created || b.date || '0') || 0;
    return dateB - dateA;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-[15px] font-semibold text-[#1A1A2E] mb-3">Activity</h2>
      {sortedActivities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <FileText className="h-10 w-10 text-[#D1D5DB] mb-2" />
          <p className="text-[13px] text-[#9CA3AF]">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedActivities.map((activity, index) => {
            const { text, badge, badgeColor } = getActivityDescription(activity);
            const date = activity.date_created || activity.date;
            return (
              <div key={activity.id || index} className="flex items-start gap-3 py-2">
                <div className="w-2 h-2 rounded-full bg-[#7C3AED] mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] text-[#374151]">{text}</span>
                    {badge && (
                      <span 
                        className="px-2 py-0.5 rounded text-[10px] font-medium"
                        style={{ backgroundColor: badgeColor ? `${badgeColor}15` : '#F3F4F6', color: badgeColor || '#6B7280' }}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                </div>
                {date && formatRelativeTime(date) && (
                  <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap flex-shrink-0">
                    {formatRelativeTime(date)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================
// ETA TAB VIEW
// ============================================================

const ETATabView: React.FC<{ taskId: string }> = ({ taskId }) => {
  const [accountability, setAccountability] = useState<TaskAccountability | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountability = async () => {
      try {
        const data = await api.getTaskAccountability(taskId);
        setAccountability(data);
      } catch (error) {
        console.log('No accountability data for task');
      } finally {
        setLoading(false);
      }
    };
    fetchAccountability();
  }, [taskId]);

  const getIconColor = (color: string) => {
    switch (color) {
      case 'green': return '#10B981';
      case 'yellow': return '#F59E0B';
      case 'orange': return '#F97316';
      case 'red': return '#EF4444';
      default: return '#8C8C9A';
    }
  };

  const postpones: PostponeItem[] = accountability?.extensions?.length 
    ? accountability.extensions.map((ext, i) => ({
        id: ext.id,
        number: i + 1,
        actualProjectTime: '00:00',
        afterGracePeriodTime: '00:00',
        graceTimeRequired: `${Math.round(ext.additionalTime / 3600000)}:00`,
        newTotalHrs: '00:00',
        color: i === 0 ? 'green' : i === 1 ? 'yellow' : i === 2 ? 'orange' : 'red' as any,
        reason: ext.reason,
      }))
    : [];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold text-[#1A1A2E]">ETA</h2>
        {accountability?.currentEta && (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">
            {new Date(accountability.currentEta).toLocaleDateString()}
          </span>
        )}
      </div>
      
      {postpones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Timer className="h-10 w-10 text-[#D1D5DB] mb-2" />
          <p className="text-[13px] text-[#9CA3AF]">No ETA extensions</p>
          <p className="text-[11px] text-[#D1D5DB] mt-1">Task is on track</p>
        </div>
      ) : (
        <div className="space-y-3">
          {postpones.map((item) => (
            <div key={item.id} className="bg-[#F9FAFB] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Timer className="w-4 h-4" style={{ color: getIconColor(item.color) }} />
                  <span className="text-[13px] font-semibold" style={{ color: getIconColor(item.color) }}>
                    Postpone {item.number}
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-[#7C3AED] text-white text-[10px] font-medium rounded-full">
                  {item.reason || 'Not specified'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <div className="text-center">
                  <p className="text-[9px] text-[#8C8C9A] mb-0.5">Actual Time</p>
                  <p className="text-[11px] text-[#4B5563] font-medium">{item.actualProjectTime}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-[#8C8C9A] mb-0.5">After Grace</p>
                  <p className="text-[11px] text-[#4B5563] font-medium">{item.afterGracePeriodTime}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-[#8C8C9A] mb-0.5">Grace Time</p>
                  <p className="text-[11px] text-[#4B5563] font-medium">{item.graceTimeRequired}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-[#8C8C9A] mb-0.5">New Total</p>
                  <p className="text-[11px] text-[#4B5563] font-medium">{item.newTotalHrs}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// TAGS TAB VIEW (Hashtag Discussion Topics from Comments)
// ============================================================

const getCommentText = (c: ExtendedComment): string => {
  if (c.comment_text) return c.comment_text;
  if (c.text) return c.text;
  if (c.text_content) return c.text_content;
  if (typeof c.comment === 'string') return c.comment;
  if (c.comment && typeof c.comment === 'object' && c.comment.text) return c.comment.text;
  return '';
};

const extractHashtags = (text: string): string[] => {
  if (!text) return [];
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);
  if (!matches) return [];
  const lowercaseMatches = matches.map((tag: string) => tag.toLowerCase());
  return lowercaseMatches.filter((tag: string, index: number) => lowercaseMatches.indexOf(tag) === index);
};

const hashtagColors = [
  { bg: '#EDE9FE', text: '#7C3AED' },
  { bg: '#DBEAFE', text: '#2563EB' },
  { bg: '#D1FAE5', text: '#059669' },
  { bg: '#FEE2E2', text: '#DC2626' },
  { bg: '#FEF3C7', text: '#D97706' },
  { bg: '#FCE7F3', text: '#DB2777' },
  { bg: '#E0E7FF', text: '#4F46E5' },
  { bg: '#CCFBF1', text: '#0D9488' },
];

const getHashtagColor = (tag: string) => {
  const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hashtagColors[index % hashtagColors.length];
};

const quickHashtags = [
  { tag: '#revision', label: 'Revision', color: '#F97316' },
  { tag: '#approved', label: 'Approved', color: '#10B981' },
  { tag: '#question', label: 'Question', color: '#3B82F6' },
  { tag: '#urgent', label: 'Urgent', color: '#EF4444' },
  { tag: '#feedback', label: 'Feedback', color: '#8B5CF6' },
  { tag: '#blocked', label: 'Blocked', color: '#F59E0B' },
];

const HighlightedText: React.FC<{ 
  text: string; 
  activeHashtag?: string | null;
}> = ({ text, activeHashtag }) => {
  if (!text) return null;
  
  const parts: Array<{ type: 'text' | 'mention' | 'hashtag'; content: string }> = [];
  const pattern = /@([A-Za-z][A-Za-z0-9_\s]*)|#(\w+)/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    if (match[1]) {
      parts.push({ type: 'mention', content: `@${match[1]}` });
    } else if (match[2]) {
      parts.push({ type: 'hashtag', content: `#${match[2]}` });
    }
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }
  
  return (
    <span>
      {parts.map((part, i) => {
        if (part.type === 'mention') {
          return (
            <span key={i} className="bg-blue-100 text-blue-600 px-1 py-0.5 rounded font-medium text-[11px]">
              {part.content}
            </span>
          );
        }
        if (part.type === 'hashtag') {
          const isActive = activeHashtag && part.content.toLowerCase() === activeHashtag.toLowerCase();
          const colors = getHashtagColor(part.content);
          return (
            <span
              key={i}
              className={cn("px-1 py-0.5 rounded font-medium text-[11px]", isActive ? "bg-[#7C3AED] text-white" : "")}
              style={!isActive ? { backgroundColor: colors.bg, color: colors.text } : undefined}
            >
              {part.content}
            </span>
          );
        }
        return <span key={i}>{part.content}</span>;
      })}
    </span>
  );
};

// ============================================================
// TAGS TAB VIEW (✅ FIXED: Uses Avatar)
// ============================================================

const TagsTabView: React.FC<{ taskId: string; toast: (msg: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void }> = ({ taskId, toast }) => {
  const [comments, setComments] = useState<ExtendedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await api.getTaskComments(taskId);
        setComments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [taskId]);

  const hashtagData = useMemo(() => {
    const hashtagMap = new Map<string, { tag: string; count: number; commentIds: string[] }>();
    const processText = (text: string, commentId: string) => {
      const hashtags = extractHashtags(text);
      hashtags.forEach((tag: string) => {
        if (hashtagMap.has(tag)) {
          const existing = hashtagMap.get(tag)!;
          existing.count++;
          if (!existing.commentIds.includes(commentId)) existing.commentIds.push(commentId);
        } else {
          hashtagMap.set(tag, { tag, count: 1, commentIds: [commentId] });
        }
      });
    };
    comments.forEach((comment: ExtendedComment) => {
      processText(getCommentText(comment), String(comment.id));
    });
    const values: { tag: string; count: number; commentIds: string[] }[] = [];
    hashtagMap.forEach((value) => values.push(value));
    return values.sort((a, b) => b.count - a.count);
  }, [comments]);

  const filteredComments = useMemo(() => {
    if (!selectedHashtag) return [];
    return comments.filter((comment: ExtendedComment) => {
      const text = getCommentText(comment);
      return extractHashtags(text).includes(selectedHashtag.toLowerCase());
    });
  }, [comments, selectedHashtag]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-[15px] font-semibold text-[#1A1A2E] mb-3">Discussion Topics</h2>
      
      <div className="mb-4 pb-4 border-b border-[#E5E7EB]">
        <p className="text-[11px] text-[#9CA3AF] uppercase font-medium mb-2">Quick Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {quickHashtags.map((item) => (
            <button
              key={item.tag}
              onClick={() => setSelectedHashtag(selectedHashtag === item.tag ? null : item.tag)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium transition-all border",
                selectedHashtag === item.tag
                  ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                  : "bg-white border-[#E5E7EB] text-[#374151] hover:border-[#7C3AED] hover:text-[#7C3AED]"
              )}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {hashtagData.length > 0 ? (
        <div className="space-y-4">
          <div>
            <p className="text-[11px] text-[#9CA3AF] uppercase font-medium mb-2">
              Topics in Discussion ({hashtagData.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {hashtagData.map((data) => {
                const colors = getHashtagColor(data.tag);
                const isSelected = selectedHashtag === data.tag;
                return (
                  <button
                    key={data.tag}
                    onClick={() => setSelectedHashtag(isSelected ? null : data.tag)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-medium transition-all",
                      isSelected ? "bg-[#7C3AED] text-white shadow-sm" : "hover:opacity-80"
                    )}
                    style={!isSelected ? { backgroundColor: colors.bg, color: colors.text } : undefined}
                  >
                    <Hash className="w-3 h-3" />
                    {data.tag.replace('#', '')}
                    <span className={cn(
                      "inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-semibold",
                      isSelected ? "bg-white/20 text-white" : "bg-white/80"
                    )}>
                      {data.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedHashtag && (
            <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#7C3AED]" />
                  <span className="text-[13px] font-medium text-[#1A1A2E]">
                    Comments with <span className="text-[#7C3AED]">{selectedHashtag}</span>
                  </span>
                  <span className="text-[11px] text-[#9CA3AF]">({filteredComments.length})</span>
                </div>
                <button
                  onClick={() => setSelectedHashtag(null)}
                  className="text-[11px] text-[#9CA3AF] hover:text-[#374151] flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              </div>

              <div className="space-y-2">
                {filteredComments.map((comment) => (
                  <div key={comment.id} className="bg-[#F9FAFB] rounded-lg p-3">
                    <div className="flex gap-2.5">
                      <Avatar
                        src={comment.user?.profilePicture}
                        name={comment.user?.username || comment.user?.email || 'Unknown'}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-semibold text-[#1A1A2E] truncate">
                            {comment.user?.username || comment.user?.email || 'Unknown'}
                          </span>
                          {formatRelativeTime(comment.date_created) && (
                            <span className="text-[10px] text-[#9CA3AF]">
                              {formatRelativeTime(comment.date_created)}
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-[#4B5563] leading-relaxed">
                          <HighlightedText text={getCommentText(comment)} activeHashtag={selectedHashtag} />
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Hash className="h-10 w-10 text-[#D1D5DB] mb-2" />
          <p className="text-[13px] text-[#9CA3AF]">No hashtags in discussions yet</p>
          <p className="text-[11px] text-[#D1D5DB] mt-1">
            Use #hashtags in comments to categorize discussions
          </p>
          <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
            {quickHashtags.slice(0, 4).map((item) => (
              <span
                key={item.tag}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-[#F3F4F6] text-[#6B7280]"
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// COMMENTS TAB VIEW (✅ FIXED: Uses Avatar)
// ============================================================

const CommentsTabView: React.FC<{ 
  taskId: string; 
  toast: (msg: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
  selectedHashtag?: string | null;
}> = ({ taskId, toast, selectedHashtag }) => {
  const [comments, setComments] = useState<ExtendedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const data = await api.getTaskComments(taskId);
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const filteredComments = useMemo(() => {
    if (!selectedHashtag) return comments;
    return comments.filter((comment: ExtendedComment) => {
      const text = getCommentText(comment);
      return extractHashtags(text).includes(selectedHashtag.toLowerCase().replace('#', ''));
    });
  }, [comments, selectedHashtag]);

  const handleResolve = async (commentId: string, currentResolved: boolean) => {
    setResolvingId(commentId);
    try {
      await api.resolveComment(commentId, !currentResolved);
      setComments(prev => prev.map((c: ExtendedComment) => 
        String(c.id) === commentId ? { ...c, resolved: !currentResolved } : c
      ));
      toast({ title: currentResolved ? 'Comment unresolved' : 'Comment resolved' });
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast({ title: 'Error', description: 'Failed to update comment', variant: 'destructive' });
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  const displayComments = filteredComments;

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold text-[#1A1A2E]">Comments</h2>
        {selectedHashtag && (
          <span className="text-[11px] text-[#7C3AED] bg-[#F3E8FF] px-2 py-0.5 rounded">
            Filtered: {selectedHashtag}
          </span>
        )}
      </div>
      
      {displayComments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <MessageSquare className="h-10 w-10 text-[#D1D5DB] mb-2" />
          <p className="text-[13px] text-[#9CA3AF]">No comments yet</p>
          <p className="text-[11px] text-[#D1D5DB] mt-1">Be the first to comment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayComments.map((comment) => (
            <div key={comment.id} className="bg-[#F9FAFB] rounded-lg p-3">
              {comment.resolved && (
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-[11px] text-[#10B981] font-medium">Resolved</span>
                </div>
              )}

              <div className="flex gap-2.5">
                <Avatar
                  src={comment.user?.profilePicture}
                  name={comment.user?.username || comment.user?.email || 'Unknown'}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px] font-semibold text-[#1A1A2E] truncate">
                      {comment.user?.username || comment.user?.email || 'Unknown'}
                    </span>
                    {formatRelativeTime(comment.date_created) && (
                      <span className="text-[10px] text-[#9CA3AF] flex-shrink-0">
                        {formatRelativeTime(comment.date_created)}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#4B5563] leading-relaxed">
                    {getCommentText(comment) || 'No content'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1 text-[11px] text-[#8C8C9A] hover:text-[#5C5C6D]">
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button className="text-[11px] text-[#8C8C9A] hover:text-[#5C5C6D] font-medium">
                    Reply
                  </button>
                </div>
                <button 
                  onClick={() => handleResolve(String(comment.id), comment.resolved)}
                  disabled={resolvingId === String(comment.id)}
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
                    comment.resolved ? "text-[#10B981] bg-green-50" : "text-[#8C8C9A] hover:bg-[#F3F4F6]"
                  )}
                >
                  {resolvingId === String(comment.id) ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Check className="w-3 h-3" />
                      {comment.resolved ? 'Resolved' : 'Resolve'}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// DISCUSSION TAB VIEW (✅ FIXED: Uses Avatar with online status)
// ============================================================

const DiscussionTabView: React.FC<{ comments: ExtendedComment[] }> = ({ comments }) => {
  const formatCommentDate = (dateStr: string | number | undefined | null): { date: string; time: string } => {
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return { date: '', time: '' };
    
    let d: Date;
    if (typeof dateStr === 'number') {
      d = new Date(dateStr);
    } else {
      const timestamp = parseInt(dateStr, 10);
      if (!isNaN(timestamp) && timestamp > 1000000000) {
        d = new Date(timestamp);
      } else {
        d = new Date(dateStr);
      }
    }
    
    if (isNaN(d.getTime())) return { date: '', time: '' };
    
    return {
      date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-[15px] font-semibold text-[#1A1A2E] mb-3">Discussion</h2>
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <MessageSquare className="h-10 w-10 text-[#D1D5DB] mb-2" />
          <p className="text-[13px] text-[#9CA3AF]">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const { date, time } = formatCommentDate(comment.date_created);
            const userName = comment.user?.username || comment.user?.email || 'Unknown';
            const messageText = getCommentText(comment);
            
            return (
              <div key={comment.id} className="flex gap-2.5">
                <Avatar
                  src={comment.user?.profilePicture}
                  name={comment.user?.username || comment.user?.email || 'Unknown'}
                  size="md"
                  showStatus
                  status="online"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12px] font-semibold text-[#1A1A2E] truncate">{userName}</span>
                    {(date || time) && (
                      <span className="text-[10px] text-[#9CA3AF] flex-shrink-0">
                        {[date, time].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                  {messageText ? (
                    <div className="bg-[#F3F4F6] rounded-xl rounded-tl-sm px-3 py-2 inline-block max-w-full">
                      <p className="text-[12px] text-[#374151] leading-relaxed break-words">{messageText}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#9CA3AF] italic">No message content</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================
// COMMENT INPUT BAR
// ============================================================

const CommentInputBar: React.FC<{ 
  value: string; 
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}> = ({ value, onChange, onSubmit, submitting }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="p-3 border-t border-[#ECEDF0] bg-white">
      <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Comment press "space" for AI, "/" for commands'
          className="w-full px-3 py-2.5 text-[12px] text-[#1A1A2E] placeholder-[#9CA3AF] resize-none focus:outline-none bg-white"
          rows={2}
        />
        <div className="flex items-center justify-between px-3 py-2 bg-white border-t border-[#F3F4F6]">
          <div className="flex items-center gap-3">
            <button className="text-[#B0B0B0] hover:text-[#6B7280] transition-colors"><Plus className="h-4 w-4" /></button>
            <button className="text-[#B0B0B0] hover:text-[#6B7280] transition-colors"><Smile className="h-4 w-4" /></button>
            <button className="text-[#B0B0B0] hover:text-[#6B7280] transition-colors"><Paperclip className="h-4 w-4" /></button>
            <button className="text-[#B0B0B0] hover:text-[#6B7280] transition-colors"><AtSign className="h-4 w-4" /></button>
            <button className="text-[#B0B0B0] hover:text-[#6B7280] transition-colors"><MessageSquare className="h-4 w-4" /></button>
            <button className="text-[#B0B0B0] hover:text-[#6B7280] transition-colors"><Image className="h-4 w-4" /></button>
            <button className="text-[#B0B0B0] hover:text-[#6B7280] transition-colors"><Video className="h-4 w-4" /></button>
            <button className="text-[#B0B0B0] hover:text-[#6B7280] transition-colors"><Mic className="h-4 w-4" /></button>
          </div>
          <button 
            onClick={onSubmit}
            disabled={!value.trim() || submitting}
            className={cn(
              "p-2 rounded-lg transition-colors",
              value.trim() ? "bg-[#7C3AED] hover:bg-[#6D28D9] text-white" : "text-[#C4C4C4]"
            )}
          >
            {submitting ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <p className="text-[10px] text-[#9CA3AF] mt-1.5 text-center">Press Cmd + Enter to send</p>
    </div>
  );
};

// ============================================================
// USE TAGS SECTION
// ============================================================

const UseTagsSection: React.FC<{ taskId: string }> = ({ taskId }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHashtags = async () => {
      try {
        const comments = await api.getTaskComments(taskId);
        const allText = (comments || []).map((c: any) => 
          c.comment_text || c.text || c.text_content || ''
        ).join(' ');
        
        const hashtagRegex = /#(\w+)/g;
        const matches = allText.match(hashtagRegex);
        if (matches) {
          const lowercaseMatches = matches.map((tag: string) => tag.toLowerCase());
          const uniqueTags = lowercaseMatches.filter((tag: string, index: number) => lowercaseMatches.indexOf(tag) === index);
          setHashtags(uniqueTags);
        } else {
          setHashtags([]);
        }
      } catch (error) {
        console.log('Could not fetch hashtags');
      } finally {
        setLoading(false);
      }
    };
    fetchHashtags();
  }, [taskId]);

  if (loading) {
    return (
      <div className="mb-5">
        <div className="flex items-center justify-between py-2">
          <span className="text-[13px] font-medium text-[#1A1A2E]">Use Tags</span>
          <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
        </div>
        <div className="flex items-center gap-2 py-2">
          <LoadingSpinner size="sm" />
          <span className="text-[12px] text-[#9CA3AF]">Loading tags...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 hover:bg-[#F9FAFB] rounded-lg px-1 -mx-1 transition-colors"
      >
        <span className="text-[13px] font-medium text-[#1A1A2E]">Use Tags</span>
        <ChevronDown className={cn("h-4 w-4 text-[#9CA3AF] transition-transform", !isExpanded && "-rotate-90")} />
      </button>
      
      {isExpanded && (
        <div className="pt-2">
          {hashtags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag) => (
                <span key={tag} className="px-3 py-1.5 bg-[#F3F4F6] text-[#374151] text-[12px] font-medium rounded-lg">
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-[#9CA3AF]">
              No hashtags yet. Use #tags in comments to categorize discussions.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// TASK ITEMS TABS
// ============================================================

type TaskItemsTab = 'subtasks' | 'checklist' | 'actions';

const TaskItemsTabs: React.FC<{
  taskId: string;
  listId: string;
  toast: (msg: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
}> = ({ taskId, listId, toast }) => {
  const [activeTab, setActiveTab] = useState<TaskItemsTab>('subtasks');

  const mockChecklist = [
    { id: '1', name: 'Website design', checked: true },
    { id: '2', name: 'Branding - visiting card', checked: false },
    { id: '3', name: 'Social media post', checked: false },
  ];

  const mockActionItems = [
    { id: '1', name: 'Review design specs', assignee: 'John', due: 'Tomorrow' },
    { id: '2', name: 'Send feedback to client', assignee: 'Sarah', due: 'Today' },
  ];

  const checkedCount = mockChecklist.filter(i => i.checked).length;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-4 border-b border-[#ECEDF0] mb-3">
        <button
          onClick={() => setActiveTab('subtasks')}
          className={cn(
            "pb-2 text-[13px] font-medium border-b-2 transition-colors -mb-px",
            activeTab === 'subtasks' ? "text-[#1A1A2E] border-[#7C3AED]" : "text-[#9CA3AF] border-transparent hover:text-[#6B7280]"
          )}
        >
          Subtasks
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={cn(
            "pb-2 text-[13px] font-medium border-b-2 transition-colors -mb-px",
            activeTab === 'checklist' ? "text-[#1A1A2E] border-[#7C3AED]" : "text-[#9CA3AF] border-transparent hover:text-[#6B7280]"
          )}
        >
          checklist
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={cn(
            "pb-2 text-[13px] font-medium border-b-2 transition-colors -mb-px",
            activeTab === 'actions' ? "text-[#1A1A2E] border-[#7C3AED]" : "text-[#9CA3AF] border-transparent hover:text-[#6B7280]"
          )}
        >
          Action items
        </button>
      </div>

      {activeTab === 'subtasks' && (
        <SubtasksSection taskId={taskId} listId={listId} toast={toast} />
      )}

      {activeTab === 'checklist' && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-3">
            <CheckSquare className="h-4 w-4 text-[#7C3AED]" />
            <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#10B981] rounded-full transition-all"
                style={{ width: `${(checkedCount / mockChecklist.length) * 100}%` }}
              />
            </div>
            <span className="text-[12px] text-[#6B7280]">{checkedCount}/{mockChecklist.length}</span>
          </div>

          {mockChecklist.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2 group">
              <button className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                item.checked ? "bg-[#10B981] border-[#10B981] text-white" : "border-[#D1D5DB] hover:border-[#7C3AED]"
              )}>
                {item.checked && <Check className="h-3 w-3" />}
              </button>
              <span className={cn("text-[13px] flex-1", item.checked ? "text-[#9CA3AF] line-through" : "text-[#374151]")}>
                {item.name}
              </span>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                <button className="p-1 hover:bg-[#F3F4F6] rounded"><Clock className="h-3.5 w-3.5 text-[#9CA3AF]" /></button>
                <button className="p-1 hover:bg-[#F3F4F6] rounded"><User className="h-3.5 w-3.5 text-[#9CA3AF]" /></button>
                <button className="p-1 hover:bg-[#F3F4F6] rounded"><MoreHorizontal className="h-3.5 w-3.5 text-[#9CA3AF]" /></button>
              </div>
            </div>
          ))}

          <button className="flex items-center gap-2 py-2 text-[12px] text-[#9CA3AF] hover:text-[#7C3AED] transition-colors">
            <Plus className="h-3.5 w-3.5" />
            <span>Add an item</span>
          </button>
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="space-y-2">
          {mockActionItems.length === 0 ? (
            <div className="text-center py-8">
              <ListTodo className="h-10 w-10 text-[#D1D5DB] mx-auto mb-2" />
              <p className="text-[13px] text-[#9CA3AF]">No action items</p>
            </div>
          ) : (
            mockActionItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 px-3 bg-[#F9FAFB] rounded-lg">
                <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span className="text-[13px] text-[#374151] flex-1">{item.name}</span>
                <span className="text-[11px] text-[#9CA3AF]">{item.assignee}</span>
                <span className="text-[11px] text-[#F59E0B]">{item.due}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// HASHTAGS TAB VIEW (✅ FIXED: Uses Avatar)
// ============================================================

const HashtagsTabView: React.FC<{ 
  taskId: string;
  onFilterComments: (tag: string | null) => void;
}> = ({ taskId, onFilterComments }) => {
  const [comments, setComments] = useState<ExtendedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await api.getTaskComments(taskId);
        setComments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch comments');
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [taskId]);

  const hashtagData = useMemo(() => {
    const hashtagMap = new Map<string, { tag: string; count: number }>();
    comments.forEach((comment: ExtendedComment) => {
      const text = getCommentText(comment);
      const hashtags = extractHashtags(text);
      hashtags.forEach((tag: string) => {
        if (hashtagMap.has(tag)) {
          hashtagMap.get(tag)!.count++;
        } else {
          hashtagMap.set(tag, { tag, count: 1 });
        }
      });
    });
    const values: { tag: string; count: number }[] = [];
    hashtagMap.forEach((value) => values.push(value));
    return values.sort((a, b) => b.count - a.count);
  }, [comments]);

  const filteredComments = useMemo(() => {
    if (!selectedTag) return [];
    return comments.filter((comment: ExtendedComment) => {
      const text = getCommentText(comment);
      return extractHashtags(text).includes(selectedTag.toLowerCase());
    });
  }, [comments, selectedTag]);

  const handleTagClick = (tag: string) => {
    const newTag = selectedTag === tag ? null : tag;
    setSelectedTag(newTag);
    onFilterComments(newTag);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-[15px] font-semibold text-[#1A1A2E] mb-4">Discussion Topics</h2>
      
      {hashtagData.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {hashtagData.map((data) => {
              const isSelected = selectedTag === data.tag;
              return (
                <button
                  key={data.tag}
                  onClick={() => handleTagClick(data.tag)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
                    isSelected ? "bg-[#7C3AED] text-white" : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
                  )}
                >
                  <span>{data.tag}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px]",
                    isSelected ? "bg-white/20" : "bg-white"
                  )}>
                    {data.count}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedTag && filteredComments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#ECEDF0]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] text-[#6B7280]">
                  Comments with <span className="text-[#7C3AED] font-medium">{selectedTag}</span>
                </span>
                <button 
                  onClick={() => handleTagClick(selectedTag)}
                  className="text-[11px] text-[#9CA3AF] hover:text-[#6B7280]"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {filteredComments.map((comment) => (
                  <div key={comment.id} className="bg-[#F9FAFB] rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar
                        src={comment.user?.profilePicture}
                        name={comment.user?.username || comment.user?.email || 'Unknown'}
                        size="xs"
                      />
                      <span className="text-[11px] font-medium text-[#1A1A2E]">
                        {comment.user?.username || comment.user?.email || 'Unknown'}
                      </span>
                      <span className="text-[10px] text-[#9CA3AF]">
                        {formatRelativeTime(comment.date_created)}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#4B5563] pl-8">
                      <HighlightedText text={getCommentText(comment)} activeHashtag={selectedTag} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Hash className="h-10 w-10 text-[#D1D5DB] mb-2" />
          <p className="text-[13px] text-[#9CA3AF]">No hashtags yet</p>
          <p className="text-[11px] text-[#D1D5DB] mt-1">Use #tags in comments</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// DOCUMENTS TAB VIEW
// ============================================================

const DocumentsTabView: React.FC<{ taskId: string }> = ({ taskId }) => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const data = await api.getTaskAttachments(taskId);
        setAttachments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.log('Could not fetch attachments');
        setAttachments([
          { id: '1', title: 'Tech requirements.pdf', size: 1258291, type: 'application/pdf', user: { username: 'DAUD' }, date: Date.now() - 900000 },
          { id: '2', title: 'gabdupuis22.zip', size: 67108864, type: 'application/zip', user: { username: 'DAUD' }, date: Date.now() - 900000 },
          { id: '3', title: 'Design mockups.pdf', size: 2457600, type: 'application/pdf', user: { username: 'Sarah' }, date: Date.now() - 3600000 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchAttachments();
  }, [taskId]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string, title: string) => {
    if (type?.includes('pdf') || title?.endsWith('.pdf')) {
      return (
        <div className="w-10 h-10 bg-[#FEE2E2] rounded-lg flex items-center justify-center">
          <span className="text-[10px] font-bold text-[#DC2626]">PDF</span>
        </div>
      );
    }
    if (type?.includes('zip') || title?.endsWith('.zip')) {
      return (
        <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center">
          <Archive className="h-5 w-5 text-[#6B7280]" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center">
        <FileText className="h-5 w-5 text-[#6B7280]" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-[15px] font-semibold text-[#1A1A2E] mb-4">links & docs</h2>
      
      {attachments.length > 0 ? (
        <div className="space-y-3">
          {attachments.map((file) => (
            <div key={file.id} className="border border-[#E5E7EB] rounded-lg p-3 hover:border-[#7C3AED] transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                {getFileIcon(file.type, file.title)}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#2563EB] truncate hover:underline">
                    {file.title}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    {formatFileSize(file.size || 0)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Paperclip className="h-10 w-10 text-[#D1D5DB] mb-2" />
          <p className="text-[13px] text-[#9CA3AF]">No files attached</p>
          <p className="text-[11px] text-[#D1D5DB] mt-1">Upload files to share with team</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// SUBTASKS SECTION
// ============================================================

const SubtasksSection: React.FC<{
  taskId: string;
  listId: string;
  toast: (msg: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
}> = ({ taskId, listId, toast }) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchSubtasks = useCallback(async () => {
    try {
      const data = await api.getSubtasks(taskId);
      setSubtasks(data || []);
    } catch (error) {
      console.error('Failed to fetch subtasks:', error);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

  const completedCount = subtasks.filter(st => 
    st.status?.status?.toLowerCase() === 'complete' || st.status?.status?.toLowerCase() === 'closed'
  ).length;
  const progressPercent = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  const handleCreate = async () => {
    if (!newSubtaskName.trim() || creating) return;
    setCreating(true);
    try {
      const newSubtask = await api.createSubtask(taskId, listId, { name: newSubtaskName.trim() });
      setSubtasks([...subtasks, newSubtask]);
      setNewSubtaskName('');
      setIsAddingSubtask(false);
      toast({ title: 'Subtask created' });
    } catch (error) {
      console.error('Failed to create subtask:', error);
      toast({ title: 'Error', description: 'Failed to create subtask', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (subtask: Subtask) => {
    const isComplete = subtask.status?.status?.toLowerCase() === 'complete' || 
                       subtask.status?.status?.toLowerCase() === 'closed';
    const newStatus = isComplete ? 'to do' : 'complete';
    setTogglingId(subtask.id);
    try {
      await api.updateSubtask(subtask.id, { status: newStatus });
      setSubtasks(subtasks.map(st => 
        st.id === subtask.id 
          ? { ...st, status: { ...st.status, status: newStatus, color: isComplete ? '#808080' : '#6bc950' } }
          : st
      ));
      toast({ title: isComplete ? 'Subtask reopened' : 'Subtask completed' });
    } catch (error) {
      console.error('Failed to update subtask:', error);
      toast({ title: 'Error', description: 'Failed to update subtask', variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (subtaskId: string) => {
    if (!confirm('Delete this subtask?')) return;
    try {
      await api.deleteSubtask(subtaskId);
      setSubtasks(subtasks.filter(st => st.id !== subtaskId));
      toast({ title: 'Subtask deleted' });
    } catch (error) {
      console.error('Failed to delete subtask:', error);
      toast({ title: 'Error', description: 'Failed to delete subtask', variant: 'destructive' });
    }
  };

  return (
    <div className="border-t border-[#ECEDF0]">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold text-[#1A1A2E]">Subtasks</span>
          <span className="px-2 py-0.5 bg-[#F3F4F6] rounded text-[13px] text-[#6B7280] font-medium">
            {completedCount}/{subtasks.length}
          </span>
        </div>
        <button 
          onClick={() => setIsAddingSubtask(true)}
          className="flex items-center gap-1.5 text-[14px] text-[#6B7280] hover:text-[#1A1A2E] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Subtask
        </button>
      </div>

      <div className="h-1 bg-[#E5E7EB] rounded-full overflow-hidden mb-4">
        <div className="h-full bg-[#10B981] rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><LoadingSpinner /></div>
      ) : (
        <>
          {isAddingSubtask && (
            <div className="flex items-center gap-3 py-3 border-b border-[#ECEDF0]">
              <div className="w-[18px] h-[18px] rounded border border-[#D1D5DB] flex-shrink-0" />
              <input 
                type="text" 
                value={newSubtaskName} 
                onChange={(e) => setNewSubtaskName(e.target.value)} 
                onKeyDown={(e) => { 
                  if (e.key === 'Enter') handleCreate(); 
                  if (e.key === 'Escape') { setIsAddingSubtask(false); setNewSubtaskName(''); } 
                }} 
                placeholder="Enter subtask name..." 
                className="flex-1 text-[14px] outline-none bg-transparent min-w-0 text-[#1A1A2E] placeholder-[#9CA3AF]" 
                autoFocus 
              />
              <button 
                onClick={handleCreate} 
                disabled={creating} 
                className="px-3 py-1.5 bg-[#7C3AED] text-white text-[12px] font-medium rounded-md hover:bg-[#6D28D9] disabled:bg-[#D1D5DB]"
              >
                {creating ? '...' : 'Add'}
              </button>
              <button 
                onClick={() => { setIsAddingSubtask(false); setNewSubtaskName(''); }} 
                className="px-2 py-1.5 text-[#8C8C9A] text-[12px] hover:text-[#5C5C6D]"
              >
                Cancel
              </button>
            </div>
          )}

          <div>
            {subtasks.map((subtask) => {
              const isComplete = subtask.status?.status?.toLowerCase() === 'complete' || 
                                subtask.status?.status?.toLowerCase() === 'closed';
              const statusText = subtask.status?.status || 'to do';
              
              return (
                <div 
                  key={subtask.id} 
                  className="flex items-center gap-3 py-3.5 border-b border-[#ECEDF0] group hover:bg-[#FAFBFC] -mx-2 px-2"
                >
                  <button className="flex-shrink-0" onClick={() => handleToggle(subtask)} disabled={togglingId === subtask.id}>
                    {togglingId === subtask.id ? (
                      <LoadingSpinner size="sm" />
                    ) : isComplete ? (
                      <div className="w-[18px] h-[18px] rounded bg-[#10B981] flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-[18px] h-[18px] rounded border border-[#D1D5DB] hover:border-[#7C3AED] transition-colors" />
                    )}
                  </button>
                  
                  <span className={cn("flex-1 text-[14px]", isComplete ? "text-[#9CA3AF] line-through" : "text-[#1A1A2E]")}>
                    {subtask.name}
                  </span>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0 mr-2">
                    <button className="p-1 hover:bg-[#ECEDF0] rounded"><Clock className="h-3.5 w-3.5 text-[#8C8C9A]" /></button>
                    <button className="p-1 hover:bg-[#ECEDF0] rounded"><User className="h-3.5 w-3.5 text-[#8C8C9A]" /></button>
                    <button className="p-1 hover:bg-red-50 rounded" onClick={() => handleDelete(subtask.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-[#8C8C9A] hover:text-red-500" />
                    </button>
                  </div>

                  <span 
                    className="px-2.5 py-1 rounded text-[12px] font-medium flex-shrink-0"
                    style={{
                      backgroundColor: isComplete ? '#DCFCE7' : '#F3F4F6',
                      color: isComplete ? '#166534' : '#6B7280',
                    }}
                  >
                    {statusText}
                  </span>
                </div>
              );
            })}
          </div>

          {subtasks.length === 0 && !isAddingSubtask && (
            <div className="py-8 text-center">
              <p className="text-[14px] text-[#9CA3AF]">No subtasks yet</p>
            </div>
          )}
        </>
      )}

      <div className="border-b border-[#ECEDF0] mt-2" />
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export const TaskDetailModal: React.FC = () => {
  const { selectedTask, isModalOpen, closeTaskModal, updateTask } = useTaskStore();
  const { currentWorkspace, currentList, currentSpace } = useWorkspaceStore();
  const { toasts, toast, dismiss } = useToast();
  
  const [activeRightTab, setActiveRightTab] = useState<RightPanelTab>('activity');
  const [comment, setComment] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [comments, setComments] = useState<ExtendedComment[]>([]);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  
  const [statusLoading, setStatusLoading] = useState(false);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [assigneeLoading, setAssigneeLoading] = useState(false);
  const [dateLoading, setDateLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [timeLoading, setTimeLoading] = useState(false);
  
  const [members, setMembers] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [spaceTags, setSpaceTags] = useState<any[]>([]);
  
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeTracked, setTimeTracked] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);

  const countdown = useCountdown(selectedTask?.due_date);
  const priorityConfig = getPriorityConfig(selectedTask?.priority);
  
  const listId = selectedTask?.list?.id || currentList?.id || '';
  const teamId = currentWorkspace?.id || '';

  useEffect(() => {
    const fetchData = async () => {
      if (!teamId) return;
      
      try {
        const membersData = await api.getMembers(teamId);
        setMembers(Array.isArray(membersData) ? membersData : []);
      } catch (error) {
        console.log('Could not fetch members, using task assignees');
        if (selectedTask?.assignees) setMembers(selectedTask.assignees);
      }

      if (currentSpace?.statuses) setStatuses(currentSpace.statuses);

      try {
        if (currentSpace?.id) {
          const tagsData = await api.getSpaceTags(currentSpace.id);
          setSpaceTags(Array.isArray(tagsData) ? tagsData : []);
        } else if (selectedTask?.tags?.length) {
          setSpaceTags(selectedTask.tags);
        }
      } catch (error) {
        if (selectedTask?.tags?.length) setSpaceTags(selectedTask.tags);
      }

      if (selectedTask?.id) {
        const taskIdStr = String(selectedTask.id);
        try {
          if (selectedTask.time_spent) {
            setTimeTracked(Number(selectedTask.time_spent) || 0);
          }
          const timeEntries = await api.getTimeEntries(taskIdStr);
          if (Array.isArray(timeEntries) && timeEntries.length > 0) {
            const totalTime = timeEntries.reduce((sum: number, entry: any) => sum + (parseInt(entry.duration) || 0), 0);
            if (totalTime > 0) setTimeTracked(totalTime);
          }
        } catch (error) {
          if (selectedTask.time_spent) setTimeTracked(Number(selectedTask.time_spent) || 0);
        }
        
        if (teamId) {
          try {
            const runningTimer = await api.getRunningTimer(teamId);
            if (runningTimer?.data?.task?.id === taskIdStr) {
              setTimerRunning(true);
              setTimerStartTime(parseInt(runningTimer.data.start) || Date.now());
            }
          } catch (e) {
            console.log('Could not check running timer');
          }
        }
      }
    };

    if (isModalOpen) fetchData();
  }, [isModalOpen, teamId, currentSpace, selectedTask?.assignees, selectedTask?.id, selectedTask?.time_spent]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!selectedTask?.id) return;
      try {
        const data = await api.getTaskComments(String(selectedTask.id));
        setComments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      }
    };
    if (isModalOpen && selectedTask?.id) fetchComments();
  }, [isModalOpen, selectedTask?.id]);

  const handleStatusChange = async (status: string) => {
    if (!selectedTask?.id) return;
    const taskId = String(selectedTask.id);
    setStatusLoading(true);
    try {
      await api.updateTask(taskId, { status });
      updateTask(taskId, { status: { ...selectedTask.status, status } });
      toast({ title: 'Status updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePriorityChange = async (priorityId: number | null) => {
    if (!selectedTask?.id) return;
    const taskId = String(selectedTask.id);
    setPriorityLoading(true);
    try {
      await api.updateTask(taskId, { priority: priorityId });
      const priorityLabel = PRIORITIES.find(p => p.id === priorityId?.toString())?.label || 'None';
      updateTask(taskId, { priority: priorityId ? { id: priorityId.toString(), priority: priorityLabel, color: '' } : undefined });
      toast({ title: 'Priority updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update priority', variant: 'destructive' });
    } finally {
      setPriorityLoading(false);
    }
  };

  const handleAddAssignee = async (userId: number) => {
    if (!selectedTask?.id) return;
    const taskId = String(selectedTask.id);
    setAssigneeLoading(true);
    try {
      await api.updateTask(taskId, { assignees: { add: [userId] } });
      const member = members.find(m => (m.user?.id || m.id) === userId);
      const user = member?.user || member;
      if (user) updateTask(taskId, { assignees: [...(selectedTask.assignees || []), user] });
      toast({ title: 'Assignee added' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add assignee', variant: 'destructive' });
    } finally {
      setAssigneeLoading(false);
    }
  };

  const handleRemoveAssignee = async (userId: number) => {
    if (!selectedTask?.id) return;
    const taskId = String(selectedTask.id);
    setAssigneeLoading(true);
    try {
      await api.updateTask(taskId, { assignees: { rem: [userId] } });
      updateTask(taskId, { assignees: (selectedTask.assignees || []).filter(a => a.id !== userId && a.id !== userId.toString()) });
      toast({ title: 'Assignee removed' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove assignee', variant: 'destructive' });
    } finally {
      setAssigneeLoading(false);
    }
  };

  const handleStartDateChange = async (timestamp: number | null) => {
    if (!selectedTask?.id) return;
    const taskId = String(selectedTask.id);
    setDateLoading(true);
    try {
      await api.updateTask(taskId, { start_date: timestamp });
      updateTask(taskId, { start_date: timestamp?.toString() });
      toast({ title: 'Start date updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update start date', variant: 'destructive' });
    } finally {
      setDateLoading(false);
    }
  };

  const handleDueDateChange = async (timestamp: number | null) => {
    if (!selectedTask?.id) return;
    const taskId = String(selectedTask.id);
    setDateLoading(true);
    try {
      await api.updateTask(taskId, { due_date: timestamp });
      updateTask(taskId, { due_date: timestamp?.toString() });
      toast({ title: 'Due date updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update due date', variant: 'destructive' });
    } finally {
      setDateLoading(false);
    }
  };

  const handleAddTag = async (tagName: string) => {
    if (!selectedTask?.id) return;
    const taskId = String(selectedTask.id);
    setTagsLoading(true);
    const newTag = spaceTags.find(t => t.name === tagName) || { name: tagName, tag_bg: '#C4B5FD', tag_fg: '#5B21B6' };
    const previousTags = selectedTask.tags || [];
    updateTask(taskId, { tags: [...previousTags, newTag] });
    try {
      await api.addTaskTag(taskId, tagName);
      toast({ title: 'Tag added' });
    } catch (error: any) {
      updateTask(taskId, { tags: previousTags });
      toast({ title: 'Error', description: error?.message || 'Failed to add tag', variant: 'destructive' });
    } finally {
      setTagsLoading(false);
    }
  };

  const handleRemoveTag = async (tagName: string) => {
    if (!selectedTask?.id) return;
    const taskId = String(selectedTask.id);
    setTagsLoading(true);
    const previousTags = selectedTask.tags || [];
    updateTask(taskId, { tags: previousTags.filter(t => t.name !== tagName) });
    try {
      await api.removeTaskTag(taskId, tagName);
      toast({ title: 'Tag removed' });
    } catch (error: any) {
      updateTask(taskId, { tags: previousTags });
      toast({ title: 'Error', description: error?.message || 'Failed to remove tag', variant: 'destructive' });
    } finally {
      setTagsLoading(false);
    }
  };

  const handleStartTimer = async () => {
    if (!selectedTask?.id || !teamId) return;
    const taskId = String(selectedTask.id);
    setTimeLoading(true);
    try {
      await api.startTimer(teamId, taskId);
      setTimerRunning(true);
      setTimerStartTime(Date.now());
      toast({ title: 'Timer started' });
    } catch (error) {
      setTimerRunning(true);
      setTimerStartTime(Date.now());
      toast({ title: 'Timer started (local)' });
    } finally {
      setTimeLoading(false);
    }
  };

  const handleStopTimer = async () => {
    if (!selectedTask?.id || !timerStartTime || !teamId) return;
    setTimeLoading(true);
    const duration = Date.now() - timerStartTime;
    try {
      await api.stopTimer(teamId);
      setTimerRunning(false);
      setTimeTracked(prev => prev + duration);
      setTimerStartTime(null);
      toast({ title: 'Timer stopped' });
    } catch (error) {
      setTimerRunning(false);
      setTimeTracked(prev => prev + duration);
      setTimerStartTime(null);
      toast({ title: 'Timer stopped (local)' });
    } finally {
      setTimeLoading(false);
    }
  };

  const handleAddManualTime = async (minutes: number) => {
    if (!selectedTask?.id || !teamId) return;
    const taskId = String(selectedTask.id);
    setTimeLoading(true);
    const durationMs = minutes * 60 * 1000;
    try {
      await api.addTimeEntry(teamId, { taskId, start: Date.now() - durationMs, duration: durationMs });
      setTimeTracked(prev => prev + durationMs);
      toast({ title: `Added ${minutes} minutes` });
    } catch (error) {
      setTimeTracked(prev => prev + durationMs);
      toast({ title: `Added ${minutes} minutes (local)` });
    } finally {
      setTimeLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!comment.trim() || !selectedTask?.id || submittingComment) return;
    const taskId = String(selectedTask.id);
    setSubmittingComment(true);
    try {
      await api.createTaskComment(taskId, { comment_text: comment.trim(), notify_all: false });
      setComment('');
      toast({ title: 'Comment added' });
      const data = await api.getTaskComments(taskId);
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add comment', variant: 'destructive' });
    } finally {
      setSubmittingComment(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') {
        if (isMaximized) setIsMaximized(false);
        else closeTaskModal();
      }
    };
    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen, closeTaskModal, isMaximized]);

  if (!isModalOpen || !selectedTask) return null;

  const task = selectedTask;
  const taskId = String(task.id);
  const assignees = task.assignees || [];
  const tags = task.tags || [];

  const renderRightPanelContent = () => {
    switch (activeRightTab) {
      case 'activity': return <ActivityTabView taskId={taskId} />;
      case 'tags': return <HashtagsTabView taskId={taskId} onFilterComments={(tag) => setSelectedHashtag(tag)} />;
      case 'documents': return <DocumentsTabView taskId={taskId} />;
      case 'comments': return <CommentsTabView taskId={taskId} toast={toast} selectedHashtag={selectedHashtag} />;
      default: return <ActivityTabView taskId={taskId} />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={closeTaskModal} />

        <div className={cn(
          "relative bg-white rounded-2xl shadow-2xl flex transition-all duration-300",
          isMaximized 
            ? "w-full h-full max-w-full max-h-full rounded-none m-0" 
            : "w-full max-w-[1100px] max-h-[90vh] mx-4"
        )}>
          
          {/* LEFT PANEL */}
          <div className="w-[480px] flex flex-col border-r border-[#ECEDF0]">
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
                    "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                    isStarred ? "bg-amber-50 text-amber-500" : "bg-[#FEF2F2] text-[#F87171] hover:bg-[#FEE2E2]"
                  )}
                >
                  <Star className="h-4 w-4" fill={isStarred ? "currentColor" : "none"} />
                </button>
                <button className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#60A5FA] hover:bg-[#DBEAFE] flex items-center justify-center transition-colors">
                  <Share2 className="h-4 w-4" />
                </button>
                <button className="w-9 h-9 rounded-lg bg-[#FEF9C3] text-[#FACC15] hover:bg-[#FEF08A] flex items-center justify-center transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="w-9 h-9 rounded-lg bg-[#F3F4F6] text-[#9CA3AF] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors">
                  <Bell className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-visible px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h1 className="text-[22px] font-semibold text-[#1A1A2E] leading-tight">{task.name}</h1>
                {countdown && (
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap flex-shrink-0",
                    countdown.isOverdue ? "bg-[#FEE2E2]" : "bg-[#F3F4F6]"
                  )}>
                    <div className={cn("w-2.5 h-2.5 rounded-sm", countdown.isOverdue ? "bg-red-500" : "bg-red-500")} />
                    <span className={countdown.isOverdue ? "text-red-600" : "text-[#1A1A2E]"}>
                      {countdown.isOverdue 
                        ? `${countdown.days}d, ${countdown.hours}h, ${countdown.minutes}m overdue`
                        : `${countdown.days}d, ${countdown.hours}h, ${countdown.minutes}m, ${countdown.seconds}s left`
                      }
                    </span>
                  </div>
                )}
              </div>

              {countdown && (
                <div className="bg-[#F8F9FB] rounded-lg p-4 mb-5">
                  <div className="flex items-center gap-6">
                    <div className="text-[12px] text-[#6B7280] font-medium leading-tight">
                      Time left<br />to deliver
                    </div>
                    <div className="flex items-center gap-4">
                      <TimeBox value={countdown.days} label="Days" />
                      <span className="text-lg text-[#E5E7EB]">|</span>
                      <TimeBox value={countdown.hours} label="Hours" />
                      <span className="text-lg text-[#E5E7EB]">|</span>
                      <TimeBox value={countdown.minutes} label="Minutes" />
                      <span className="text-lg text-[#E5E7EB]">|</span>
                      <TimeBox value={countdown.seconds} label="Seconds" />
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="space-y-0">
                  <FieldRow icon={<CheckCircle2 className="h-4 w-4" />} label="Status">
                    <StatusDropdown currentStatus={task.status} statuses={statuses} onSelect={handleStatusChange} loading={statusLoading} />
                  </FieldRow>
                  <FieldRow icon={<User className="h-4 w-4" />} label="Assignees">
                    <AssigneeDropdown assignees={assignees} members={members} onAdd={handleAddAssignee} onRemove={handleRemoveAssignee} loading={assigneeLoading} />
                  </FieldRow>
                  <FieldRow icon={<Calendar className="h-4 w-4" />} label="Dates">
                    <div className="flex items-center gap-2">
                      <DatePickerButton value={task.start_date} placeholder="Start" onChange={handleStartDateChange} loading={dateLoading} />
                      <span className="text-[#D1D5DB]">→</span>
                      <DatePickerButton value={task.due_date} placeholder="Due" onChange={handleDueDateChange} loading={dateLoading} />
                    </div>
                  </FieldRow>
                  <FieldRow icon={<Flag className="h-4 w-4" />} label="Priority">
                    <PriorityDropdown currentPriority={task.priority} onSelect={handlePriorityChange} loading={priorityLoading} />
                  </FieldRow>
                  <FieldRow icon={<Clock className="h-4 w-4" />} label="Track Time">
                    <TrackTimeDropdown taskId={taskId} timeTracked={timeTracked} timerRunning={timerRunning} onStartTimer={handleStartTimer} onStopTimer={handleStopTimer} onAddTime={handleAddManualTime} loading={timeLoading} />
                  </FieldRow>
                </div>
              </div>

              <UseTagsSection taskId={taskId} />
              <TaskItemsTabs taskId={taskId} listId={listId} toast={toast} />
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#ECEDF0]">
              <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-[12px] text-[#5C5C6D] hover:bg-[#F5F5F7]">
                <Check className="h-3.5 w-3.5" />
                Mark complete
              </button>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setIsMaximized(!isMaximized)} 
                  className="p-2 hover:bg-[#F5F5F7] text-[#9CA3AF] hover:text-[#6B7280] rounded-lg transition-colors"
                  title={isMaximized ? "Minimize" : "Maximize"}
                >
                  {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button onClick={closeTaskModal} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-2 bg-[#FAFBFC] border-b border-[#ECEDF0]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                <Lock className="h-3.5 w-3.5" />
                <span>This task is private to you.</span>
              </div>
              <button className="text-[11px] text-[#7C3AED] font-medium hover:underline">Make public</button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col overflow-hidden">
                {renderRightPanelContent()}
                <CommentInputBar value={comment} onChange={setComment} onSubmit={handleSubmitComment} submitting={submittingComment} />
              </div>

              <div className="w-14 flex flex-col items-center py-3 gap-1 border-l border-[#ECEDF0] bg-[#FAFBFC]">
                <SidebarIcon icon={<FileText className="h-4 w-4" />} active={activeRightTab === 'activity'} onClick={() => setActiveRightTab('activity')} label="Activity" />
                <div className="w-8 border-t border-[#ECEDF0] my-2" />
                <SidebarIcon icon={<Hash className="h-4 w-4" />} active={activeRightTab === 'tags'} onClick={() => setActiveRightTab('tags')} label="Tags" />
                <SidebarIcon icon={<Paperclip className="h-4 w-4" />} active={activeRightTab === 'documents'} onClick={() => setActiveRightTab('documents')} label="Docs" />
                <SidebarIcon icon={<Plus className="h-4 w-4" />} active={false} onClick={() => {}} label="Add" />
                <div className="flex-1" />
                <SidebarIcon icon={<MoreHorizontal className="h-4 w-4" />} active={false} onClick={() => {}} label="More" />
                <SidebarIcon icon={<MessageCircle className="h-4 w-4" />} active={activeRightTab === 'comments'} onClick={() => setActiveRightTab('comments')} label="Chat" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
};

export default TaskDetailModal;