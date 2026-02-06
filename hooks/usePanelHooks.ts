'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Attachment, Tag, Comment } from '@/types';

// ============================================================
// Types
// ============================================================

export interface TaskActivity {
  id: string;
  type: 'create' | 'update' | 'comment' | 'status_change';
  action: string;
  message?: string;
  status?: string;
  user?: { username: string; profilePicture: string | null };
  timestamp: string | number;
}

// Comment structure from API
interface APIComment {
  id: string;
  comment_text?: string;
  text?: string;
  user?: { username?: string; profilePicture?: string | null };
  date?: string;
  created_at?: string;
}

// ============================================================
// useTaskActivity - For ActivityPanel
// ============================================================

export function useTaskActivity(taskId: string) {
  const [data, setData] = useState<TaskActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    if (!taskId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getTaskComments(taskId) || [];

      const activities: TaskActivity[] = response.map((item: APIComment) => ({
        id: item.id,
        type: 'comment' as const,
        action: 'commented',
        message: item.comment_text || item.text,
        user: {
          username: item.user?.username || 'Unknown',
          profilePicture: item.user?.profilePicture || null,
        },
        timestamp: item.date || item.created_at || Date.now(),
      }));

      // Add default created activity
      activities.push({
        id: 'created',
        type: 'create',
        action: 'created',
        message: 'You created this task',
        user: { username: 'You', profilePicture: null },
        timestamp: Date.now() - 120000,
      });

      setData(activities);
    } catch (err) {
      console.error('Failed to fetch activity:', err);
      setData([
        {
          id: '1',
          type: 'create',
          action: 'created',
          message: 'You created this task',
          user: { username: 'You', profilePicture: null },
          timestamp: Date.now() - 120000,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return { data, isLoading, error, refetch: fetchActivity };
}

// ============================================================
// useTaskDiscussion - For DiscussionPanel
// ============================================================

export function useTaskDiscussion(taskId: string) {
  const [data, setData] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDiscussion = useCallback(async () => {
    if (!taskId) return;

    setIsLoading(true);
    try {
      const response = await api.getTaskComments(taskId) || [];
      setData(response as Comment[]);
    } catch (err) {
      console.error('Failed to fetch discussion:', err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchDiscussion();
  }, [fetchDiscussion]);

  return { data, isLoading, refetch: fetchDiscussion };
}

// ============================================================
// useSetTaskETA - For ETAPanel
// ============================================================

export function useSetTaskETA() {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = async ({ taskId, listId, eta, reason }: {
    taskId: string;
    listId: string;
    eta: string;
    reason?: string;
  }) => {
    setIsLoading(true);
    try {
      const result = await api.setEta(taskId, listId, { eta, reason });
      return result;
    } catch (err) {
      console.error('Failed to set ETA:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading };
}

// ============================================================
// useExtendTaskETA - For ETAPanel
// ============================================================

export function useExtendTaskETA() {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = async ({ taskId, newEta, reason }: {
    taskId: string;
    newEta: string;
    reason: string;
  }) => {
    setIsLoading(true);
    try {
      const result = await api.extendEta(taskId, { newEta, reason });
      return result;
    } catch (err) {
      console.error('Failed to extend ETA:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading };
}

// ============================================================
// useAttachments - For LinksPanel
// ============================================================

export function useAttachments(taskId: string) {
  const [data, setData] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAttachments = useCallback(async () => {
    if (!taskId) return;

    setIsLoading(true);
    try {
      const task = await api.getTask(taskId);
      setData((task?.attachments as Attachment[]) || []);
    } catch (err) {
      console.error('Failed to fetch attachments:', err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  return { data, isLoading, refetch: fetchAttachments };
}

// ============================================================
// useTags - For TagsPanel
// ============================================================

export function useTags(spaceId?: string) {
  const [data, setData] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTags = useCallback(async () => {
    if (!spaceId) {
      setData([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.getSpaceTags(spaceId);
      setData((response as Tag[]) || []);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return { data, isLoading, refetch: fetchTags };
}

// ============================================================
// useAddTag - For TagsPanel
// ============================================================

export function useAddTag() {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = async ({ taskId, tagName }: { taskId: string; tagName: string }) => {
    setIsLoading(true);
    try {
      await api.addTaskTag(taskId, tagName);
    } catch (err) {
      console.error('Failed to add tag:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading };
}

// ============================================================
// useRemoveTag - For TagsPanel
// ============================================================

export function useRemoveTag() {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = async ({ taskId, tagName }: { taskId: string; tagName: string }) => {
    setIsLoading(true);
    try {
      await api.removeTaskTag(taskId, tagName);
    } catch (err) {
      console.error('Failed to remove tag:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading };
}

// ============================================================
// useCreateComment - For DiscussionPanel
// ============================================================

export function useCreateComment() {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = async ({ taskId, text }: { taskId: string; text: string }) => {
    setIsLoading(true);
    try {
      const result = await api.createTaskComment(taskId, { comment_text: text });
      return result;
    } catch (err) {
      console.error('Failed to create comment:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading };
}

// ============================================================
// useUpdateComment - For CommentsPanel
// ============================================================

export function useUpdateComment() {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = async ({ commentId, input }: {
    commentId: string;
    input: { resolved?: boolean; comment_text?: string };
    taskId: string;
  }) => {
    setIsLoading(true);
    try {
      await api.updateComment(commentId, input);
    } catch (err) {
      console.error('Failed to update comment:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading };
}
