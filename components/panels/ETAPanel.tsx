'use client';

import React, { useState } from 'react';
import { Calendar, AlertCircle, Clock, Info } from 'lucide-react';
import { TaskAccountability, ETAExtension } from '@/types';
import { useSetTaskETA, useExtendTaskETA } from '@/hooks';
import { formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ETAPanelProps {
  taskId: string;
  accountability?: TaskAccountability | null;
}

// Mock postpone data
const mockPostpones: ETAExtension[] = [
  {
    id: '1',
    reason: 'Need more time for review',
    additionalTime: 3600000,
    requestedAt: new Date().toISOString(),
    originalDeadline: new Date().toISOString(),
    newDeadline: new Date(Date.now() + 3600000).toISOString(),
    strikeApplied: false,
  },
];

export const ETAPanel: React.FC<ETAPanelProps> = ({ taskId, accountability }) => {
  const [notifyAfter, setNotifyAfter] = useState('');
  const setETA = useSetTaskETA();
  const extendETA = useExtendTaskETA();

  const extensions = (accountability?.etaHistory as unknown as ETAExtension[]) || mockPostpones;
  const iconsRemaining = accountability?.maxStrikes
    ? accountability.maxStrikes - accountability.strikeCount
    : 3;

  // Get status color
  const getStatusColor = (index: number) => {
    if (index === 0) return 'bg-amber-400'; // Warning
    if (index === 1) return 'bg-amber-400';
    return 'bg-red-500'; // Critical
  };

  const getStatusIcon = (index: number) => {
    if (index < 2) return '😐'; // Warning face
    return '😠'; // Angry face
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Notify Me Section */}
      <div className="px-4 py-4 border-b border-border bg-white">
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-primary font-medium">
            Notify me After..
          </span>
          <Info className="h-4 w-4 text-text-tertiary" />
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Type in time"
              value={notifyAfter}
              onChange={(e) => setNotifyAfter(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-text-tertiary mt-1">
          Imp: Accountability Tracker
        </p>
      </div>

      {/* Postpone Cards */}
      <div className="flex-1 p-4 space-y-4">
        {[0, 1, 2, 3].map((index) => (
          <PostponeCard
            key={index}
            index={index}
            extension={extensions[index]}
            iconsRemaining={iconsRemaining}
          />
        ))}
      </div>
    </div>
  );
};

// Postpone Card Component
interface PostponeCardProps {
  index: number;
  extension?: ETAExtension;
  iconsRemaining: number;
}

const PostponeCard: React.FC<PostponeCardProps> = ({
  index,
  extension,
  iconsRemaining,
}) => {
  const isWarning = index < 2;
  const statusEmoji = isWarning ? '😐' : '😠';
  const statusColor = isWarning ? 'bg-amber-400' : 'bg-red-500';

  return (
    <div className="bg-white rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xl">{statusEmoji}</span>
          <span className="font-semibold text-text-primary">Postpone {index}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">Reason</span>
          <Badge variant="error" size="sm">
            Icons remaining
          </Badge>
        </div>
      </div>

      {/* Time Grid */}
      <div className="grid grid-cols-4 divide-x divide-border">
        <TimeCell
          label="Actual"
          sublabel="Project time"
          value="00:00 Hrs"
        />
        <TimeCell
          label="After Grace"
          sublabel="Period Proj Time"
          value="00:00 Hrs"
        />
        <TimeCell
          label="Grace Time"
          sublabel="Required"
          value="00:00 Hrs"
        />
        <TimeCell
          label="New Total"
          sublabel="Hrs"
          value="00:00 Hrs"
        />
      </div>
    </div>
  );
};

// Time Cell Component
interface TimeCellProps {
  label: string;
  sublabel: string;
  value: string;
}

const TimeCell: React.FC<TimeCellProps> = ({ label, sublabel, value }) => (
  <div className="px-3 py-3 text-center">
    <div className="text-xs text-text-tertiary mb-1">
      <div>{label}</div>
      <div>{sublabel}</div>
    </div>
    <div className="text-sm font-medium text-text-primary">{value}</div>
  </div>
);

export default ETAPanel;
