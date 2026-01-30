'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Users, X } from 'lucide-react';

interface Assignee {
  id: number;
  username: string;
  email: string;
  profilePicture?: string;
}

const defaultMembers: Assignee[] = [
  { id: 1, username: 'John Doe', email: 'john@example.com' },
  { id: 2, username: 'Jane Smith', email: 'jane@example.com' },
  { id: 3, username: 'Bob Wilson', email: 'bob@example.com' },
  { id: 4, username: 'Alice Brown', email: 'alice@example.com' },
];

export interface AssigneePopoverProps {
  children: React.ReactNode;
  selected: Assignee[];
  onSelect: (assignee: Assignee) => void;
  members?: Assignee[];
}

export const AssigneePopover: React.FC<AssigneePopoverProps> = ({
  children,
  selected,
  onSelect,
  members,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  const availableMembers = members && members.length > 0 ? members : defaultMembers;

  const filteredMembers = availableMembers.filter(
    (member) =>
      !selected.some((s) => s.id === member.id) &&
      (member.username.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase()))
  );

  const getInitial = (user: Assignee): string => {
    return (user.username || user.email || 'U').charAt(0).toUpperCase();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverHeight = 320;
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
        setSearch('');
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
        setSearch('');
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const popoverContent = isOpen ? (
    <div
      ref={popoverRef}
      className="fixed z-[9999] w-[280px] bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6] bg-[#FAFAFA]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#5B4FD1]" />
          <span className="text-sm font-medium text-[#111827]">Assign To</span>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            setSearch('');
          }}
          className="p-1 hover:bg-[#F3F4F6] rounded-md transition-colors"
        >
          <X className="w-4 h-4 text-[#6B7280]" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-[#F3F4F6]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-[#5B4FD1] focus:ring-2 focus:ring-[#5B4FD1]/10"
            autoFocus
          />
        </div>
      </div>

      {/* Members List */}
      <div className="max-h-[200px] overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[#9CA3AF] text-center">No members found</p>
        ) : (
          filteredMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => {
                onSelect(member);
                setIsOpen(false);
                setSearch('');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F9FAFB] transition-colors"
            >
              {member.profilePicture ? (
                <img 
                  src={member.profilePicture} 
                  alt={member.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5B4FD1] to-[#7C3AED] flex items-center justify-center text-white text-sm font-medium">
                  {getInitial(member)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111827] truncate">{member.username}</p>
                <p className="text-xs text-[#6B7280] truncate">{member.email}</p>
              </div>
            </button>
          ))
        )}
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

export default AssigneePopover;