'use client';

import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Type,
  Calendar,
  Hash,
  Circle,
  CheckSquare,
  Users,
  Eye,
  EyeOff,
  Link2,
  RotateCw,
  Search,
  Zap,
  Plus,
  Clock,
  Flag,
  Tag,
  FileText,
  Paperclip,
  ListTodo,
  AlignLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Field {
  id: string;
  label: string;
  icon: React.ElementType;
  visible: boolean;
  description?: string;
  category?: 'basic' | 'advanced' | 'custom';
}

interface ChooseFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFieldToggle?: (fieldId: string, visible: boolean) => void;
}

// Field Configuration Modal
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
    'Given information about a task, summarize the key details and latest updates in up to 4 lines using simple, clear language.'
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
    <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                <Icon className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{field.label}</h3>
                <p className="text-xs text-gray-500">Configure field settings</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Field Name & Format */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Field name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Format</label>
              <div className="relative">
                <button
                  onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                  className="w-full flex items-center justify-between px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-900 hover:border-gray-300 transition-all"
                >
                  <span>{format}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {showFormatDropdown && (
                  <div className="absolute top-full mt-2 left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                    {formatOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setFormat(option);
                          setShowFormatDropdown(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors',
                          option === format && 'bg-purple-50 text-purple-700 font-medium'
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
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                AI Instructions
              </label>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 rounded-lg">
                <Zap className="h-3 w-3 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">AI Powered</span>
              </div>
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Tell AI how to fill out this field..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 resize-none h-28 transition-all"
            />
          </div>

          {/* Automations */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Automations</label>
            <div className="space-y-2">
              {[
                { key: 'autofillOnCreate', label: 'Auto-fill when tasks are created' },
                { key: 'autofillOnChange', label: 'Update when task changes' },
                { key: 'autofillExisting', label: 'Fill existing tasks' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setAutomations(prev => ({ ...prev, [key]: !prev[key as keyof typeof automations] }))}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 text-sm transition-all text-left',
                    automations[key as keyof typeof automations]
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                    automations[key as keyof typeof automations]
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300'
                  )}>
                    {automations[key as keyof typeof automations] && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* More Settings */}
          <button className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
            <span>More settings and permissions</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({ fieldName, format, aiPrompt, automations });
              onClose();
            }}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm"
          >
            Save Field
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
    // Basic Fields
    { id: 'status', label: 'Status', icon: Circle, visible: true, description: 'Track task progress', category: 'basic' },
    { id: 'priority', label: 'Priority', icon: Flag, visible: true, description: 'Set importance level', category: 'basic' },
    { id: 'dueDate', label: 'Due Date', icon: Calendar, visible: true, description: 'Task deadline', category: 'basic' },
    { id: 'assignee', label: 'Assignee', icon: Users, visible: true, description: 'Assign team members', category: 'basic' },
    { id: 'tags', label: 'Tags', icon: Tag, visible: true, description: 'Categorize with labels', category: 'basic' },
    // Advanced Fields
    { id: 'timeEstimate', label: 'Time Estimate', icon: Clock, visible: false, description: 'Estimated duration', category: 'advanced' },
    { id: 'startDate', label: 'Start Date', icon: Calendar, visible: false, description: 'When to begin', category: 'advanced' },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare, visible: false, description: 'Subtask items', category: 'advanced' },
    { id: 'watcher', label: 'Watchers', icon: Eye, visible: false, description: 'Track updates', category: 'advanced' },
    { id: 'dependency', label: 'Dependencies', icon: Link2, visible: false, description: 'Link related tasks', category: 'advanced' },
    { id: 'recurring', label: 'Recurring', icon: RotateCw, visible: false, description: 'Repeat on schedule', category: 'advanced' },
    { id: 'attachments', label: 'Attachments', icon: Paperclip, visible: false, description: 'Add files', category: 'advanced' },
    // Custom Fields
    { id: 'text', label: 'Text Field', icon: Type, visible: false, description: 'Single line text', category: 'custom' },
    { id: 'textarea', label: 'Long Text', icon: AlignLeft, visible: false, description: 'Multi-line text', category: 'custom' },
    { id: 'number', label: 'Number', icon: Hash, visible: false, description: 'Numeric values', category: 'custom' },
    { id: 'dropdown', label: 'Dropdown', icon: ListTodo, visible: false, description: 'Select options', category: 'custom' },
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

  const basicFields = filteredFields.filter(f => f.category === 'basic');
  const advancedFields = filteredFields.filter(f => f.category === 'advanced');
  const customFields = filteredFields.filter(f => f.category === 'custom');

  const visibleCount = fields.filter(f => f.visible).length;

  if (!isOpen) return null;

  const FieldItem = ({ field }: { field: Field }) => {
    const Icon = field.icon;
    return (
      <div
        className={cn(
          'flex items-center justify-between p-3 rounded-xl transition-all group',
          field.visible ? 'bg-purple-50' : 'hover:bg-gray-50'
        )}
      >
        <button
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
          onClick={() => openFieldConfig(field)}
        >
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
            field.visible ? 'bg-purple-100' : 'bg-gray-100'
          )}>
            <Icon className={cn(
              'h-4 w-4',
              field.visible ? 'text-purple-600' : 'text-gray-500'
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <span className={cn(
              'text-sm font-medium block',
              field.visible ? 'text-gray-900' : 'text-gray-700'
            )}>
              {field.label}
            </span>
            {field.description && (
              <span className="text-xs text-gray-500 truncate block">
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
            'p-2 rounded-lg transition-all',
            field.visible
              ? 'bg-purple-200 text-purple-700 hover:bg-purple-300'
              : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600'
          )}
        >
          {field.visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  };

  const FieldSection = ({ title, fields }: { title: string; fields: Field[] }) => {
    if (fields.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
          {title}
        </h4>
        <div className="space-y-1">
          {fields.map((field) => (
            <FieldItem key={field.id} field={field} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                <ListTodo className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Manage Fields</h2>
                <p className="text-xs text-gray-500">{visibleCount} of {fields.length} visible</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fields..."
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
              />
            </div>
          </div>

          {/* Set as default toggle */}
          <div className="mx-6 mb-3 p-4 bg-gray-50 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">Set as default</span>
              <p className="text-xs text-gray-500">Apply to all new tasks</p>
            </div>
            <button
              onClick={() => setSetAsDefault(!setAsDefault)}
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors',
                setAsDefault ? 'bg-purple-600' : 'bg-gray-300'
              )}
            >
              <div
                className={cn(
                  'absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm',
                  setAsDefault && 'translate-x-5'
                )}
              />
            </button>
          </div>

          {/* Fields List */}
          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-5">
            {filteredFields.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No fields found</p>
              </div>
            ) : (
              <>
                <FieldSection title="Basic Fields" fields={basicFields} />
                <FieldSection title="Advanced Fields" fields={advancedFields} />
                <FieldSection title="Custom Fields" fields={customFields} />
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => {
                setFields(fields.map(f => ({ ...f, visible: false })));
              }}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Hide all
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFields(fields.map(f => f.category === 'basic' ? { ...f, visible: true } : { ...f, visible: false }));
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Reset
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
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