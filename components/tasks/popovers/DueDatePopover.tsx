'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, X } from 'lucide-react';

export interface DueDatePopoverProps {
  children: React.ReactNode;
  dueDate: string;
  startDate: string;
  timeEstimate: string;
  onDueDateChange: (date: string) => void;
  onStartDateChange: (date: string) => void;
  onTimeEstimateChange: (estimate: string) => void;
}

export const DueDatePopover: React.FC<DueDatePopoverProps> = ({
  children,
  dueDate,
  startDate,
  timeEstimate,
  onDueDateChange,
  onStartDateChange,
  onTimeEstimateChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverHeight = 420;
      const popoverWidth = 300;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceRight = window.innerWidth - rect.left;
      
      let top = rect.bottom + 8;
      let left = rect.left;

      // Position above if not enough space below
      if (spaceBelow < popoverHeight && rect.top > popoverHeight) {
        top = rect.top - popoverHeight - 8;
      }

      // Adjust left if would overflow right edge
      if (spaceRight < popoverWidth) {
        left = Math.max(8, rect.right - popoverWidth);
      }

      setPosition({ top, left });
    }
  }, [isOpen]);

  // Close on click outside
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

  // Close on Escape
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
      className="fixed z-[9999] w-[300px] bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6] bg-[#FAFAFA]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#5B4FD1]" />
          <span className="text-sm font-medium text-[#111827]">Date & Time</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-[#F3F4F6] rounded-md transition-colors"
        >
          <X className="w-4 h-4 text-[#6B7280]" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Start Date */}
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-1.5">
            Start Date
          </label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] bg-white focus:outline-none focus:border-[#5B4FD1] focus:ring-2 focus:ring-[#5B4FD1]/10 transition-all"
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-1.5">
            Due Date
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] bg-white focus:outline-none focus:border-[#5B4FD1] focus:ring-2 focus:ring-[#5B4FD1]/10 transition-all"
          />
        </div>

        {/* Time Estimate */}
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-1.5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
              Time Estimate (hours)
            </div>
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={timeEstimate}
            onChange={(e) => onTimeEstimateChange(e.target.value)}
            placeholder="e.g., 2.5"
            className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] placeholder-[#9CA3AF] bg-white focus:outline-none focus:border-[#5B4FD1] focus:ring-2 focus:ring-[#5B4FD1]/10 transition-all"
          />
        </div>

        {/* Quick Select Buttons */}
        <div className="pt-3 border-t border-[#F3F4F6]">
          <p className="text-xs font-medium text-[#6B7280] mb-2">Quick select due date</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Today', days: 0 },
              { label: 'Tomorrow', days: 1 },
              { label: 'Next Week', days: 7 },
            ].map(({ label, days }) => (
              <button
                key={label}
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() + days);
                  date.setHours(17, 0, 0, 0);
                  onDueDateChange(date.toISOString().slice(0, 16));
                }}
                className="px-3 py-1.5 text-xs font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 px-4 py-3 border-t border-[#F3F4F6] bg-[#FAFAFA]">
        <button
          onClick={() => {
            onDueDateChange('');
            onStartDateChange('');
            onTimeEstimateChange('');
          }}
          className="flex-1 px-4 py-2 text-sm font-medium text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-white transition-colors"
        >
          Clear All
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="flex-1 px-4 py-2 bg-[#5B4FD1] text-white rounded-lg text-sm font-medium hover:bg-[#4A3FB8] transition-colors"
        >
          Done
        </button>
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

export default DueDatePopover;