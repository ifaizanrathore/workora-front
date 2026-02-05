'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Globe, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatTimeAgo } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ActivityPanelProps {
  taskId: string;
}

interface ActivityItem {
  id: string;
  field?: string;
  before?: any;
  after?: any;
  date?: string;
  user?: {
    id?: number;
    username?: string;
    email?: string;
    profilePicture?: string;
  };
}

export const ActivityPanel: React.FC<ActivityPanelProps> = ({ taskId }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!taskId) return;

      setIsLoading(true);
      try {
        const data = await api.getTaskActivity(taskId);
        setActivities(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch activity:', err);
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, [taskId]);

  const formatActivityMessage = (activity: ActivityItem): string => {
    const field = activity.field || 'task';
    const userName = activity.user?.username || 'Someone';

    if (activity.before === null && activity.after !== null) {
      return `${userName} set ${field} to "${activity.after}"`;
    }
    if (activity.before !== null && activity.after === null) {
      return `${userName} removed ${field}`;
    }
    if (activity.before !== null && activity.after !== null) {
      return `${userName} changed ${field} from "${activity.before}" to "${activity.after}"`;
    }
    return `${userName} updated ${field}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Activity Header */}
      <div className="px-4 py-4">
        <h3 className="text-xl font-bold text-[#1A1A2E]">Activity</h3>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <Avatar
                name={activity.user?.username || 'User'}
                src={activity.user?.profilePicture}
                size="sm"
              />
              <div className="flex-1">
                <p className="text-sm text-[#6B7280]">
                  {formatActivityMessage(activity)}
                </p>
              </div>
              <span className="text-xs text-[#9CA3AF] whitespace-nowrap">
                {activity.date ? formatTimeAgo(activity.date) : ''}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-[#9CA3AF]">
            <p>No activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPanel;
