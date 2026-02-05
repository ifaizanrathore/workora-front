'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Check, CheckCircle2, Circle, Loader2, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { formatTimeCompact, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';

interface CommentsPanelProps {
  taskId: string;
}

interface Comment {
  id: string;
  comment_text?: string;
  text?: string;
  user?: {
    id?: number;
    username?: string;
    email?: string;
    profilePicture?: string;
  };
  resolved?: boolean;
  assignee?: {
    id?: number;
    username?: string;
    email?: string;
  };
  assigned_by?: {
    id?: number;
    username?: string;
  };
  date?: string;
  date_created?: string;
}

type FilterType = 'all' | 'unresolved' | 'resolved';

export const CommentsPanel: React.FC<CommentsPanelProps> = ({ taskId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    const fetchComments = async () => {
      if (!taskId) return;

      setIsLoading(true);
      try {
        const data = await api.getTaskComments(taskId);
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
        setComments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [taskId]);

  // Filter comments - only show those with assignees (resolvable)
  const resolvableComments = useMemo(() => {
    return comments.filter((c) => c.assignee || c.resolved !== undefined);
  }, [comments]);

  const filteredComments = useMemo(() => {
    if (filter === 'unresolved') {
      return resolvableComments.filter((c) => !c.resolved);
    }
    if (filter === 'resolved') {
      return resolvableComments.filter((c) => c.resolved);
    }
    return resolvableComments;
  }, [resolvableComments, filter]);

  const unresolvedCount = resolvableComments.filter((c) => !c.resolved).length;
  const resolvedCount = resolvableComments.filter((c) => c.resolved).length;

  const handleResolve = async (commentId: string, currentResolved: boolean) => {
    try {
      await api.resolveComment(commentId, !currentResolved);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, resolved: !currentResolved } : c
        )
      );
    } catch (err) {
      console.error('Failed to resolve comment:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-[#7C3AED]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#ECEDF0]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#7C3AED]" />
            <h3 className="text-base font-semibold text-[#1A1A2E]">Resolve Comments</h3>
          </div>
          {unresolvedCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
              {unresolvedCount} pending
            </span>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#F5F5F7] p-1 rounded-lg">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
              filter === 'all'
                ? 'bg-white text-[#1A1A2E] shadow-sm'
                : 'text-[#6B7280] hover:text-[#1A1A2E]'
            )}
          >
            All ({resolvableComments.length})
          </button>
          <button
            onClick={() => setFilter('unresolved')}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
              filter === 'unresolved'
                ? 'bg-white text-[#1A1A2E] shadow-sm'
                : 'text-[#6B7280] hover:text-[#1A1A2E]'
            )}
          >
            Open ({unresolvedCount})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
              filter === 'resolved'
                ? 'bg-white text-[#1A1A2E] shadow-sm'
                : 'text-[#6B7280] hover:text-[#1A1A2E]'
            )}
          >
            Done ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto">
        {filteredComments.length > 0 ? (
          <div className="divide-y divide-[#ECEDF0]">
            {filteredComments.map((comment) => (
              <ResolveCommentItem
                key={comment.id}
                comment={comment}
                onResolve={handleResolve}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-[#9CA3AF]">
            <CheckCircle2 className="h-8 w-8 mb-2" />
            {filter === 'unresolved' ? (
              <p>All comments resolved!</p>
            ) : filter === 'resolved' ? (
              <p>No resolved comments yet</p>
            ) : (
              <>
                <p>No resolvable comments</p>
                <p className="text-xs mt-1">Assigned comments will appear here</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Resolve Comment Item Component
interface ResolveCommentItemProps {
  comment: Comment;
  onResolve: (commentId: string, resolved: boolean) => void;
}

const ResolveCommentItem: React.FC<ResolveCommentItemProps> = ({ comment, onResolve }) => {
  const text = comment.comment_text || comment.text || '';
  const userName = comment.user?.username || 'Unknown';
  const dateStr = comment.date || comment.date_created || '';
  const isResolved = comment.resolved || false;

  return (
    <div
      className={cn(
        'px-4 py-3 transition-colors',
        isResolved ? 'bg-green-50/50' : 'hover:bg-[#FAFBFC]'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Resolve Checkbox */}
        <button
          onClick={() => onResolve(comment.id, isResolved)}
          className={cn(
            'mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
            isResolved
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-[#D1D5DB] hover:border-[#7C3AED]'
          )}
        >
          {isResolved && <Check className="h-3 w-3" />}
        </button>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Avatar
              name={userName}
              src={comment.user?.profilePicture}
              size="xs"
            />
            <span className={cn(
              'font-medium text-sm',
              isResolved ? 'text-[#6B7280]' : 'text-[#1A1A2E]'
            )}>
              {userName}
            </span>
            <span className="text-xs text-[#9CA3AF]">
              {dateStr ? formatTimeCompact(dateStr) : ''}
            </span>
          </div>

          {/* Message */}
          <p className={cn(
            'mt-1 text-sm leading-relaxed',
            isResolved ? 'text-[#9CA3AF] line-through' : 'text-[#374151]'
          )}>
            {text}
          </p>

          {/* Assignment Info */}
          {comment.assignee && (
            <div className="mt-2 text-xs text-[#6B7280]">
              Assigned to{' '}
              <span className="font-medium text-[#7C3AED]">
                {comment.assignee.username}
              </span>
              {comment.assigned_by && (
                <> by {comment.assigned_by.username}</>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentsPanel;
