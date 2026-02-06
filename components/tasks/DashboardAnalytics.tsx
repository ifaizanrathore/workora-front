'use client';

import React, { useMemo } from 'react';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Flag,
  Users,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types';

interface DashboardAnalyticsProps {
  tasks: Task[];
}

// Stat Card
const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: { value: number; label: string };
}> = ({ title, value, subtitle, icon, iconBg, trend }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#ECEDF0] dark:border-gray-800 p-5">
    <div className="flex items-start justify-between mb-3">
      <p className="text-sm text-[#8C8C9A] dark:text-gray-400 font-medium">{title}</p>
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', iconBg)}>
        {icon}
      </div>
    </div>
    <p className="text-2xl font-bold text-[#1A1A2E] dark:text-white">{value}</p>
    {subtitle && (
      <p className="text-xs text-[#9CA3AF] dark:text-gray-500 mt-1">{subtitle}</p>
    )}
    {trend && (
      <div className="flex items-center gap-1.5 mt-2">
        <span className={cn(
          'inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full',
          trend.value >= 0
            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
        )}>
          <TrendingUp className={cn('h-3 w-3', trend.value < 0 && 'rotate-180')} />
          {Math.abs(trend.value)}%
        </span>
        <span className="text-[11px] text-[#9CA3AF] dark:text-gray-500">{trend.label}</span>
      </div>
    )}
  </div>
);

// Progress Bar
const ProgressBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({
  label, value, total, color
}) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-[#5C5C6D] dark:text-gray-400 w-20 truncate">{label}</span>
      <div className="flex-1 h-2 bg-[#F5F7FA] dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold text-[#1A1A2E] dark:text-white w-8 text-right">{value}</span>
    </div>
  );
};

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ tasks }) => {
  const stats = useMemo(() => {
    const now = Date.now();
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status?.type === 'closed').length;
    const open = total - completed;
    const overdue = tasks.filter((t) => {
      if (!t.due_date || t.status?.type === 'closed') return false;
      return Number(t.due_date) < now;
    }).length;
    const dueThisWeek = tasks.filter((t) => {
      if (!t.due_date || t.status?.type === 'closed') return false;
      const due = Number(t.due_date);
      return due >= now && due <= now + 7 * 24 * 60 * 60 * 1000;
    }).length;

    // Priority breakdown
    const urgent = tasks.filter((t) => t.priority?.id === '1' && t.status?.type !== 'closed').length;
    const high = tasks.filter((t) => t.priority?.id === '2' && t.status?.type !== 'closed').length;
    const normal = tasks.filter((t) => t.priority?.id === '3' && t.status?.type !== 'closed').length;
    const low = tasks.filter((t) => t.priority?.id === '4' && t.status?.type !== 'closed').length;

    // Status breakdown
    const statusMap = new Map<string, { count: number; color: string }>();
    tasks.forEach((t) => {
      const name = t.status?.status || 'Unknown';
      const color = t.status?.color || '#9CA3AF';
      if (!statusMap.has(name)) statusMap.set(name, { count: 0, color });
      statusMap.get(name)!.count++;
    });

    // Assignee breakdown
    const assigneeMap = new Map<string, { count: number; name: string; picture?: string }>();
    tasks.forEach((t) => {
      t.assignees?.forEach((a) => {
        const key = String(a.id);
        if (!assigneeMap.has(key)) {
          assigneeMap.set(key, { count: 0, name: a.username || a.email || 'Unknown', picture: a.profilePicture });
        }
        assigneeMap.get(key)!.count++;
      });
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total, completed, open, overdue, dueThisWeek,
      urgent, high, normal, low,
      statusBreakdown: Array.from(statusMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count),
      assigneeBreakdown: Array.from(assigneeMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
      completionRate,
    };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={stats.total}
          subtitle={`${stats.open} open`}
          icon={<BarChart3 className="h-5 w-5 text-[#6E62E5]" />}
          iconBg="bg-[#F3F0FF] dark:bg-purple-900/20"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          subtitle={`${stats.completionRate}% completion rate`}
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          iconBg="bg-green-50 dark:bg-green-900/20"
        />
        <StatCard
          title="Overdue"
          value={stats.overdue}
          subtitle="Need attention"
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50 dark:bg-red-900/20"
        />
        <StatCard
          title="Due This Week"
          value={stats.dueThisWeek}
          subtitle="Upcoming deadlines"
          icon={<Calendar className="h-5 w-5 text-amber-500" />}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Completion Ring */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#ECEDF0] dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white mb-4">Completion Rate</h3>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="56" fill="none" strokeWidth="12" className="stroke-[#F5F7FA] dark:stroke-gray-800" />
                <circle
                  cx="64" cy="64" r="56" fill="none" strokeWidth="12"
                  strokeLinecap="round"
                  stroke="#6E62E5"
                  strokeDasharray={`${stats.completionRate * 3.52} 352`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[#1A1A2E] dark:text-white">{stats.completionRate}%</span>
                <span className="text-[10px] text-[#9CA3AF] dark:text-gray-500">Complete</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#6E62E5]" />
              <span className="text-xs text-[#8C8C9A] dark:text-gray-400">Done ({stats.completed})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#F5F7FA] dark:bg-gray-800" />
              <span className="text-xs text-[#8C8C9A] dark:text-gray-400">Open ({stats.open})</span>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#ECEDF0] dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white mb-4">By Status</h3>
          <div className="space-y-3">
            {stats.statusBreakdown.map((s) => (
              <ProgressBar key={s.name} label={s.name} value={s.count} total={stats.total} color={s.color} />
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#ECEDF0] dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white mb-4">By Priority</h3>
          <div className="space-y-3">
            <ProgressBar label="Urgent" value={stats.urgent} total={stats.open || 1} color="#EF4444" />
            <ProgressBar label="High" value={stats.high} total={stats.open || 1} color="#F59E0B" />
            <ProgressBar label="Normal" value={stats.normal} total={stats.open || 1} color="#3B82F6" />
            <ProgressBar label="Low" value={stats.low} total={stats.open || 1} color="#9CA3AF" />
          </div>

          {/* Team Members */}
          {stats.assigneeBreakdown.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white mt-6 mb-3">Top Assignees</h3>
              <div className="space-y-2">
                {stats.assigneeBreakdown.slice(0, 4).map((a) => (
                  <div key={a.name} className="flex items-center gap-2">
                    {a.picture ? (
                      <img src={a.picture} alt={a.name} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#6E62E5] flex items-center justify-center text-[9px] text-white font-bold">
                        {a.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs text-[#5C5C6D] dark:text-gray-400 flex-1 truncate">{a.name}</span>
                    <span className="text-xs font-semibold text-[#1A1A2E] dark:text-white">{a.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;
