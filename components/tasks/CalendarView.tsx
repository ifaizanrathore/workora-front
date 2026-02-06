'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Flag, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types';
import { useTaskStore } from '@/stores';

const PRIORITY_COLORS: Record<string, string> = {
  '1': '#EF4444',
  '2': '#F59E0B',
  '3': '#3B82F6',
  '4': '#9CA3AF',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface CalendarViewProps {
  tasks: Task[];
}

interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const { openTaskModal } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Generate calendar grid
  const calendarDays = useMemo<DayCell[]>(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Map tasks to dates
    const tasksByDate = new Map<string, Task[]>();
    tasks.forEach((task) => {
      if (!task.due_date) return;
      const ms = Number(task.due_date);
      if (isNaN(ms)) return;
      const d = new Date(ms);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!tasksByDate.has(key)) tasksByDate.set(key, []);
      tasksByDate.get(key)!.push(task);
    });

    const cells: DayCell[] = [];

    // Previous month padding
    const prevMonth = new Date(year, month, 0);
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonth.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      cells.push({
        date: d,
        isCurrentMonth: false,
        isToday: false,
        tasks: tasksByDate.get(key) || [],
      });
    }

    // Current month
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const isToday = d.getTime() === today.getTime();
      cells.push({
        date: d,
        isCurrentMonth: true,
        isToday,
        tasks: tasksByDate.get(key) || [],
      });
    }

    // Next month padding
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      cells.push({
        date: d,
        isCurrentMonth: false,
        isToday: false,
        tasks: tasksByDate.get(key) || [],
      });
    }

    return cells;
  }, [tasks, year, month]);

  const goToPrevMonth = useCallback(() => {
    setCurrentDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const goToNextMonth = useCallback(() => {
    setCurrentDate(new Date(year, month + 1, 1));
  }, [year, month]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  return (
    <div className="flex flex-col h-full p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[#1A1A2E] dark:text-white">
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-medium text-[#6E62E5] bg-[#F3F0FF] dark:bg-purple-900/20 rounded-md hover:bg-[#E8E4FF] dark:hover:bg-purple-900/30 transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:bg-[#F5F7FA] dark:hover:bg-gray-800 hover:text-[#5C5C6D] dark:hover:text-gray-300 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:bg-[#F5F7FA] dark:hover:bg-gray-800 hover:text-[#5C5C6D] dark:hover:text-gray-300 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-[#9CA3AF] dark:text-gray-500 py-2 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 border-t border-l border-[#ECEDF0] dark:border-gray-800">
        {calendarDays.map((cell, index) => (
          <div
            key={index}
            className={cn(
              'min-h-[100px] border-r border-b border-[#ECEDF0] dark:border-gray-800 p-1.5 overflow-hidden',
              !cell.isCurrentMonth && 'bg-[#FAFBFC] dark:bg-gray-900/50',
              cell.isToday && 'bg-[#F8F7FF] dark:bg-purple-900/10'
            )}
          >
            {/* Day Number */}
            <div className="flex items-center justify-between mb-1">
              <span className={cn(
                'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                cell.isToday
                  ? 'bg-[#6E62E5] text-white'
                  : cell.isCurrentMonth
                    ? 'text-[#1A1A2E] dark:text-white'
                    : 'text-[#D1D5DB] dark:text-gray-600'
              )}>
                {cell.date.getDate()}
              </span>
              {cell.tasks.length > 3 && (
                <span className="text-[10px] text-[#9CA3AF] dark:text-gray-500">
                  +{cell.tasks.length - 3}
                </span>
              )}
            </div>

            {/* Task Pills */}
            <div className="space-y-0.5">
              {cell.tasks.slice(0, 3).map((task) => (
                <button
                  key={task.id}
                  onClick={() => openTaskModal(task)}
                  className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: (task.status?.color || '#6E62E5') + '20',
                    color: task.status?.color || '#6E62E5',
                  }}
                >
                  {task.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
