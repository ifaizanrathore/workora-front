'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Globe } from 'lucide-react';
import { api } from '@/lib/api';
import { formatTimeAgo } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonActivityPanel } from '@/components/ui/skeleton';

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

  // Format a value based on its field type
  const formatValue = (value: any, field: string): string => {
    if (value === null || value === undefined) return '';

    // Handle different field types
    switch (field) {
      case 'status':
        if (typeof value === 'object') {
          return value.status || value.name || 'Unknown';
        }
        return String(value);

      case 'priority':
        if (typeof value === 'object') {
          return value.priority || value.label || value.name || 'None';
        }
        // Map priority IDs to names
        const priorityMap: Record<string, string> = { '1': 'Urgent', '2': 'High', '3': 'Normal', '4': 'Low' };
        return priorityMap[String(value)] || String(value);

      case 'assignees':
        if (Array.isArray(value)) {
          return value.map((a: any) => a.username || a.email || 'User').join(', ') || 'No assignees';
        }
        if (typeof value === 'object') {
          return value.username || value.email || 'User';
        }
        return String(value);

      case 'due_date':
      case 'start_date':
      case 'date':
        // Handle timestamp (number or numeric string)
        const timestamp = typeof value === 'string' ? parseInt(value, 10) : value;
        if (!isNaN(timestamp) && timestamp > 1000000000) {
          const date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        // Try parsing as date string
        const dateObj = new Date(value);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        return String(value);

      case 'tags':
        if (Array.isArray(value)) {
          return value.map((t: any) => t.name || t.tag || t).join(', ');
        }
        if (typeof value === 'object') {
          return value.name || value.tag || 'Tag';
        }
        return String(value);

      default:
        if (typeof value === 'object') {
          // Try common property names
          return value.name || value.status || value.label || value.title || JSON.stringify(value);
        }
        return String(value);
    }
  };

  const formatActivityMessage = (activity: ActivityItem): string => {
    const field = activity.field || 'task';
    const userName = activity.user?.username || 'Someone';

    const beforeFormatted = formatValue(activity.before, field);
    const afterFormatted = formatValue(activity.after, field);

    if (activity.before === null && activity.after !== null) {
      return `${userName} set ${field} to "${afterFormatted}"`;
    }
    if (activity.before !== null && activity.after === null) {
      return `${userName} removed ${field}`;
    }
    if (activity.before !== null && activity.after !== null) {
      return `${userName} changed ${field} from "${beforeFormatted}" to "${afterFormatted}"`;
    }
    return `${userName} updated ${field}`;
  };

  if (isLoading) {
    return <SkeletonActivityPanel />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Activity Header */}
      <div className="px-4 py-4">
        <h3 className="text-xl font-bold text-[#1A1A2E] dark:text-white">Activity</h3>
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
                <p className="text-sm text-[#6B7280] dark:text-gray-400">
                  {formatActivityMessage(activity)}
                </p>
              </div>
              <span className="text-xs text-[#9CA3AF] dark:text-gray-500 whitespace-nowrap">
                {activity.date ? formatTimeAgo(activity.date) : ''}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-[#9CA3AF] dark:text-gray-500">
            <p>No activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPanel;
