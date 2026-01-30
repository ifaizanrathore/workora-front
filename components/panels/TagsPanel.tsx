'use client';

import React from 'react';
import { Hash, Sparkles, Users, Reply } from 'lucide-react';
import { Task, Tag } from '@/types';
import { useTags, useAddTag, useRemoveTag } from '@/hooks';
import { formatTimeAgo, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { TagBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TagsPanelProps {
  taskId: string;
  task: Task;
}

// Mock tag activity
const mockTagActivity = [
  {
    id: '1',
    user: { username: 'Haider ali', profilePicture: null },
    message: 'A Space represents teams, departments, or groups, each with its own Lists, workflows, and settings.',
    tags: ['Details'],
    timestamp: '1 min ago',
    hasAI: true,
  },
];

export const TagsPanel: React.FC<TagsPanelProps> = ({ taskId, task }) => {
  const addTag = useAddTag();
  const removeTag = useRemoveTag();

  const handleAddTag = (tagName: string) => {
    addTag.mutate({ taskId, tagName });
  };

  const handleRemoveTag = (tagName: string) => {
    removeTag.mutate({ taskId, tagName });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Tag Activity */}
      <div className="flex-1 p-4 space-y-4">
        {mockTagActivity.map((activity) => (
          <div key={activity.id} className="bg-white rounded-lg border border-border p-4">
            {/* User Info */}
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={activity.user.username} size="md" />
              <div className="flex-1">
                <span className="font-medium text-text-primary">
                  {activity.user.username}
                </span>
                <span className="text-xs text-text-tertiary ml-2">
                  {activity.timestamp}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {activity.tags.map((tag) => (
                <TagBadge key={tag} name={tag} />
              ))}
            </div>

            {/* Message */}
            <p className="text-sm text-text-primary mb-3">{activity.message}</p>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="p-1.5 hover:bg-background-hover rounded">
                😀
              </button>
              <button className="p-1.5 hover:bg-background-hover rounded">
                <Users className="h-4 w-4 text-text-tertiary" />
              </button>
              {activity.hasAI && (
                <button className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                  <Sparkles className="h-3 w-3" />
                  AI
                </button>
              )}
              <button className="ml-auto text-sm text-text-secondary hover:text-primary">
                Reply
              </button>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {mockTagActivity.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-text-tertiary">
            <Hash className="h-8 w-8 mb-2" />
            <p>No tag activity</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagsPanel;
