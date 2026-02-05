'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Clock, Calendar, AlertCircle, Lock, Info } from 'lucide-react';
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
      // Same day as due date - limit to due date time
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

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedDate('');
      setSelectedTime('');
      setReason('');
      setError(null);
    }
  }, [open]);

  // Check if ETA is already locked
  const isLocked = accountability?.isLocked;
  const canSetEta = accountability?.canSetEta ?? true;

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
      setError(`ETA cannot exceed the due date (${formatDueDate(parsedDueDate!)})`);
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
      <DialogContent size="md" showClose={true}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#7C3AED]" />
            Set ETA for Task
          </DialogTitle>
          <DialogDescription>
            Set your estimated time of arrival for completing this task
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Task Name */}
          <div className="p-3 bg-[#F8F9FB] rounded-lg">
            <p className="text-sm font-medium text-[#1A1A2E]">{taskName}</p>
          </div>

          {/* Due Date Info */}
          {parsedDueDate && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700">
                Due: {formatDueDate(parsedDueDate)}
              </span>
            </div>
          )}

          {/* Locked State */}
          {isLocked && (
            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg border border-gray-200">
              <Lock className="h-4 w-4 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">ETA is Locked</p>
                <p className="text-xs text-gray-500">
                  Current ETA: {accountability?.currentEta ? formatDueDate(new Date(accountability.currentEta)) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  You cannot change the ETA until it expires. Honor your commitment!
                </p>
              </div>
            </div>
          )}

          {/* Form Fields - Only show if not locked */}
          {!isLocked && canSetEta && (
            <>
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  Date
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
                  Time
                </label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  max={getMaxTime()}
                  className="w-full"
                />
              </div>

              {/* Reason (Optional) */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  Reason <span className="text-gray-400">(optional)</span>
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why did you choose this deadline?"
                  rows={2}
                />
              </div>

              {/* Warning about ETA */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium">Important:</p>
                  <p>Once set, you cannot change your ETA until it expires. Missing an ETA will count as a strike against your accountability score.</p>
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
                    ETA must be in the future
                  </span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!isLocked && canSetEta && (
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={!selectedDate || !selectedTime || exceedsDueDate() || isInPast()}
            >
              Set ETA
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SetETADialog;
