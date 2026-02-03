'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  Check,
  Calendar,
  User,
  Flag,
  Circle,
  X,
  Search,
  Plus,
  Clock,
  Hash,
  Type,
  AlignLeft,
  CheckSquare,
  Eye,
  UserCheck,
  Link2,
  Repeat,
  Tag,
  ListTodo,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Local flexible types for dropdowns (compatible with API types)
// These are intentionally more flexible to accept various input formats

// ============================================================
// GENERIC DROPDOWN WRAPPER
// ============================================================

interface DropdownWrapperProps {
  trigger: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
  width?: string;
}

export const DropdownWrapper: React.FC<DropdownWrapperProps> = ({
  trigger,
  isOpen,
  onClose,
  children,
  align = 'left',
  width = 'w-56',
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={dropdownRef} className="relative">
      {trigger}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50',
            width,
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================================
// STATUS DROPDOWN - ClickUp Style with Uniform Badges
// ============================================================

export interface StatusOption {
  id?: string | number;
  status?: string;
  color?: string;
  orderindex?: number;
  type?: string;
}

interface StatusDropdownProps {
  currentStatus?: StatusOption | null;
  statuses: StatusOption[];
  onSelect: (status: StatusOption) => void;
  disabled?: boolean;
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  currentStatus,
  statuses,
  onSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const statusColor = currentStatus?.color || '#9CA3AF';
  const statusId = String(currentStatus?.id || '');
  const statusText = currentStatus?.status || 'No status';

  return (
    <DropdownWrapper
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setIsOpen(!isOpen);
          }}
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-1.5 min-w-[100px] px-2.5 py-1 rounded text-xs font-medium transition-colors border',
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'
          )}
          style={{
            borderColor: statusColor,
            color: statusColor,
          }}
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: statusColor }}
          />
          <span className="truncate">{statusText}</span>
        </button>
      }
    >
      <div className="max-h-64 overflow-y-auto py-1 min-w-[160px]">
        {statuses.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500 text-center">No statuses available</div>
        ) : (
          statuses.map((status) => {
            const isSelected = statusId === String(status.id);
            return (
              <button
                key={String(status.id || status.status)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(status);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-gray-50 transition-colors',
                  isSelected && 'bg-purple-50'
                )}
              >
                {/* Status Badge - Uniform Style */}
                <div
                  className="inline-flex items-center gap-1.5 min-w-[100px] px-2.5 py-1 rounded text-xs font-medium border"
                  style={{
                    borderColor: status.color || '#9CA3AF',
                    color: status.color || '#9CA3AF',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: status.color || '#9CA3AF' }}
                  />
                  <span className="truncate">{status.status}</span>
                </div>
                
                {/* Checkmark */}
                {isSelected && (
                  <Check className="h-4 w-4 text-purple-600 ml-auto" />
                )}
              </button>
            );
          })
        )}
      </div>
    </DropdownWrapper>
  );
};

// ============================================================
// PRIORITY DROPDOWN - ClickUp Style with Uniform Badges
// ============================================================

export interface PriorityOption {
  id?: string | number | null;
  priority?: string | null;
  color?: string;
}

const DEFAULT_PRIORITIES: PriorityOption[] = [
  { id: '1', priority: 'Urgent', color: '#EF4444' },
  { id: '2', priority: 'High', color: '#F97316' },
  { id: '3', priority: 'Normal', color: '#3B82F6' },
  { id: '4', priority: 'Low', color: '#6B7280' },
];

interface PriorityDropdownProps {
  currentPriority?: PriorityOption | null;
  priorities?: PriorityOption[];
  onSelect: (priority: PriorityOption | null) => void;
  disabled?: boolean;
}

export const PriorityDropdown: React.FC<PriorityDropdownProps> = ({
  currentPriority,
  priorities = DEFAULT_PRIORITIES,
  onSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getPriorityConfig = (priority: PriorityOption | null | undefined) => {
    if (!priority) return null;
    
    const p = String(priority.id || priority.priority || '').toLowerCase();
    switch (p) {
      case 'urgent':
      case '1':
        return { bg: '#EF4444', label: 'Urgent' };
      case 'high':
      case '2':
        return { bg: '#F97316', label: 'High' };
      case 'normal':
      case '3':
        return { bg: '#3B82F6', label: 'Normal' };
      case 'low':
      case '4':
        return { bg: '#6B7280', label: 'Low' };
      default:
        return null;
    }
  };

  const currentConfig = getPriorityConfig(currentPriority);
  const currentId = String(currentPriority?.id || '');

  return (
    <DropdownWrapper
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setIsOpen(!isOpen);
          }}
          disabled={disabled}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 min-w-[80px] px-3 py-1 text-xs font-medium rounded transition-all',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90',
            !currentConfig && 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          )}
          style={currentConfig ? { 
            backgroundColor: currentConfig.bg, 
            color: '#ffffff' 
          } : undefined}
        >
          <Flag className="h-3 w-3" />
          <span>{currentConfig?.label || '—'}</span>
        </button>
      }
    >
      <div className="py-1.5 min-w-[160px]">
        {priorities.map((priority) => {
          const config = getPriorityConfig(priority);
          const priorityId = String(priority.id || '');
          const isSelected = currentId === priorityId;
          
          return (
            <button
              key={priorityId}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(priority);
                setIsOpen(false);
              }}
              className={cn(
                'flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors',
                isSelected && 'bg-purple-50'
              )}
            >
              {/* Priority Badge - ClickUp Style Pill */}
              <span 
                className="inline-flex items-center justify-center gap-1.5 min-w-[80px] px-3 py-1 text-xs font-medium rounded"
                style={{ 
                  backgroundColor: config?.bg || '#E5E7EB', 
                  color: '#ffffff'
                }}
              >
                <Flag className="h-3 w-3" />
                {config?.label}
              </span>
              
              {/* Checkmark for selected - aligned to right */}
              {isSelected && (
                <Check className="h-4 w-4 text-purple-600 ml-auto" />
              )}
            </button>
          );
        })}
        
        {/* Divider & Clear Option */}
        <div className="border-t border-gray-100 mt-1.5 pt-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
              setIsOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            <span>Clear priority</span>
          </button>
        </div>
      </div>
    </DropdownWrapper>
  );
};

// ============================================================
// DATE PICKER DROPDOWN
// ============================================================

interface DatePickerDropdownProps {
  currentDate?: string | null; // Can be timestamp string or ISO date
  onSelect: (date: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const DatePickerDropdown: React.FC<DatePickerDropdownProps> = ({
  currentDate,
  onSelect,
  disabled = false,
  placeholder = 'Set date',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // Parse the current date (could be timestamp or ISO string)
  const formatDisplayDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    try {
      // Try parsing as timestamp first
      const timestamp = parseInt(dateStr);
      const date = !isNaN(timestamp) ? new Date(timestamp) : new Date(dateStr);
      
      if (isNaN(date.getTime())) return null;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const diffDays = Math.ceil((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
      }
      if (diffDays === 0) return { text: 'Today', isOverdue: false };
      if (diffDays === 1) return { text: 'Tomorrow', isOverdue: false };
      if (diffDays <= 7) return { text: `In ${diffDays} days`, isOverdue: false };
      
      return {
        text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isOverdue: false,
      };
    } catch {
      return null;
    }
  };

  const displayInfo = formatDisplayDate(currentDate);

  // Quick date options - return ISO date strings
  const quickDates = [
    { label: 'Today', getValue: () => new Date().toISOString().split('T')[0] },
    { label: 'Tomorrow', getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    }},
    { label: 'Next week', getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    }},
    { label: 'In 2 weeks', getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      return d.toISOString().split('T')[0];
    }},
  ];

  return (
    <DropdownWrapper
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      width="w-64"
      trigger={
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setIsOpen(!isOpen);
          }}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-colors',
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-purple-600 cursor-pointer',
            displayInfo?.isOverdue ? 'text-red-600 font-medium' : displayInfo ? 'text-gray-700' : 'text-gray-400'
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          {displayInfo?.text || placeholder}
        </button>
      }
    >
      <div className="p-3">
        {/* Quick Options */}
        <div className="space-y-1 mb-3">
          {quickDates.map((option) => (
            <button
              key={option.label}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(option.getValue());
                setIsOpen(false);
              }}
              className="w-full px-2 py-1.5 text-sm text-left text-gray-700 hover:bg-gray-50 rounded transition-colors"
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-3">
          <label className="block text-xs font-medium text-gray-500 mb-1">Custom date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(selectedDate || null);
                setIsOpen(false);
              }}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
                setSelectedDate('');
                setIsOpen(false);
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </DropdownWrapper>
  );
};

// ============================================================
// ASSIGNEE DROPDOWN - FIXED to show all assignees properly
// ============================================================

interface AssigneeDropdownProps {
  currentAssignees: Array<{ id: string | number; username?: string; email?: string; profilePicture?: string }>;
  availableUsers: Array<{ id: string | number; username?: string; email?: string; profilePicture?: string }>;
  onToggle: (user: any) => void;
  onRemove: (userId: string | number) => void;
  disabled?: boolean;
  multiple?: boolean;
}

export const AssigneeDropdown: React.FC<AssigneeDropdownProps> = ({
  currentAssignees,
  availableUsers,
  onToggle,
  onRemove,
  disabled = false,
  multiple = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredUsers = availableUsers.filter((user) => {
    const name = user.username || user.email || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const isAssigned = (userId: string | number) => currentAssignees.some((a) => String(a.id) === String(userId));

  // Get avatar color based on name
  const getAvatarColor = (name: string | undefined): string => {
    const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#6366F1', '#14B8A6'];
    if (!name) return colors[0];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <DropdownWrapper
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false);
        setSearch('');
      }}
      width="w-64"
      trigger={
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setIsOpen(!isOpen);
          }}
          disabled={disabled}
          className={cn(
            'flex items-center',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          )}
        >
          {currentAssignees.length > 0 ? (
            <div className="flex -space-x-1.5">
              {currentAssignees.slice(0, 4).map((assignee, i) => (
                <div
                  key={String(assignee.id) || i}
                  className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center"
                  style={{ backgroundColor: getAvatarColor(assignee.username || assignee.email) }}
                  title={assignee.username || assignee.email}
                >
                  {assignee.profilePicture ? (
                    <img
                      src={assignee.profilePicture}
                      alt={assignee.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-medium text-white">
                      {(assignee.username || assignee.email || '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
              {currentAssignees.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-500">+{currentAssignees.length - 4}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-purple-400 transition-colors">
              <User className="h-3.5 w-3.5 text-gray-400" />
            </div>
          )}
        </button>
      }
    >
      <div>
        {/* Search */}
        <div className="p-2 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {/* Current Assignees */}
        {currentAssignees.length > 0 && (
          <div className="p-2 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-1">Assigned ({currentAssignees.length})</div>
            {currentAssignees.map((assignee) => (
              <div
                key={String(assignee.id)}
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: getAvatarColor(assignee.username || assignee.email) }}
                  >
                    {assignee.profilePicture ? (
                      <img src={assignee.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-white">
                        {(assignee.username || assignee.email || '?')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-700 truncate max-w-[140px]">{assignee.username || assignee.email}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(assignee.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Available Users */}
        <div className="max-h-48 overflow-y-auto p-2">
          {filteredUsers.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">No users found</div>
          ) : (
            filteredUsers.map((user) => {
              const assigned = isAssigned(user.id);
              return (
                <button
                  key={String(user.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(user);
                    if (!multiple) setIsOpen(false);
                  }}
                  className={cn(
                    'flex items-center gap-2 w-full py-1.5 px-2 rounded text-left transition-colors',
                    assigned ? 'bg-purple-50' : 'hover:bg-gray-50'
                  )}
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: getAvatarColor(user.username || user.email) }}
                  >
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-white">
                        {(user.username || user.email || '?')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="flex-1 text-sm text-gray-700 truncate">{user.username || user.email}</span>
                  {assigned && <Check className="h-4 w-4 text-purple-600" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </DropdownWrapper>
  );
};

// ============================================================
// ADD FIELD DROPDOWN
// ============================================================

export interface FieldType {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

export const AVAILABLE_FIELD_TYPES: FieldType[] = [
  { id: 'dropdown', label: 'Dropdown', icon: <ChevronDown className="h-4 w-4" />, description: 'Single select from options' },
  { id: 'text', label: 'Text', icon: <Type className="h-4 w-4" />, description: 'Short text input' },
  { id: 'date', label: 'Date', icon: <Calendar className="h-4 w-4" />, description: 'Date picker' },
  { id: 'textarea', label: 'Text area (Long Text)', icon: <AlignLeft className="h-4 w-4" />, description: 'Multi-line text' },
  { id: 'number', label: 'Number', icon: <Hash className="h-4 w-4" />, description: 'Numeric value' },
  { id: 'labels', label: 'Labels', icon: <Tag className="h-4 w-4" />, description: 'Multiple labels/tags' },
  { id: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="h-4 w-4" />, description: 'Yes/No toggle' },
  { id: 'assignee', label: 'Assignee', icon: <User className="h-4 w-4" />, description: 'Assign team members' },
  { id: 'watcher', label: 'Watcher', icon: <Eye className="h-4 w-4" />, description: 'People watching this task' },
  { id: 'responsible', label: 'Responsible', icon: <UserCheck className="h-4 w-4" />, description: 'Primary responsible person' },
  { id: 'dependency', label: 'Dependency Task', icon: <Link2 className="h-4 w-4" />, description: 'Link dependent tasks' },
  { id: 'recurring', label: 'Recurring task', icon: <Repeat className="h-4 w-4" />, description: 'Set repeat schedule' },
  { id: 'dueDate', label: 'Due date', icon: <Calendar className="h-4 w-4" />, description: 'Task deadline' },
];

interface AddFieldDropdownProps {
  onAddField: (fieldType: FieldType) => void;
  existingFields?: string[];
}

export const AddFieldDropdown: React.FC<AddFieldDropdownProps> = ({
  onAddField,
  existingFields = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredFields = AVAILABLE_FIELD_TYPES.filter(
    (field) =>
      !existingFields.includes(field.id) &&
      field.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DropdownWrapper
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false);
        setSearch('');
      }}
      width="w-72"
      align="right"
      trigger={
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      }
    >
      <div>
        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Add Field</h3>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search fields..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {/* Field Types */}
        <div className="max-h-64 overflow-y-auto p-2">
          {filteredFields.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">No fields available</div>
          ) : (
            filteredFields.map((field) => (
              <button
                key={field.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddField(field);
                  setIsOpen(false);
                }}
                className="flex items-start gap-3 w-full p-2 rounded-lg text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg text-gray-600">
                  {field.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{field.label}</div>
                  {field.description && (
                    <div className="text-xs text-gray-500 truncate">{field.description}</div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </DropdownWrapper>
  );
};

// ============================================================
// ETA / TIMER DISPLAY - FIXED: Circle instead of Square
// ============================================================

interface ETADisplayProps {
  eta?: string | null;
  timeSpent?: number;
  onTimerToggle?: () => void;
  isRunning?: boolean;
}

export const ETADisplay: React.FC<ETADisplayProps> = ({
  eta,
  timeSpent = 0,
  onTimerToggle,
  isRunning = false,
}) => {
  const [countdown, setCountdown] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!eta) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const deadline = new Date(eta);
      const diff = deadline.getTime() - now.getTime();

      if (diff < 0) {
        setIsOverdue(true);
        const absDiff = Math.abs(diff);
        const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setCountdown(`${days}d, ${hours}h overdue`);
        } else if (hours > 0) {
          setCountdown(`${hours}h, ${minutes}m overdue`);
        } else {
          setCountdown(`${minutes}m overdue`);
        }
      } else {
        setIsOverdue(false);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          setCountdown(`${days}d, ${hours}h, ${minutes}m, ${seconds}s left`);
        } else if (hours > 0) {
          setCountdown(`${hours}h, ${minutes}m, ${seconds}s left`);
        } else if (minutes > 0) {
          setCountdown(`${minutes}m, ${seconds}s left`);
        } else {
          setCountdown(`${seconds}s left`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [eta]);

  // Format time spent
  const formatTimeSpent = (ms: number) => {
    if (!ms || ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // If we have ETA countdown, show that with CIRCLE indicator (FIXED from square)
  if (eta && countdown) {
    return (
      <div className="flex items-center gap-2">
        {/* FIXED: Changed from rounded-sm to rounded-full for circle */}
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full flex-shrink-0',
            isOverdue ? 'bg-red-500' : 'bg-green-500'
          )}
        />
        <span
          className={cn(
            'text-sm font-medium whitespace-nowrap',
            isOverdue ? 'text-red-600' : 'text-gray-700'
          )}
        >
          {countdown}
        </span>
      </div>
    );
  }

  // Otherwise show timer button
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onTimerToggle?.();
      }}
      className={cn(
        'flex items-center gap-1.5 text-sm font-medium transition-colors',
        isRunning ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>{formatTimeSpent(timeSpent)}parseInt(selectedTask.time_spent)</span>
    </button>
  );
};

export default {
  DropdownWrapper,
  StatusDropdown,
  PriorityDropdown,
  DatePickerDropdown,
  AssigneeDropdown,
  AddFieldDropdown,
  ETADisplay,
};