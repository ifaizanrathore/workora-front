'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Tag, X, Check } from 'lucide-react';

interface TaskTag {
  name: string;
  tag_bg: string;
  tag_fg: string;
}

const defaultTags: TaskTag[] = [
  { name: 'Design', tag_bg: '#8B5CF6', tag_fg: '#fff' },
  { name: 'Frontend', tag_bg: '#3B82F6', tag_fg: '#fff' },
  { name: 'Backend', tag_bg: '#10B981', tag_fg: '#fff' },
  { name: 'Bug', tag_bg: '#EF4444', tag_fg: '#fff' },
  { name: 'Feature', tag_bg: '#F59E0B', tag_fg: '#fff' },
  { name: 'Documentation', tag_bg: '#6B7280', tag_fg: '#fff' },
  { name: 'Testing', tag_bg: '#EC4899', tag_fg: '#fff' },
  { name: 'Urgent', tag_bg: '#DC2626', tag_fg: '#fff' },
];

export interface TagsPopoverProps {
  children: React.ReactNode;
  selected: TaskTag[];
  onSelect: (tag: TaskTag) => void;
  tags?: TaskTag[];
}

export const TagsPopover: React.FC<TagsPopoverProps> = ({
  children,
  selected,
  onSelect,
  tags,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  const availableTags = tags && tags.length > 0 ? tags : defaultTags;

  const filteredTags = availableTags.filter(
    (tag) =>
      !selected.some((s) => s.name === tag.name) &&
      tag.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverHeight = 320;
      const popoverWidth = 260;
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
      className="fixed z-[9999] w-[260px] bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6] bg-[#FAFAFA]">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#5B4FD1]" />
          <span className="text-sm font-medium text-[#111827]">Tags</span>
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
            placeholder="Search tags..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:border-[#5B4FD1] focus:ring-2 focus:ring-[#5B4FD1]/10"
            autoFocus
          />
        </div>
      </div>

      {/* Selected Tags */}
      {selected.length > 0 && (
        <div className="px-3 py-2 border-b border-[#F3F4F6]">
          <p className="text-xs font-medium text-[#6B7280] mb-2">Selected</p>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((tag) => (
              <span
                key={tag.name}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                style={{ backgroundColor: tag.tag_bg, color: tag.tag_fg }}
              >
                {tag.name}
                <Check className="w-3 h-3" />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags List */}
      <div className="max-h-[180px] overflow-y-auto py-1">
        {filteredTags.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[#9CA3AF] text-center">No tags found</p>
        ) : (
          filteredTags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => {
                onSelect(tag);
                setIsOpen(false);
                setSearch('');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F9FAFB] transition-colors"
            >
              <div
                className="w-4 h-4 rounded-md"
                style={{ backgroundColor: tag.tag_bg }}
              />
              <span className="text-sm text-[#374151]">{tag.name}</span>
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

export default TagsPopover;