'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Repeat, X } from 'lucide-react';
import type { RecurrenceConfig } from '@/types';

interface RecurrencePopoverProps {
  children: React.ReactNode;
  value: RecurrenceConfig | null;
  onChange: (config: RecurrenceConfig | null) => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const FREQUENCY_OPTIONS: { value: RecurrenceConfig['frequency']; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const RecurrencePopover: React.FC<RecurrencePopoverProps> = ({
  children,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Local form state
  const [frequency, setFrequency] = useState<RecurrenceConfig['frequency']>(value?.frequency || 'weekly');
  const [interval, setInterval] = useState(value?.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(value?.daysOfWeek || [1]); // Monday default
  const [dayOfMonth, setDayOfMonth] = useState(value?.dayOfMonth || 1);
  const [endType, setEndType] = useState<RecurrenceConfig['endType']>(value?.endType || 'never');
  const [endCount, setEndCount] = useState(value?.endCount || 10);
  const [endDate, setEndDate] = useState(value?.endDate || '');

  // Sync form when value changes
  useEffect(() => {
    if (value) {
      setFrequency(value.frequency);
      setInterval(value.interval);
      if (value.daysOfWeek) setDaysOfWeek(value.daysOfWeek);
      if (value.dayOfMonth) setDayOfMonth(value.dayOfMonth);
      setEndType(value.endType);
      if (value.endCount) setEndCount(value.endCount);
      if (value.endDate) setEndDate(value.endDate);
    }
  }, [value]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverHeight = 400;
    const spaceBelow = window.innerHeight - rect.bottom;

    setPosition({
      top: spaceBelow < popoverHeight ? rect.top - popoverHeight - 4 : rect.bottom + 4,
      left: Math.min(rect.left, window.innerWidth - 320),
    });
  }, []);

  useEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleApply = () => {
    const config: RecurrenceConfig = {
      frequency,
      interval,
      endType,
    };
    if (frequency === 'weekly') config.daysOfWeek = daysOfWeek;
    if (frequency === 'monthly') config.dayOfMonth = dayOfMonth;
    if (endType === 'after') config.endCount = endCount;
    if (endType === 'on_date') config.endDate = endDate;

    onChange(config);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
  };

  const frequencyUnit = frequency === 'daily' ? 'day' : frequency === 'weekly' ? 'week' : frequency === 'monthly' ? 'month' : 'year';

  return (
    <>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)} className="inline-flex">
        {children}
      </div>

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[9999] w-[300px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl"
          style={{ top: position.top, left: position.left }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Recurrence</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Frequency */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFrequency(opt.value)}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    frequency === opt.value
                      ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Interval */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Every</span>
              <input
                type="number"
                min={1}
                max={99}
                value={interval}
                onChange={(e) => setInterval(Math.max(1, Number(e.target.value)))}
                className="w-16 px-2 py-1.5 text-sm text-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {interval > 1 ? `${frequencyUnit}s` : frequencyUnit}
              </span>
            </div>

            {/* Weekly: Day Selector */}
            {frequency === 'weekly' && (
              <div>
                <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  On days
                </span>
                <div className="flex gap-1">
                  {DAY_LABELS.map((label, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleDayOfWeek(idx)}
                      className={`w-9 h-9 rounded-lg text-xs font-medium transition-colors ${
                        daysOfWeek.includes(idx)
                          ? 'bg-purple-600 text-white dark:bg-purple-500'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly: Day of Month */}
            {frequency === 'monthly' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">On day</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value))))}
                  className="w-16 px-2 py-1.5 text-sm text-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            )}

            {/* End Condition */}
            <div>
              <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Ends
              </span>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={endType === 'never'}
                    onChange={() => setEndType('never')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Never</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={endType === 'after'}
                    onChange={() => setEndType('after')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">After</span>
                  {endType === 'after' && (
                    <>
                      <input
                        type="number"
                        min={1}
                        value={endCount}
                        onChange={(e) => setEndCount(Math.max(1, Number(e.target.value)))}
                        className="w-14 px-2 py-1 text-sm text-center border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-500">times</span>
                    </>
                  )}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={endType === 'on_date'}
                    onChange={() => setEndType('on_date')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">On</span>
                  {endType === 'on_date' && (
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleClear}
              className="text-xs text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleApply}
              className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 rounded-lg transition-colors"
            >
              Apply
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
