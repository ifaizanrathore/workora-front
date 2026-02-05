'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrackTimeDropdownProps {
  taskId: string;
  timeTracked: number;
  timerRunning: boolean;
  onStartTimer: () => void;
  onStopTimer: () => void;
  onAddTime: (minutes: number) => void;
  loading?: boolean;
}

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export const TrackTimeDropdown: React.FC<TrackTimeDropdownProps> = ({
  taskId,
  timeTracked,
  timerRunning,
  onStartTimer,
  onStopTimer,
  onAddTime,
  loading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!timerRunning) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsed((e) => e + 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const totalTime = timeTracked + elapsed;

  const handleAddManualTime = () => {
    const mins = parseInt(manualMinutes);
    if (mins > 0) {
      onAddTime(mins);
      setManualMinutes('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-colors',
          timerRunning
            ? 'bg-green-50 text-green-600'
            : 'text-[#8C8C9A] hover:bg-[#F5F5F7] hover:text-[#7C3AED]'
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : timerRunning ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono">{formatTime(elapsed)}</span>
          </>
        ) : totalTime > 0 ? (
          <>
            <Clock className="h-4 w-4" />
            <span>{formatTime(totalTime)}</span>
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            <span>Add time</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-2 min-w-[200px] z-[60]">
          {/* Timer Section */}
          <div className="px-3 pb-2 border-b border-[#E5E7EB]">
            <div className="text-[10px] font-medium text-[#9CA3AF] uppercase mb-2">Timer</div>
            {timerRunning ? (
              <button
                onClick={() => {
                  onStopTimer();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-[12px] font-medium hover:bg-red-100 transition-colors"
              >
                <div className="w-3 h-3 bg-red-500 rounded-sm" />
                Stop Timer ({formatTime(elapsed)})
              </button>
            ) : (
              <button
                onClick={() => {
                  onStartTimer();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-[12px] font-medium hover:bg-green-100 transition-colors"
              >
                <Play className="h-3.5 w-3.5" fill="currentColor" />
                Start Timer
              </button>
            )}
          </div>

          {/* Manual Time */}
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium text-[#9CA3AF] uppercase mb-2">Add Manual Time</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddManualTime()}
                placeholder="Minutes"
                className="flex-1 px-2 py-1.5 border border-[#E5E7EB] rounded text-[12px] outline-none focus:border-[#7C3AED]"
                min="1"
              />
              <button
                onClick={handleAddManualTime}
                disabled={!manualMinutes}
                className="px-3 py-1.5 bg-[#7C3AED] text-white rounded text-[11px] font-medium hover:bg-[#6D28D9] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="px-3 pt-1">
            <div className="flex gap-1">
              {[15, 30, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    onAddTime(mins);
                    setIsOpen(false);
                  }}
                  className="flex-1 px-2 py-1 bg-[#F5F5F7] text-[#6B7280] rounded text-[10px] font-medium hover:bg-[#E5E7EB] transition-colors"
                >
                  +{mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          {totalTime > 0 && (
            <div className="px-3 pt-2 mt-2 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#9CA3AF]">Total tracked</span>
                <span className="font-medium text-[#374151]">{formatTime(totalTime)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackTimeDropdown;