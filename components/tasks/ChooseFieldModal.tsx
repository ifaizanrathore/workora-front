'use client';

import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Heart,
  Type,
  Calendar,
  Square,
  Hash,
  Circle,
  CheckSquare,
  Users,
  Eye,
  EyeOff,
  BadgeCheck,
  Link2,
  RotateCw,
  Search,
  Zap,
  Plus,
  Smile,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Field {
  id: string;
  label: string;
  icon: React.ElementType;
  visible: boolean;
  description?: string;
}

interface ChooseFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFieldToggle?: (fieldId: string, visible: boolean) => void;
}

// Field Configuration Modal (Second Figma Image)
interface FieldConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: Field | null;
  onSave: (config: FieldConfig) => void;
}

interface FieldConfig {
  fieldName: string;
  format: string;
  aiPrompt: string;
  automations: {
    autofillOnCreate: boolean;
    autofillOnChange: boolean;
    autofillExisting: boolean;
  };
}

const formatOptions = [
  'Plain Text',
  'Bulleted List',
  'Numbered List',
  'Paragraph',
  'Rich Text',
];

const FieldConfigModal: React.FC<FieldConfigModalProps> = ({
  isOpen,
  onClose,
  field,
  onSave,
}) => {
  const [fieldName, setFieldName] = useState(field?.label || 'Task Summary');
  const [format, setFormat] = useState('Bulleted List');
  const [aiPrompt, setAiPrompt] = useState(
    'Given information about a task, your role is to:\nSummarize the task to get the most important details and latest updates Use up to 4 lines. Use very simple wording and language and avoid fluffy language'
  );
  const [automations, setAutomations] = useState({
    autofillOnCreate: true,
    autofillOnChange: false,
    autofillExisting: true,
  });
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);

  if (!isOpen || !field) return null;

  const Icon = field.icon;

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#ECECEC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-[#6B7280]" strokeWidth={1.5} />
            </button>
            <div className="p-1.5 rounded-md bg-[#F3F4F6]">
              <Icon className="h-4 w-4 text-[#6B7280]" strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#111827]">{field.label}</span>
              <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-[#6B7280]" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Field Name & Format */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#EF4444]">
                Field name <span className="text-[#EF4444]">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Smile className="h-4 w-4 text-[#9CA3AF]" />
                </div>
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-[#5B4FD1] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5B4FD1]/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#6B7280]">Format</label>
              <div className="relative">
                <button
                  onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2.5 border border-[#D1D5DB] rounded-lg text-sm text-[#111827] hover:border-[#9CA3AF] transition-colors"
                >
                  <span>{format}</span>
                  <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                </button>

                {showFormatDropdown && (
                  <div className="absolute top-full mt-1 left-0 w-full bg-white border border-[#D1D5DB] rounded-lg shadow-lg z-10">
                    {formatOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setFormat(option);
                          setShowFormatDropdown(false);
                        }}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors',
                          option === format && 'bg-[#5B4FD1]/5 text-[#5B4FD1]'
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#6B7280]">
              Tell AI how to fill out this field
            </label>
            <div className="relative">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full px-4 py-3 border border-[#FFD700] rounded-lg text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#5B4FD1] focus:ring-2 focus:ring-[#5B4FD1]/10 resize-none h-32"
              />
              <div className="absolute bottom-3 right-3">
                <button className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#5B4FD1] transition-colors">
                  Add more context to your prompt
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Automations */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#111827]">Automations</span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#5B4FD1]/10 rounded">
                <Zap className="h-3 w-3 text-[#5B4FD1]" />
                <span className="text-xs font-medium text-[#5B4FD1]">AI</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Autofill on Create */}
              <button
                onClick={() => setAutomations(prev => ({ ...prev, autofillOnCreate: !prev.autofillOnCreate }))}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-all',
                  automations.autofillOnCreate
                    ? 'border-[#5B4FD1] bg-[#5B4FD1]/5 text-[#5B4FD1]'
                    : 'border-[#D1D5DB] text-[#6B7280] hover:border-[#9CA3AF]'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                  automations.autofillOnCreate ? 'border-[#5B4FD1] bg-[#5B4FD1]' : 'border-[#D1D5DB]'
                )}>
                  {automations.autofillOnCreate && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span>Autofill when task are created</span>
              </button>

              {/* Autofill on Change */}
              <button
                onClick={() => setAutomations(prev => ({ ...prev, autofillOnChange: !prev.autofillOnChange }))}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-all',
                  automations.autofillOnChange
                    ? 'border-[#5B4FD1] bg-[#5B4FD1]/5 text-[#5B4FD1]'
                    : 'border-[#D1D5DB] text-[#6B7280] hover:border-[#9CA3AF]'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                  automations.autofillOnChange ? 'border-[#5B4FD1] bg-[#5B4FD1]' : 'border-[#D1D5DB]'
                )}>
                  {automations.autofillOnChange && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span>Autofill update when task change</span>
              </button>

              {/* Autofill Existing */}
              <button
                onClick={() => setAutomations(prev => ({ ...prev, autofillExisting: !prev.autofillExisting }))}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-all',
                  automations.autofillExisting
                    ? 'border-[#5B4FD1] bg-[#5B4FD1]/5 text-[#5B4FD1]'
                    : 'border-[#D1D5DB] text-[#6B7280] hover:border-[#9CA3AF]'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                  automations.autofillExisting ? 'border-[#5B4FD1] bg-[#5B4FD1]' : 'border-[#D1D5DB]'
                )}>
                  {automations.autofillExisting && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span>Autofill existing tasks</span>
              </button>
            </div>
          </div>

          {/* More Settings Link */}
          <button className="flex items-center justify-between w-full py-3 text-sm font-medium text-[#111827] hover:text-[#5B4FD1] transition-colors">
            <span>More settings and permissions</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F9FAFB] border-t border-[#ECECEC] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#6B7280] hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({ fieldName, format, aiPrompt, automations });
              onClose();
            }}
            className="px-5 py-2 bg-[#5B4FD1] text-white rounded-lg text-sm font-medium hover:bg-[#4A3FB8] transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Choose Field Modal
export const ChooseFieldModal: React.FC<ChooseFieldModalProps> = ({
  isOpen,
  onClose,
  onFieldToggle,
}) => {
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [configField, setConfigField] = useState<Field | null>(null);
  const [fields, setFields] = useState<Field[]>([
    { id: 'dropdown', label: 'Drop down', icon: Heart, visible: true, description: 'Select from predefined options' },
    { id: 'text', label: 'Text', icon: Type, visible: false, description: 'Single line text input' },
    { id: 'date', label: 'Date', icon: Calendar, visible: true, description: 'Date and time picker' },
    { id: 'textarea', label: 'Text area (Long Text)', icon: Square, visible: false, description: 'Multi-line text input' },
    { id: 'number', label: 'Number', icon: Hash, visible: false, description: 'Numeric values' },
    { id: 'labels', label: 'Labels', icon: Circle, visible: true, description: 'Categorize with labels' },
    { id: 'checkbox', label: 'Checkbox', icon: CheckSquare, visible: false, description: 'Yes/No toggle' },
    { id: 'assignee', label: 'Assignee', icon: Users, visible: false, description: 'Assign to team members' },
    { id: 'watcher', label: 'Watcher', icon: Eye, visible: true, description: 'Track task updates' },
    { id: 'responsible', label: 'Responsible', icon: BadgeCheck, visible: true, description: 'Primary owner' },
    { id: 'dependency', label: 'Dependency Task', icon: Link2, visible: false, description: 'Link related tasks' },
    { id: 'recurring', label: 'Recurring task', icon: RotateCw, visible: true, description: 'Repeat on schedule' },
    { id: 'dueDate', label: 'Due date', icon: Calendar, visible: true, description: 'Task deadline' },
  ]);

  const toggleFieldVisibility = (id: string) => {
    setFields(fields.map(field => {
      if (field.id === id) {
        const newVisible = !field.visible;
        onFieldToggle?.(id, newVisible);
        return { ...field, visible: newVisible };
      }
      return field;
    }));
  };

  const openFieldConfig = (field: Field) => {
    setConfigField(field);
  };

  const filteredFields = fields.filter(field =>
    field.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleCount = fields.filter(f => f.visible).length;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-xl shadow-xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#ECECEC] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-[#6B7280]" strokeWidth={1.5} />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">Choose field</h2>
                <p className="text-xs text-[#9CA3AF]">{visibleCount} fields visible</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="h-5 w-5 text-[#6B7280]" strokeWidth={1.5} />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-[#ECECEC]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fields..."
                className="w-full pl-9 pr-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#5B4FD1] focus:ring-1 focus:ring-[#5B4FD1]/20"
              />
            </div>
          </div>

          {/* Set as default toggle */}
          <div className="px-6 py-3 border-b border-[#ECECEC] flex items-center justify-between bg-[#F9FAFB]">
            <div>
              <span className="text-sm text-[#374151] font-medium">Set as default</span>
              <p className="text-xs text-[#9CA3AF]">Apply to all new tasks</p>
            </div>
            <button
              onClick={() => setSetAsDefault(!setAsDefault)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors',
                setAsDefault ? 'bg-[#5B4FD1]' : 'bg-[#D1D5DB]'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm',
                  setAsDefault && 'translate-x-5'
                )}
              />
            </button>
          </div>

          {/* Fields List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="mb-3">
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">
                All Fields
              </span>
            </div>

            <div className="space-y-1">
              {filteredFields.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] py-4 text-center">No fields found</p>
              ) : (
                filteredFields.map((field) => {
                  const Icon = field.icon;
                  return (
                    <div
                      key={field.id}
                      className="flex items-center justify-between px-3 py-2.5 hover:bg-[#F3F4F6] rounded-lg transition-colors group"
                    >
                      <button
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        onClick={() => openFieldConfig(field)}
                      >
                        <div className={cn(
                          'p-1.5 rounded-md',
                          field.visible ? 'bg-[#5B4FD1]/10' : 'bg-[#F3F4F6]'
                        )}>
                          <Icon
                            className={cn(
                              'h-4 w-4',
                              field.visible ? 'text-[#5B4FD1]' : 'text-[#9CA3AF]'
                            )}
                            strokeWidth={1.5}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            'text-sm font-medium block',
                            field.visible ? 'text-[#111827]' : 'text-[#6B7280]'
                          )}>
                            {field.label}
                          </span>
                          {field.description && (
                            <span className="text-xs text-[#9CA3AF] truncate block">
                              {field.description}
                            </span>
                          )}
                        </div>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFieldVisibility(field.id);
                        }}
                        className={cn(
                          'p-1.5 rounded-md transition-all',
                          field.visible
                            ? 'bg-[#5B4FD1]/10 text-[#5B4FD1]'
                            : 'hover:bg-gray-200 text-[#9CA3AF]'
                        )}
                      >
                        {field.visible ? (
                          <Eye className="h-4 w-4" strokeWidth={1.5} />
                        ) : (
                          <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-[#F9FAFB] border-t border-[#ECECEC] flex items-center justify-between">
            <button
              onClick={() => {
                setFields(fields.map(f => ({ ...f, visible: false })));
              }}
              className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              Hide all
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#5B4FD1] text-white rounded-lg text-sm font-medium hover:bg-[#4A3FB8] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Field Config Modal */}
      <FieldConfigModal
        isOpen={!!configField}
        onClose={() => setConfigField(null)}
        field={configField}
        onSave={(config) => {
          console.log('Saved config:', config);
        }}
      />
    </>
  );
};

export default ChooseFieldModal;