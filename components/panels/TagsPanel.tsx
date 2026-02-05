'use client';

import React from 'react';
import { Hash, X } from 'lucide-react';
import { Task, Tag } from '@/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface TagsPanelProps {
  taskId: string;
  task: Task;
}

export const TagsPanel: React.FC<TagsPanelProps> = ({ taskId, task }) => {
  const tags = task?.tags || [];

  const handleRemoveTag = async (tagName: string) => {
    try {
      await api.removeTaskTag(taskId, tagName);
      // The parent component should refresh the task data
    } catch (err) {
      console.error('Failed to remove tag:', err);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#ECEDF0]">
        <h3 className="text-lg font-semibold text-[#1A1A2E]">Tags</h3>
        <p className="text-sm text-[#9CA3AF] mt-1">
          {tags.length} tag{tags.length !== 1 ? 's' : ''} on this task
        </p>
      </div>

      {/* Tags List */}
      <div className="flex-1 p-4">
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: Tag) => (
              <div
                key={tag.name}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: tag.tag_bg || '#5B4FD1',
                  color: tag.tag_fg || '#FFFFFF',
                }}
              >
                <Hash className="h-3.5 w-3.5" />
                <span>{tag.name}</span>
                <button
                  onClick={() => handleRemoveTag(tag.name)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:bg-white/20 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-[#9CA3AF]">
            <Hash className="h-8 w-8 mb-2" />
            <p>No tags on this task</p>
            <p className="text-xs mt-1">Use the + Add button to add tags</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagsPanel;
