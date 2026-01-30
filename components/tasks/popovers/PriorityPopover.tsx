'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Flag, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Priority {
  id: string;
  label: string;
  color: string;
  textColor: string;
}

const priorityOptions: Priority[] = [
  { id: '1', label: 'Urgent', color: 'bg-red-500', textColor: 'text-red-600' },
  { id: '2', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { id: '3', label: 'Normal', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { id: '4', label: 'Low', color: 'bg-gray-400', textColor: 'text-gray-600' },
];

export interface PriorityPopoverProps {
  children: React.ReactNode;
  selected: Priority | null;
  onSelect: (priority: Priority | null) => void;
}

export const PriorityPopover: React.FC<PriorityPopoverProps> = ({
  children,
  selected,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverHeight = 280;
      const popoverWidth = 200;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceRight = window.innerWidth - rect.left;
      
      let top = rect.bottom + 8;
      let left = rect.left;

      if (spaceBelow < popoverHeight && rect.top > popoverHeight) {
        top = rect.top - popoverHeight - 8;
      }

      if (spaceRight < popoverWidth) {
        left = Math.max(8, rect.right - popoverWidth);
      }

      setPosition({ top, left });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const popoverContent = isOpen ? (
    <div
      ref={popoverRef}
      className="fixed z-[9999] w-[200px] bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6] bg-[#FAFAFA]">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-[#5B4FD1]" />
          <span className="text-sm font-medium text-[#111827]">Priority</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-[#F3F4F6] rounded-md transition-colors"
        >
          <X className="w-4 h-4 text-[#6B7280]" />
        </button>
      </div>

      {/* Options */}
      <div className="py-1">
        {/* No Priority Option */}
        <button
          onClick={() => {
            onSelect(null);
            setIsOpen(false);
          }}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-[#F9FAFB] transition-colors',
            !selected && 'bg-[#F3F4F6]'
          )}
        >
          <div className="flex items-center gap-2.5">
            <Flag className="w-4 h-4 text-[#9CA3AF]" strokeWidth={1.5} />
            <span className="text-sm text-[#6B7280]">No Priority</span>
          </div>
          {!selected && <Check className="w-4 h-4 text-[#5B4FD1]" />}
        </button>

        {priorityOptions.map((priority) => (
          <button
            key={priority.id}
            onClick={() => {
              onSelect(priority);
              setIsOpen(false);
            }}
            className={cn(
              'w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-[#F9FAFB] transition-colors',
              selected?.id === priority.id && 'bg-[#F3F4F6]'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Flag className={cn('w-4 h-4', priority.textColor)} strokeWidth={1.5} />
              <span className="text-sm text-[#374151]">{priority.label}</span>
            </div>
            {selected?.id === priority.id && <Check className="w-4 h-4 text-[#5B4FD1]" />}
          </button>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {children}
      </div>
      {mounted && popoverContent && createPortal(popoverContent, document.body)}
    </>
  );
};

export default PriorityPopover;