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
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate position when dropdown opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 240; // w-60 = 15rem = 240px
      const dropdownHeight = 380; // approximate height
      
      // Position to the right of the button
      let left = rect.right + 8;
      let top = rect.top;
      
      // Check if dropdown would go off the right edge of the screen
      if (left + dropdownWidth > window.innerWidth) {
        // Position to the left of the button instead
        left = rect.left - dropdownWidth - 8;
      }
      
      // Check if dropdown would go off the bottom of the screen
      if (top + dropdownHeight > window.innerHeight) {
        // Align to bottom
        top = window.innerHeight - dropdownHeight - 16;
      }
      
      // Make sure it doesn't go above the viewport
      if (top < 16) {
        top = 16;
      }
      
      setPosition({ top, left });
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
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
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center w-9 h-9 border-2 rounded-xl transition-all",
          isOpen
            ? "border-purple-500 bg-purple-50 text-purple-600"
            : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300"
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="fixed w-60 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-[200] animate-in fade-in slide-in-from-left-2 duration-150"
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          {/* Header */}
          <div className="px-3 pb-2 mb-1 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Add Fields</span>
          </div>
          
          {/* Field Options */}
          {quickFields.map((field) => {
            const Icon = field.icon;
            const isVisible = visibleFields[field.id];

            return (
              <button
                key={field.id}
                onClick={() => handleFieldToggle(field.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left",
                  isVisible ? "bg-purple-50" : "hover:bg-gray-50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  isVisible ? "bg-purple-100" : "bg-gray-100"
                )}>
                  <Icon 
                    className={cn(
                      "h-4 w-4",
                      isVisible ? "text-purple-600" : "text-gray-500"
                    )} 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-sm block",
                    isVisible ? "text-gray-900 font-medium" : "text-gray-700"
                  )}>
                    {field.label}
                  </span>
                  {field.description && (
                    <span className="text-xs text-gray-500">{field.description}</span>
                  )}
                </div>
                {isVisible && (
                  <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                  </div>
                )}
              </button>
            );
          })}

          {/* Divider */}
          <div className="my-2 border-t border-gray-100" />

          {/* All Fields */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenAllFields();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Settings className="h-4 w-4 text-gray-500" />
            </div>
            <span className="text-sm text-gray-700">All Fields...</span>
          </button>

          {/* Create Custom Field */}
          <button
            onClick={() => {
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-purple-50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Plus className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-sm text-purple-600 font-medium">Create Custom Field</span>
          </button>
        </div>
      )}
    </>
  );
};

export default AddFieldsDropdown;