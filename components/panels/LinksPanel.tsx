'use client';

import React from 'react';
import { FileText, FileArchive, Download, ThumbsUp, Smile, Reply, AtSign } from 'lucide-react';
import { useAttachments } from '@/hooks';
import { formatTimeAgo, formatFileSize, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';

interface LinksPanelProps {
  taskId: string;
}

// Mock links/docs data
const mockDocs = [
  {
    id: '1',
    user: { username: 'DAUD', profilePicture: null },
    timestamp: '15 mins',
    message: '@Usman Anser Done!',
    mentions: ['Usman Anser'],
    attachments: [
      { name: 'gabdupuis22.zip', size: 64 * 1024 * 1024, type: 'zip' },
    ],
  },
  {
    id: '2',
    attachments: [
      { name: 'Tech requirements.pdf', size: 1.2 * 1024 * 1024, type: 'pdf' },
      { name: 'Tech requirements.pdf', size: 1.2 * 1024 * 1024, type: 'pdf' },
      { name: 'Tech requirements.pdf', size: 1.2 * 1024 * 1024, type: 'pdf' },
    ],
  },
  {
    id: '3',
    attachments: [
      { name: 'gabdupuis22.zip', size: 64 * 1024 * 1024, type: 'zip' },
    ],
  },
];

export const LinksPanel: React.FC<LinksPanelProps> = ({ taskId }) => {
  const { data: attachments } = useAttachments(taskId);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {mockDocs.map((doc) => (
        <div key={doc.id} className="space-y-3">
          {/* User Message */}
          {doc.user && (
            <div className="flex items-start gap-3">
              <Avatar name={doc.user.username} size="md" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">
                    {doc.user.username}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {doc.timestamp}
                  </span>
                </div>
                {doc.message && (
                  <p className="text-sm text-text-primary mt-1">
                    {doc.message.split(' ').map((word, idx) => {
                      if (word.startsWith('@')) {
                        return (
                          <span key={idx} className="text-primary font-medium">
                            {word}{' '}
                          </span>
                        );
                      }
                      return word + ' ';
                    })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Attachments */}
          {doc.attachments && (
            <div className="space-y-2 ml-11">
              {doc.attachments.map((attachment, idx) => (
                <AttachmentCard
                  key={idx}
                  name={attachment.name}
                  size={attachment.size}
                  type={attachment.type}
                />
              ))}
            </div>
          )}

          {/* Actions for messages with user */}
          {doc.user && (
            <div className="flex items-center gap-3 ml-11 pt-2 border-t border-border">
              <button className="p-1.5 hover:bg-background-hover rounded">
                <ThumbsUp className="h-4 w-4 text-text-tertiary" />
              </button>
              <button className="p-1.5 hover:bg-background-hover rounded">
                <Smile className="h-4 w-4 text-text-tertiary" />
              </button>
              <button className="ml-auto text-sm text-text-secondary hover:text-primary">
                Reply
              </button>
            </div>
          )}
        </div>
      ))}

      {mockDocs.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-text-tertiary">
          <FileText className="h-8 w-8 mb-2" />
          <p>No links or docs</p>
        </div>
      )}
    </div>
  );
};

// Attachment Card Component
interface AttachmentCardProps {
  name: string;
  size: number;
  type: string;
}

const AttachmentCard: React.FC<AttachmentCardProps> = ({ name, size, type }) => {
  const isPDF = type === 'pdf';
  const isZip = type === 'zip' || type === 'rar' || type === '7z';

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-border rounded-lg hover:border-border-dark transition-colors">
      {/* Icon */}
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded',
          isPDF && 'bg-red-100',
          isZip && 'bg-amber-100',
          !isPDF && !isZip && 'bg-gray-100'
        )}
      >
        {isPDF && (
          <span className="text-xs font-bold text-red-600">PDF</span>
        )}
        {isZip && (
          <FileArchive className="h-5 w-5 text-amber-600" />
        )}
        {!isPDF && !isZip && (
          <FileText className="h-5 w-5 text-gray-600" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary truncate hover:underline cursor-pointer">
          {name}
        </p>
        <p className="text-xs text-text-tertiary">
          {formatFileSize(size)}
        </p>
      </div>

      {/* Download */}
      <button className="p-2 hover:bg-background-hover rounded">
        <Download className="h-4 w-4 text-text-tertiary" />
      </button>
    </div>
  );
};

export default LinksPanel;
