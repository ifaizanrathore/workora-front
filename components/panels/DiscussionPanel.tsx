'use client';

import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { useTaskDiscussion, useCreateComment } from '@/hooks';
import { formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface DiscussionPanelProps {
  taskId: string;
}

// Mock discussion data
const mockDiscussion = [
  {
    id: '1',
    user: { username: 'Mollie Hall', profilePicture: null },
    message: "Hey Olivia, I've finished with the requirements doc! I made some notes in the gdoc as well for Phoenix to look over.",
    timestamp: 'Thursday 11:40am',
    isOwn: false,
    attachments: [],
  },
  {
    id: '2',
    user: { username: 'Mollie Hall', profilePicture: null },
    message: null,
    timestamp: 'Thursday 11:40am',
    isOwn: false,
    attachments: [
      { name: 'Tech requirements.pdf', size: '1.2 MB', type: 'pdf' },
    ],
  },
  {
    id: '3',
    user: { username: 'You', profilePicture: null },
    message: "Awesome! Thanks. I'll look at this today.",
    timestamp: 'Thursday 11:41am',
    isOwn: true,
    attachments: [],
  },
  {
    id: '4',
    user: { username: 'Mollie Hall', profilePicture: null },
    message: "No rush though — we still have to wait for Lana's designs.",
    timestamp: 'Thursday 11:44am',
    isOwn: false,
    attachments: [],
  },
  {
    id: '5',
    user: { username: 'Mollie Hall', profilePicture: null },
    message: 'Hey Olivia, can you please review the latest design when you can?',
    timestamp: 'Today 2:20pm',
    isOwn: false,
    attachments: [],
    isNewDay: true,
  },
];

export const DiscussionPanel: React.FC<DiscussionPanelProps> = ({ taskId }) => {
  const { data: discussion } = useTaskDiscussion(taskId);
  const displayMessages = discussion || mockDiscussion;

  let lastDate = '';

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-4 space-y-4">
      {displayMessages.map((msg: any, index: number) => {
        // Check if we need to show a date separator
        const msgDate = msg.timestamp.split(' ')[0];
        const showDateSeparator = msgDate !== lastDate;
        lastDate = msgDate;

        return (
          <React.Fragment key={msg.id}>
            {/* Date Separator */}
            {showDateSeparator && (
              <div className="flex items-center justify-center py-2">
                <span className="text-xs text-text-tertiary bg-background px-3 py-1 rounded-full">
                  {msgDate === 'Today' ? 'Today' : msgDate}
                </span>
              </div>
            )}

            {/* Message */}
            <div
              className={cn(
                'flex gap-3',
                msg.isOwn ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {/* Avatar - only for non-own messages */}
              {!msg.isOwn && (
                <div className="flex flex-col items-center">
                  <Avatar name={msg.user.username} size="sm" />
                  <span className="w-0.5 flex-1 bg-success mt-1" />
                </div>
              )}

              {/* Message Content */}
              <div
                className={cn(
                  'max-w-[80%] space-y-1',
                  msg.isOwn ? 'items-end' : 'items-start'
                )}
              >
                {/* Header */}
                {!msg.isOwn && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {msg.user.username}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {msg.timestamp}
                    </span>
                  </div>
                )}

                {/* Message Bubble */}
                {msg.message && (
                  <div
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-sm',
                      msg.isOwn
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-white border border-border rounded-bl-sm'
                    )}
                  >
                    {msg.message}
                  </div>
                )}

                {/* Attachments */}
                {msg.attachments?.length > 0 && (
                  <div className="space-y-2">
                    {msg.attachments.map((attachment: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-white border border-border rounded-lg"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded bg-red-100">
                          <FileText className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-text-tertiary">
                            {attachment.size}
                          </p>
                        </div>
                        <button className="p-2 hover:bg-background-hover rounded">
                          <Download className="h-4 w-4 text-text-tertiary" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Timestamp for own messages */}
                {msg.isOwn && (
                  <div className="flex justify-end">
                    <span className="text-xs text-text-tertiary">
                      {msg.timestamp}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default DiscussionPanel;
