'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Circle, X, Check } from 'lucide-react';

interface TaskStatus {
  id: string;
  status: string;
  color: string;
  type?: string;
}

const defaultStatuses: TaskStatus[] = [
  { id: '1', status: 'To Do', color: '#6B7280' },
  { id: '2', status: 'In Progress', color: '#3B82F6' },
  { id: '3', status: 'Review', color: '#F59E0B' },
  { id: '4', status: 'Done', color: '#10B981', type: 'closed' },
];

export interface StatusPopoverProps {
  children: React.ReactNode;
  selected: TaskStatus | null;
  onSelect: (status: TaskStatus | null) => void;
  statuses?: TaskStatus[];
}

export const StatusPopover: React.FC<StatusPopoverProps> = ({
  children,
  selected,
  onSelect,
  statuses,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  
  const availableStatuses = statuses && statuses.length > 0 ? statuses : defaultStatuses;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverHeight = 250;
      const popoverWidth = 220;
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
      className="fixed z-[9999] w-[220px] bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6] bg-[#FAFAFA]">
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4 text-[#5B4FD1]" />
          <span className="text-sm font-medium text-[#111827]">Status</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-[#F3F4F6] rounded-md transition-colors"
        >
          <X className="w-4 h-4 text-[#6B7280]" />
        </button>
      </div>

      {/* Options */}
      <div className="py-1 max-h-[200px] overflow-y-auto">
        {availableStatuses.map((status) => (
          <button
            key={status.id}
            onClick={() => {
              onSelect(status);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-[#F9FAFB] transition-colors ${
              selected?.id === status.id ? 'bg-[#F3F4F6]' : ''
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-3.5 h-3.5 rounded-full"
                style={{ 
                  backgroundColor: status.color,
                  boxShadow: `0 0 0 2px white, 0 0 0 3px ${status.color}40`
                }}
              />
              <span className="text-sm text-[#374151]">{status.status}</span>
            </div>
            {selected?.id === status.id && <Check className="w-4 h-4 text-[#5B4FD1]" />}
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

export default StatusPopover;