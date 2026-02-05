'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import {
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { TaskAccountability } from '@/types';
import toast from 'react-hot-toast';

interface ETAExpiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskName: string;
  dueDate?: string | number | null;
  accountability: TaskAccountability;
  onSuccess?: (accountability: TaskAccountability | null, action: 'extended' | 'completed') => void;
}

export const ETAExpiredDialog: React.FC<ETAExpiredDialogProps> = ({
  open,
  onOpenChange,
  taskId,
  taskName,
  dueDate,
  accountability,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'choice' | 'extend' | 'complete'>('choice');
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

  // Get max date (due date or far future)
  const getMaxDate = (): string => {
    if (parsedDueDate && parsedDueDate > new Date()) {
      return parsedDueDate.toISOString().split('T')[0];
    }
    return '2099-12-31';
  };

  // Get min date (today)
  const getMinDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  // Get max time for selected date
  const getMaxTime = (): string => {
    if (!parsedDueDate || !selectedDate) return '23:59';
    const selectedDateObj = new Date(selectedDate);
    const dueDateOnly = new Date(parsedDueDate.toISOString().split('T')[0]);

    if (selectedDateObj.getTime() === dueDateOnly.getTime()) {
      return parsedDueDate.toTimeString().slice(0, 5);
    }
    return '23:59';
  };

  // Check if ETA exceeds due date
  const exceedsDueDate = (): boolean => {
    if (!parsedDueDate || !selectedDate || !selectedTime) return false;
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
    return selectedDateTime > parsedDueDate;
  };

  // Check if ETA is in the past
  const isInPast = (): boolean => {
    if (!selectedDate || !selectedTime) return false;
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
    return selectedDateTime <= new Date();
  };

  // Format date for display
  const formatDateTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Calculate overdue time
  const getOverdueTime = (): string => {
    if (!accountability.currentEta) return '';
    const etaDate = new Date(accountability.currentEta);
    const now = new Date();
    const diffMs = now.getTime() - etaDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} overdue`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} overdue`;
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} overdue`;
  };

  // Get status color
  const getStatusColor = () => {
    const status = accountability.status;
    if (status === 'RED') return { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700' };
    if (status === 'ORANGE') return { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700' };
    return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' };
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setMode('choice');
      setSelectedDate('');
      setSelectedTime('');
      setReason('');
      setError(null);
    }
  }, [open]);

  const handleExtend = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time');
      return;
    }

    if (isInPast()) {
      setError('New ETA must be in the future');
      return;
    }

    if (exceedsDueDate()) {
      setError(`ETA cannot exceed the due date`);
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      setError('Please provide a reason for extending (at least 3 characters)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newEtaDateTime = new Date(`${selectedDate}T${selectedTime}`);

      const result = await api.extendEta(taskId, {
        newEta: newEtaDateTime.toISOString(),
        reason: reason.trim(),
        dueDate: parsedDueDate?.toISOString(),
      });

      toast.success(`ETA extended. Strike ${result.strikeCount} applied.`);
      onSuccess?.(result, 'extended');
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to extend ETA');
      toast.error(err.message || 'Failed to extend ETA');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await api.markTaskComplete(taskId, {});
      toast.success('Task marked as complete!');
      onSuccess?.(null, 'completed');
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to mark complete');
      toast.error(err.message || 'Failed to mark complete');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColors = getStatusColor();

  // This dialog should not be closable without action
  const handleOpenChange = (newOpen: boolean) => {
    // Only allow closing through the action buttons
    if (!newOpen && mode === 'choice') {
      // Don't allow closing from choice mode
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="md" showClose={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            ETA Expired - Action Required
          </DialogTitle>
          <DialogDescription>
            Your deadline has passed. You must take action to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Task Info */}
          <div className="p-3 bg-[#F8F9FB] rounded-lg">
            <p className="text-sm font-medium text-[#1A1A2E]">{taskName}</p>
            <p className="text-xs text-red-500 mt-1">{getOverdueTime()}</p>
          </div>

          {/* Accountability Status */}
          <div className={cn('p-3 rounded-lg border', statusColors.bg, statusColors.border)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className={cn('h-4 w-4', statusColors.text)} />
                <span className={cn('text-sm font-medium', statusColors.text)}>
                  Status: {accountability.status}
                </span>
              </div>
              <span className={cn('text-sm', statusColors.text)}>
                Strikes: {accountability.strikeCount}/{accountability.maxStrikes}
              </span>
            </div>
            {accountability.strikesRemaining <= 1 && (
              <p className="text-xs text-red-600 mt-1">
                Warning: {accountability.strikesRemaining === 0 ? 'Maximum strikes reached!' : 'One strike remaining!'}
              </p>
            )}
          </div>

          {/* Choice Mode */}
          {mode === 'choice' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">What would you like to do?</p>

              <button
                onClick={() => setMode('complete')}
                className="w-full p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-700">Mark as Complete</p>
                    <p className="text-xs text-gray-500">I've finished this task</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('extend')}
                disabled={accountability.strikesRemaining === 0}
                className={cn(
                  'w-full p-4 border-2 rounded-lg transition-colors text-left',
                  accountability.strikesRemaining === 0
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                    : 'border-orange-200 hover:border-orange-400 hover:bg-orange-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    accountability.strikesRemaining === 0 ? 'bg-gray-100' : 'bg-orange-100'
                  )}>
                    <Clock className={cn(
                      'h-5 w-5',
                      accountability.strikesRemaining === 0 ? 'text-gray-400' : 'text-orange-600'
                    )} />
                  </div>
                  <div>
                    <p className={cn(
                      'font-medium',
                      accountability.strikesRemaining === 0 ? 'text-gray-400' : 'text-orange-700'
                    )}>
                      Extend ETA (+1 Strike)
                    </p>
                    <p className="text-xs text-gray-500">
                      {accountability.strikesRemaining === 0
                        ? 'No strikes remaining - must complete'
                        : 'I need more time to complete this'}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Complete Confirmation */}
          {mode === 'complete' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-700">
                  Confirm that you've completed this task
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setMode('choice')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="success"
                  onClick={handleComplete}
                  isLoading={isSubmitting}
                  className="flex-1"
                >
                  Confirm Complete
                </Button>
              </div>
            </div>
          )}

          {/* Extend Form */}
          {mode === 'extend' && (
            <div className="space-y-4">
              {/* Due Date Warning */}
              {parsedDueDate && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-700">
                    Due: {formatDateTime(parsedDueDate)}
                  </span>
                </div>
              )}

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  New ETA Date
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full"
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  New ETA Time
                </label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  max={getMaxTime()}
                  className="w-full"
                />
              </div>

              {/* Reason (Required) */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  Reason <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why do you need more time? (required)"
                  rows={3}
                  error={error?.includes('reason')}
                />
              </div>

              {/* Strike Warning */}
              <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-xs text-orange-700">
                  <p className="font-medium">This will add 1 strike to your record</p>
                  <p>Current: {accountability.strikeCount} → New: {accountability.strikeCount + 1}</p>
                </div>
              </div>

              {/* Validation warnings */}
              {exceedsDueDate() && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">
                    ETA cannot exceed the due date
                  </span>
                </div>
              )}

              {isInPast() && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">
                    New ETA must be in the future
                  </span>
                </div>
              )}

              {/* Error */}
              {error && !error.includes('reason') && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setMode('choice')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleExtend}
                  isLoading={isSubmitting}
                  disabled={!selectedDate || !selectedTime || !reason.trim() || exceedsDueDate() || isInPast()}
                  className="flex-1"
                >
                  Extend ETA
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ETAExpiredDialog;
