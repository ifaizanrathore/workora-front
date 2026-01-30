'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckSquare, X } from 'lucide-react';

export interface ChecklistPopoverProps {
  children: React.ReactNode;
  onAdd: (name: string) => void;
}

export const ChecklistPopover: React.FC<ChecklistPopoverProps> = ({
  children,
  onAdd,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [checklistName, setChecklistName] = useState('');
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
      const popoverHeight = 180;
      const popoverWidth = 280;
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
        setChecklistName('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setChecklistName('');
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleAdd = () => {
    if (!checklistName.trim()) return;
    onAdd(checklistName.trim());
    setChecklistName('');
    setIsOpen(false);
  };

  const popoverContent = isOpen ? (
    <div
      ref={popoverRef}
      className="fixed z-[9999] w-[280px] bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6] bg-[#FAFAFA]">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-[#5B4FD1]" />
          <span className="text-sm font-medium text-[#111827]">Add Checklist</span>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            setChecklistName('');
          }}
          className="p-1 hover:bg-[#F3F4F6] rounded-md transition-colors"
        >
          <X className="w-4 h-4 text-[#6B7280]" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-1.5">
            Checklist name
          </label>
          <input
            type="text"
            value={checklistName}
            onChange={(e) => setChecklistName(e.target.value)}
            placeholder="e.g., To-Do Items"
            className="w-full px-3 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] placeholder-[#9CA3AF] bg-white focus:outline-none focus:border-[#5B4FD1] focus:ring-2 focus:ring-[#5B4FD1]/10 transition-all"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
        </div>

        <button
          onClick={handleAdd}
          disabled={!checklistName.trim()}
          className="w-full px-4 py-2.5 bg-[#5B4FD1] text-white rounded-lg text-sm font-medium hover:bg-[#4A3FB8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add Checklist
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

export default ChecklistPopover;