'use client';

import React from 'react';
import { Lock, Globe } from 'lucide-react';
import { useTaskActivity } from '@/hooks';
import { formatTimeAgo } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ActivityPanelProps {
  taskId: string;
}

// Mock activity data for display
const mockActivity = [
  {
    id: '1',
    type: 'task_created',
    user: { username: 'You', profilePicture: null },
    message: 'You created this task',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'status_changed',
    user: { username: 'You', profilePicture: null },
    message: 'You set status to',
    status: 'want',
    timestamp: new Date().toISOString(),
  },
];

export const ActivityPanel: React.FC<ActivityPanelProps> = ({ taskId }) => {
  const { data: activity, isLoading } = useTaskActivity(taskId);

  const displayActivity = activity || mockActivity;

  return (
    <div className="flex flex-col h-full">
      {/* Privacy Notice */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
        <div className="flex items-center gap-2 text-sm">
          <Lock className="h-4 w-4 text-amber-600" />
          <span className="text-amber-700">This task is private to you.</span>
        </div>
        <Button variant="link" size="sm" className="text-primary">
          Make public
        </Button>
      </div>

      {/* Activity Header */}
      <div className="px-4 py-4">
        <h3 className="text-xl font-bold text-text-primary">Activity</h3>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4">
        {displayActivity.map((item: any) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm text-text-secondary">
                {item.message}
                {item.status && (
                  <Badge variant="success" className="ml-2">
                    {item.status}
                  </Badge>
                )}
              </p>
            </div>
            <span className="text-xs text-text-tertiary whitespace-nowrap">
              {item.timestamp === new Date().toISOString().split('T')[0]
                ? 'Just now'
                : formatTimeAgo(item.timestamp)}
            </span>
          </div>
        ))}

        {displayActivity.length === 0 && (
          <div className="text-center py-8 text-text-tertiary">
            <p>No activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPanel;
