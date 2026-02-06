'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import { Clock, Calendar, AlertCircle, Lock, Info, Timer, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { TaskAccountability } from '@/types';
import toast from 'react-hot-toast';

interface SetETADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  listId: string;
  taskName: string;
  dueDate?: string | number | null;
  accountability?: TaskAccountability | null;
  onSuccess?: (accountability: TaskAccountability) => void;
}

export const SetETADialog: React.FC<SetETADialogProps> = ({
  open,
  onOpenChange,
  taskId,
  listId,
  taskName,
  dueDate,
  accountability,
  onSuccess,
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse due date
  const parsedDueDate = useMemo(() => {
    if (!dueDate) return null;
    const d = typeof dueDate === 'string' ? new Date(parseInt(dueDate, 10) || dueDate) : new Date(dueDate);
    return isNaN(d.getTime()) ? null : d;
  }, [dueDate]);

  const getMaxDate = (): string => {
    if (parsedDueDate && parsedDueDate > new Date()) {
      return parsedDueDate.toISOString().split('T')[0];
    }
    return '2099-12-31';
  };

  const getMinDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxTime = (): string => {
    if (!parsedDueDate || !selectedDate) return '23:59';
    const selectedDateObj = new Date(selectedDate);
    const dueDateOnly = new Date(parsedDueDate.toISOString().split('T')[0]);
    if (selectedDateObj.getTime() === dueDateOnly.getTime()) {
      return parsedDueDate.toTimeString().slice(0, 5);
    }
    return '23:59';
  };

  const exceedsDueDate = (): boolean => {
    if (!parsedDueDate || !selectedDate || !selectedTime) return false;
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
    return selectedDateTime > parsedDueDate;
  };

  const isInPast = (): boolean => {
    if (!selectedDate || !selectedTime) return false;
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
    return selectedDateTime <= new Date();
  };

  const formatDueDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatSelectedPreview = (): string | null => {
    if (!selectedDate || !selectedTime) return null;
    const d = new Date(`${selectedDate}T${selectedTime}`);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  useEffect(() => {
    if (open) {
      setSelectedDate('');
      setSelectedTime('');
      setReason('');
      setError(null);
    }
  }, [open]);

  const isLocked = accountability?.isLocked;
  const canSetEta = accountability?.canSetEta ?? true;
  const hasValidInput = selectedDate && selectedTime && !exceedsDueDate() && !isInPast();
  const hasError = exceedsDueDate() || isInPast() || !!error;

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time');
      return;
    }
    if (isInPast()) {
      setError('ETA must be in the future');
      return;
    }
    if (exceedsDueDate()) {
      setError('ETA cannot exceed the due date');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const etaDateTime = new Date(`${selectedDate}T${selectedTime}`);
      const result = await api.setEta(taskId, listId, {
        eta: etaDateTime.toISOString(),
        reason: reason.trim() || undefined,
        dueDate: parsedDueDate?.toISOString(),
      });

      toast.success('ETA set successfully');
      onSuccess?.(result);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to set ETA');
      toast.error(err.message || 'Failed to set ETA');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" showClose={false}>
        <DialogDescription className="sr-only">Set an estimated time of arrival for completing this task</DialogDescription>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B4FD1] flex items-center justify-center shadow-sm">
                <Timer className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-[17px] font-semibold text-[#1A1A2E] dark:text-white">Set ETA</h2>
                <p className="text-[12px] text-[#9CA3AF] dark:text-gray-500">When will you complete this task?</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-lg bg-[#F5F5F7] dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center text-[#9CA3AF] hover:text-red-500 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-3.5">
          {/* Task Name */}
          <div className="flex items-center gap-3 p-3.5 bg-[#F8F9FB] dark:bg-gray-800 rounded-xl border border-[#ECEDF0] dark:border-gray-700">
            <div className="w-2 h-2 rounded-full bg-[#7C3AED] flex-shrink-0" />
            <p className="text-[13px] font-medium text-[#1A1A2E] dark:text-white truncate">{taskName}</p>
          </div>

          {/* Due Date Info */}
          {parsedDueDate && (
            <div className="flex items-center gap-2.5 px-3.5 py-3 bg-[#F3F0FF] dark:bg-purple-900/20 rounded-xl border border-[#E9E3FF] dark:border-purple-800/30">
              <Calendar className="h-4 w-4 text-[#7C3AED] dark:text-purple-400 flex-shrink-0" />
              <span className="text-[13px] font-medium text-[#7C3AED] dark:text-purple-400">
                Due: {formatDueDate(parsedDueDate)}
              </span>
            </div>
          )}

          {/* Locked State */}
          {isLocked && (
            <div className="p-4 bg-[#F8F9FB] dark:bg-gray-800 rounded-xl border border-[#ECEDF0] dark:border-gray-700">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] dark:bg-gray-700 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-[#6B7280] dark:text-gray-400" />
                </div>
                <p className="text-[13px] font-semibold text-[#1A1A2E] dark:text-white">ETA is Locked</p>
              </div>
              <p className="text-[12px] text-[#6B7280] dark:text-gray-400 ml-[42px]">
                Current ETA: {accountability?.currentEta ? formatDueDate(new Date(accountability.currentEta)) : 'N/A'}
              </p>
              <p className="text-[12px] text-[#9CA3AF] dark:text-gray-500 ml-[42px] mt-1">
                You cannot change the ETA until it expires.
              </p>
            </div>
          )}

          {/* Form Fields */}
          {!isLocked && canSetEta && (
            <>
              {/* ETA Preview */}
              {formatSelectedPreview() && (
                <div className={cn(
                  'flex items-center gap-2.5 px-3.5 py-3 rounded-xl border transition-colors',
                  hasError
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'
                    : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30'
                )}>
                  <Clock className={cn('h-4 w-4 flex-shrink-0', hasError ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400')} />
                  <span className={cn('text-[13px] font-medium', hasError ? 'text-red-600' : 'text-emerald-700 dark:text-emerald-400')}>
                    Your ETA: {formatSelectedPreview()}
                  </span>
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#9CA3AF] dark:text-gray-500 mb-1.5 uppercase tracking-wider">
                    Date
                  </label>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4C4C4] dark:text-gray-600 group-focus-within:text-[#7C3AED] transition-colors pointer-events-none z-10" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => { setSelectedDate(e.target.value); setError(null); }}
                      min={getMinDate()}
                      max={getMaxDate()}
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 text-[13px] text-[#1A1A2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#9CA3AF] dark:text-gray-500 mb-1.5 uppercase tracking-wider">
                    Time
                  </label>
                  <div className="relative group">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C4C4C4] dark:text-gray-600 group-focus-within:text-[#7C3AED] transition-colors pointer-events-none z-10" />
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => { setSelectedTime(e.target.value); setError(null); }}
                      max={getMaxTime()}
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 text-[13px] text-[#1A1A2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[11px] font-semibold text-[#9CA3AF] dark:text-gray-500 mb-1.5 uppercase tracking-wider">
                  Reason <span className="normal-case font-normal text-[#D1D5DB] dark:text-gray-600">(optional)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why did you choose this deadline?"
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 text-[13px] text-[#1A1A2E] dark:text-white placeholder-[#D1D5DB] dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] resize-none transition-all"
                />
              </div>

              {/* Info */}
              <div className="flex items-start gap-2.5 px-3.5 py-3 bg-[#F8F9FB] dark:bg-gray-800 rounded-xl border border-[#ECEDF0] dark:border-gray-700">
                <Info className="h-4 w-4 text-[#7C3AED] dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <p className="text-[12px] text-[#6B7280] dark:text-gray-400 leading-relaxed">
                  Once set, you cannot change your ETA until it expires. Missing an ETA will count as a strike against your accountability score.
                </p>
              </div>

              {/* Error */}
              {hasError && (
                <div className="flex items-center gap-2.5 px-3.5 py-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800/30">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span className="text-[12px] font-medium text-red-600 dark:text-red-400">
                    {error || (exceedsDueDate() ? 'ETA cannot exceed the due date' : 'ETA must be in the future')}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#6B7280] dark:text-gray-400 hover:bg-[#F5F5F7] dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            {!isLocked && canSetEta && (
              <button
                onClick={handleSubmit}
                disabled={!hasValidInput || isSubmitting}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center gap-2',
                  hasValidInput && !isSubmitting
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#5B4FD1] text-white shadow-sm hover:shadow-md hover:from-[#6D28D9] hover:to-[#4F46C8]'
                    : 'bg-[#F3F4F6] dark:bg-gray-800 text-[#C4C4C4] dark:text-gray-600 cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Setting...
                  </>
                ) : (
                  <>
                    <Timer className="h-4 w-4" />
                    Set ETA
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SetETADialog;
