'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal,
  Clock,
  Calendar,
  Eye,
  Link2,
  CheckSquare,
  Settings,
  Plus,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldOption {
  id: string;
  label: string;
  icon: React.ElementType;
  description?: string;
}

const quickFields: FieldOption[] = [
  { id: 'checklist', label: 'Checklist', icon: CheckSquare, description: 'Add subtasks' },
  { id: 'watchers', label: 'Watchers', icon: Eye, description: 'Notify others' },
  { id: 'dependencies', label: 'Dependencies', icon: Link2 },
  { id: 'timeEstimate', label: 'Time Estimate', icon: Clock },
  { id: 'startDate', label: 'Start Date', icon: Calendar },
];

interface AddFieldsDropdownProps {
  visibleFields: Record<string, boolean>;
  onToggleField: (fieldId: string) => void;
  onOpenAllFields: () => void;
}

export const AddFieldsDropdown: React.FC<AddFieldsDropdownProps> = ({
  visibleFields,
  onToggleField,
  onOpenAllFields,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleFieldToggle = (fieldId: string) => {
    onToggleField(fieldId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center w-8 h-8 border rounded-lg transition-all",
          isOpen
            ? "border-[#5B4FD1] bg-[#5B4FD1]/5 text-[#5B4FD1]"
            : "border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50 hover:border-[#D1D5DB]"
        )}
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-56 bg-white rounded-xl shadow-lg border border-[#E5E7EB] py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Field Options */}
          {quickFields.map((field) => {
            const Icon = field.icon;
            const isVisible = visibleFields[field.id];

            return (
              <button
                key={field.id}
                onClick={() => handleFieldToggle(field.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F9FAFB] transition-colors text-left group"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  isVisible ? "bg-[#5B4FD1]/10" : "bg-[#F3F4F6] group-hover:bg-[#ECEDF0]"
                )}>
                  <Icon 
                    className={cn(
                      "h-4 w-4",
                      isVisible ? "text-[#5B4FD1]" : "text-[#6B7280]"
                    )} 
                    strokeWidth={1.5} 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-sm block",
                    isVisible ? "text-[#111827] font-medium" : "text-[#374151]"
                  )}>
                    {field.label}
                  </span>
                  {field.description && (
                    <span className="text-xs text-[#9CA3AF]">{field.description}</span>
                  )}
                </div>
                {isVisible && (
                  <div className="w-5 h-5 rounded-full bg-[#5B4FD1] flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                  </div>
                )}
              </button>
            );
          })}

          {/* Divider */}
          <div className="my-1.5 border-t border-[#F3F4F6]" />

          {/* All Fields */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenAllFields();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F9FAFB] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
              <Settings className="h-4 w-4 text-[#6B7280]" strokeWidth={1.5} />
            </div>
            <span className="text-sm text-[#374151]">All Fields...</span>
          </button>

          {/* Create Custom Field */}
          <button
            onClick={() => {
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F9FAFB] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#5B4FD1]/10 flex items-center justify-center">
              <Plus className="h-4 w-4 text-[#5B4FD1]" strokeWidth={1.5} />
            </div>
            <span className="text-sm text-[#5B4FD1] font-medium">Create Custom Field</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AddFieldsDropdown;