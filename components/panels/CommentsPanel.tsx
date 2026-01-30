'use client';

import React, { useState } from 'react';
import {
  Check,
  CheckSquare,
  Square,
  ThumbsUp,
  Reply,
  Link as LinkIcon,
  Forward,
  MoreHorizontal,
} from 'lucide-react';
import { Comment } from '@/types';
import { useComments, useUpdateComment } from '@/hooks';
import { formatTimeAgo, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface CommentsPanelProps {
  taskId: string;
}

// Mock comments data
const mockComments: Comment[] = [
  {
    id: '1',
    text: 'checking',
    user: { id: '1', username: 'umer hammad', email: '', profilePicture: null },
    resolved: false,
    assignee: { id: '2', username: 'khalil', email: '' },
    assignedBy: { id: '1', username: 'umer', email: '' },
    dateCreated: new Date().toISOString(),
    reactions: [],
  },
  {
    id: '2',
    text: 'checking',
    user: { id: '1', username: 'umer hammad', email: '', profilePicture: null },
    resolved: true,
    assignee: { id: '2', username: 'khalil', email: '' },
    assignedBy: { id: '1', username: 'umer', email: '' },
    dateCreated: new Date().toISOString(),
    reactions: [],
  },
];

export const CommentsPanel: React.FC<CommentsPanelProps> = ({ taskId }) => {
  const { data: comments } = useComments(taskId);
  const updateComment = useUpdateComment();

  const displayComments = comments || mockComments;

  const handleResolve = (commentId: string, resolved: boolean) => {
    updateComment.mutate({
      commentId,
      input: { resolved: !resolved },
      taskId,
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {displayComments.map((comment: Comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onResolve={handleResolve}
        />
      ))}

      {displayComments.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-text-tertiary">
          <p>No comments yet</p>
        </div>
      )}
    </div>
  );
};

// Comment Item Component
interface CommentItemProps {
  comment: Comment;
  onResolve: (commentId: string, resolved: boolean) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onResolve }) => {
  const [showReply, setShowReply] = useState(false);

  return (
    <div className={cn(
      'border-b border-border',
      comment.resolved && 'bg-green-50/50'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          {/* Resolve Checkbox */}
          <Checkbox
            checked={comment.resolved}
            onCheckedChange={() => onResolve(comment.id, comment.resolved)}
          />
          <span className="font-medium text-text-primary">Resolve</span>
        </div>

        {/* Assignment Info */}
        {comment.assignee && (
          <div className="text-sm text-text-secondary">
            Assigned to{' '}
            <span className="font-medium text-text-primary">
              {comment.assignee.username}
            </span>
            {comment.assignedBy && (
              <>
                {' '}by {comment.assignedBy.username}
              </>
            )}
          </div>
        )}
      </div>

      {/* Resolved Badge */}
      {comment.resolved && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b border-green-100">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">
            Resolved by {comment.user.username}
          </span>
          {comment.assignee && (
            <span className="text-sm text-primary ml-auto">
              Assigned to {comment.assignee.username} by {comment.assignedBy?.username}
            </span>
          )}
        </div>
      )}

      {/* Comment Content */}
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <Avatar
            name={comment.user.username}
            src={comment.user.profilePicture}
            size="md"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary">
                {comment.user.username}
              </span>
              <span className="text-xs text-text-tertiary">
                {formatTimeAgo(comment.dateCreated)}
              </span>

              {/* Action Icons - show on hover */}
              <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 hover:bg-background-hover rounded">
                  <LinkIcon className="h-4 w-4 text-text-tertiary" />
                </button>
                <button className="p-1.5 hover:bg-background-hover rounded">
                  <Forward className="h-4 w-4 text-text-tertiary" />
                </button>
                <button className="p-1.5 hover:bg-background-hover rounded">
                  <MoreHorizontal className="h-4 w-4 text-text-tertiary" />
                </button>
              </div>
            </div>

            <p className="mt-1 text-sm text-text-primary">{comment.text}</p>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-2">
              <button className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary">
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary">
                😀
              </button>
              <button
                onClick={() => setShowReply(!showReply)}
                className="text-sm text-text-secondary hover:text-primary"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsPanel;
