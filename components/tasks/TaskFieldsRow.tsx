'use client';

import React from 'react';
import {
  ChevronDown,
  Clock,
  User,
  Calendar,
  Flag,
  Tag,
  CheckSquare,
  Repeat,
} from 'lucide-react';
import { cn, getPriorityColor } from '@/lib/utils';
import type {
  TaskStatus,
  Priority,
  Assignee,
  TaskTag,
} from '@/hooks';

import { StatusPopover } from './popovers/StatusPopover';
import { PriorityPopover } from './popovers/PriorityPopover';
import { DueDatePopover } from './popovers/DueDatePopover';
import { AssigneePopover } from './popovers/AssigneePopover';
import { TagsPopover } from './popovers/TagsPopover';
import { ChecklistPopover } from './popovers/ChecklistPopover';
import { RecurrencePopover } from './popovers/RecurrencePopover';
import { AddFieldsDropdown } from './AddFieldsDropdown';
import type { RecurrenceConfig } from '@/types';
import { getRecurrenceLabel } from '@/hooks/useRecurrence';

interface TaskFieldsRowProps {
  status: TaskStatus | null;
  priority: Priority | null;
  assignees: Assignee[];
  tags: TaskTag[];
  dueDate: string;
  startDate: string;
  timeEstimate: string;
  visibleFields: Record<string, boolean>;
  availableStatuses: TaskStatus[];
  availableMembers: Assignee[];
  availableTags: TaskTag[];
  onStatusChange: (status: TaskStatus | null) => void;
  onPriorityChange: (priority: Priority | null) => void;
  onAddAssignee: (assignee: Assignee) => void;
  onAddTag: (tag: TaskTag) => void;
  onDueDateChange: (date: string) => void;
  onStartDateChange: (date: string) => void;
  onTimeEstimateChange: (estimate: string) => void;
  onAddChecklist: (name: string) => void;
  recurrence: RecurrenceConfig | null;
  onRecurrenceChange: (config: RecurrenceConfig | null) => void;
  onToggleFieldVisibility: (field: string) => void;
  onOpenChooseFieldModal: () => void;
}


export const TaskFieldsRow: React.FC<TaskFieldsRowProps> = ({
  status,
  priority,
  assignees,
  tags,
  dueDate,
  startDate,
  timeEstimate,
  visibleFields,
  availableStatuses,
  availableMembers,
  availableTags,
  onStatusChange,
  onPriorityChange,
  onAddAssignee,
  onAddTag,
  onDueDateChange,
  onStartDateChange,
  onTimeEstimateChange,
  onAddChecklist,
  recurrence,
  onRecurrenceChange,
  onToggleFieldVisibility,
  onOpenChooseFieldModal,
}) => {
  const [showTimeEstimateInput, setShowTimeEstimateInput] = React.useState(false);
  const timeEstimateRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Task Details
      </label>

      {/* Field Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Status */}
        <StatusPopover
          selected={status}
          onSelect={onStatusChange}
          statuses={availableStatuses}
        >
          <button
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
            aria-label="Set task status"
          >
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
          <PriorityPopover selected={priority} onSelect={onPriorityChange}>
            <button
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                priority
                  ? 'text-white'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              )}
              style={priority ? { backgroundColor: getPriorityColor(priority.id) } : undefined}
              aria-label="Set task priority"
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
            onDueDateChange={onDueDateChange}
            onStartDateChange={onStartDateChange}
            onTimeEstimateChange={onTimeEstimateChange}
          >
            <button
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                dueDate
                  ? 'bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              )}
              aria-label="Set due date"
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
                onAddAssignee(member);
              }
            }}
            members={availableMembers}
          >
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
              aria-label="Add assignees"
            >
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
                onAddTag(tag);
              }
            }}
            tags={availableTags}
          >
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
              aria-label="Add tags"
            >
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
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                timeEstimate
                  ? 'bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              )}
              aria-label="Set time estimate"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{timeEstimate ? `${timeEstimate}h` : 'Estimate'}</span>
            </button>

            {showTimeEstimateInput && (
              <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 z-50 w-52">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block" htmlFor="time-estimate">
                  Time Estimate
                </label>
                <input
                  id="time-estimate"
                  type="number"
                  value={timeEstimate}
                  onChange={(e) => onTimeEstimateChange(e.target.value)}
                  placeholder="Hours"
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:border-purple-500 mb-3"
                  autoFocus
                  aria-label="Time estimate in hours"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onTimeEstimateChange('');
                      setShowTimeEstimateInput(false);
                    }}
                    className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label="Clear time estimate"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowTimeEstimateInput(false)}
                    className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    aria-label="Confirm time estimate"
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
            onAdd={(name) => onAddChecklist(name)}
          >
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
              aria-label="Add checklist"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Checklist</span>
            </button>
          </ChecklistPopover>
        )}

        {/* Recurrence */}
        {visibleFields.recurring && (
          <RecurrencePopover
            value={recurrence}
            onChange={onRecurrenceChange}
          >
            <button
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                recurrence
                  ? 'bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              )}
              aria-label="Set recurrence"
            >
              <Repeat className="h-3.5 w-3.5" />
              <span>{recurrence ? getRecurrenceLabel({ enabled: true, ...recurrence, end_type: recurrence.endType || 'never' }) : 'Recurring'}</span>
            </button>
          </RecurrencePopover>
        )}

        {/* Add More Fields */}
        <AddFieldsDropdown
          visibleFields={visibleFields}
          onToggleField={onToggleFieldVisibility}
          onOpenAllFields={onOpenChooseFieldModal}
        />
      </div>
    </div>
  );
};
