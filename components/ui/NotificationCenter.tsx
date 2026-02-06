'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Bell, Clock, AlertTriangle, CheckCircle, MessageSquare, Flag, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/stores';
import { Task } from '@/types';

interface Notification {
  id: string;
  type: 'overdue' | 'due_soon' | 'completed' | 'high_priority';
  title: string;
  description: string;
  time: string;
  read: boolean;
  task?: Task;
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('workora-dismissed-notifications');
        if (saved) return new Set(JSON.parse(saved));
      } catch { /* ignore */ }
    }
    return new Set();
  });
  const ref = useRef<HTMLDivElement>(null);
  const { tasks, openTaskModal } = useTaskStore();

  // Generate notifications from task data
  const notifications = useMemo<Notification[]>(() => {
    const now = Date.now();
    const items: Notification[] = [];

    tasks.forEach((task) => {
      if (!task.due_date) return;
      const dueMs = Number(task.due_date);
      if (isNaN(dueMs)) return;
      const diff = dueMs - now;
      const hoursLeft = diff / (1000 * 60 * 60);

      // Overdue tasks
      if (diff < 0 && task.status?.type !== 'closed') {
        items.push({
          id: `overdue-${task.id}`,
          type: 'overdue',
          title: 'Task overdue',
          description: task.name,
          time: `${Math.abs(Math.round(hoursLeft))}h overdue`,
          read: false,
          task,
        });
      }
      // Due within 24 hours
      else if (hoursLeft > 0 && hoursLeft <= 24 && task.status?.type !== 'closed') {
        items.push({
          id: `due_soon-${task.id}`,
          type: 'due_soon',
          title: 'Due soon',
          description: task.name,
          time: `${Math.round(hoursLeft)}h remaining`,
          read: false,
          task,
        });
      }
    });

    // High priority tasks without due date
    tasks.forEach((task) => {
      if (task.priority?.id === '1' && task.status?.type !== 'closed') {
        items.push({
          id: `urgent-${task.id}`,
          type: 'high_priority',
          title: 'Urgent priority',
          description: task.name,
          time: 'Needs attention',
          read: false,
          task,
        });
      }
    });

    // Recently completed
    tasks.forEach((task) => {
      if (task.status?.type === 'closed' && task.date_done) {
        const doneMs = Number(task.date_done);
        const hoursSinceDone = (now - doneMs) / (1000 * 60 * 60);
        if (hoursSinceDone <= 24) {
          items.push({
            id: `done-${task.id}`,
            type: 'completed',
            title: 'Task completed',
            description: task.name,
            time: `${Math.round(hoursSinceDone)}h ago`,
            read: true,
            task,
          });
        }
      }
    });

    return items
      .filter((n) => !dismissedIds.has(n.id))
      .sort((a, b) => {
        const order = { overdue: 0, due_soon: 1, high_priority: 2, completed: 3 };
        return order[a.type] - order[b.type];
      })
      .slice(0, 20);
  }, [tasks, dismissedIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen]);

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(Array.from(prev));
      next.add(id);
      localStorage.setItem('workora-dismissed-notifications', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    const merged = Array.from(dismissedIds).concat(allIds);
    const next = new Set(merged);
    localStorage.setItem('workora-dismissed-notifications', JSON.stringify(Array.from(next)));
    setDismissedIds(next);
  }, [notifications, dismissedIds]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'due_soon': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'high_priority': return <Flag className="h-4 w-4 text-red-500" fill="#EF4444" strokeWidth={0} />;
    }
  };

  const getBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'overdue': return 'bg-red-50 dark:bg-red-900/20';
      case 'due_soon': return 'bg-amber-50 dark:bg-amber-900/20';
      case 'completed': return 'bg-green-50 dark:bg-green-900/20';
      case 'high_priority': return 'bg-red-50 dark:bg-red-900/20';
    }
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-[#9CA3AF] hover:bg-[#F5F7FA] dark:hover:bg-gray-800 hover:text-[#5C5C6D] dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-[#6E62E5]/30"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-[#ECEDF0] dark:border-gray-700 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#ECEDF0] dark:border-gray-800">
            <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-medium text-[#6E62E5]">({unreadCount} new)</span>
              )}
            </h3>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-[#9CA3AF] hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="py-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 hover:bg-[#F5F7FA] dark:hover:bg-gray-800 transition-colors group cursor-pointer',
                      !notification.read && 'bg-[#F8F7FF] dark:bg-purple-900/10'
                    )}
                    onClick={() => {
                      if (notification.task) {
                        openTaskModal(notification.task);
                        setIsOpen(false);
                      }
                    }}
                  >
                    {/* Icon */}
                    <div className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5',
                      getBgColor(notification.type)
                    )}>
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1A1A2E] dark:text-white">
                        {notification.title}
                      </p>
                      <p className="text-xs text-[#5C5C6D] dark:text-gray-400 truncate mt-0.5">
                        {notification.description}
                      </p>
                      <p className="text-[10px] text-[#9CA3AF] dark:text-gray-500 mt-1">
                        {notification.time}
                      </p>
                    </div>

                    {/* Dismiss */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(notification.id);
                      }}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    >
                      <X className="h-3.5 w-3.5 text-[#9CA3AF]" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="w-12 h-12 rounded-full bg-[#F5F7FA] dark:bg-gray-800 flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-[#D1D5DB] dark:text-gray-600" />
                </div>
                <p className="text-sm font-medium text-[#6B7280] dark:text-gray-400">All caught up!</p>
                <p className="text-xs text-[#9CA3AF] dark:text-gray-500 mt-0.5">No new notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
