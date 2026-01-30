'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

// ============================================================
// useTaskActivity - For ActivityPanel
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

export function useTaskActivity(taskId: string) {
  const [data, setData] = useState<TaskActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    if (!taskId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let response: any[] = [];
      if (typeof (api as any).getTaskComments === 'function') {
        response = await (api as any).getTaskComments(taskId) || [];
      }
      
      const activities: TaskActivity[] = response.map((item: any) => ({
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
    } catch (err: any) {
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
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDiscussion = useCallback(async () => {
    if (!taskId) return;
    
    setIsLoading(true);
    try {
      let response: any[] = [];
      if (typeof (api as any).getTaskComments === 'function') {
        response = await (api as any).getTaskComments(taskId) || [];
      }
      setData(response);
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
      // Use the accountability endpoint if available
      if (typeof (api as any).setTaskETA === 'function') {
        const result = await (api as any).setTaskETA(taskId, listId, { eta, reason });
        return result;
      }
      // Method not available - log warning
      console.warn('setTaskETA not available in API');
      return null;
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
      if (typeof (api as any).extendEta === 'function') {
        const result = await (api as any).extendEta(taskId, { newEta, reason });
        return result;
      }
      // Method not available - log warning
      console.warn('extendEta not available in API');
      return null;
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
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAttachments = useCallback(async () => {
    if (!taskId) return;
    
    setIsLoading(true);
    try {
      if (typeof (api as any).getTask === 'function') {
        const task = await (api as any).getTask(taskId);
        setData(task?.attachments || []);
      } else {
        setData([]);
      }
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
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTags = useCallback(async () => {
    if (!spaceId) {
      setData([]);
      return;
    }
    
    setIsLoading(true);
    try {
      if (typeof (api as any).getSpaceTags === 'function') {
        const response = await (api as any).getSpaceTags(spaceId);
        setData(response || []);
      } else {
        setData([]);
      }
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
      if (typeof (api as any).addTaskTag === 'function') {
        await (api as any).addTaskTag(taskId, tagName);
      } else {
        console.warn('addTaskTag not available in API');
      }
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
      if (typeof (api as any).removeTaskTag === 'function') {
        await (api as any).removeTaskTag(taskId, tagName);
      } else {
        console.warn('removeTaskTag not available in API');
      }
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
      if (typeof (api as any).createTaskComment === 'function') {
        const result = await (api as any).createTaskComment(taskId, { comment_text: text });
        return result;
      }
      console.warn('createTaskComment not available in API');
      return null;
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

  const mutate = async ({ commentId, input, taskId }: { 
    commentId: string; 
    input: { resolved?: boolean; comment_text?: string }; 
    taskId: string;
  }) => {
    setIsLoading(true);
    try {
      if (typeof (api as any).updateComment === 'function') {
        await (api as any).updateComment(commentId, input);
      } else {
        console.warn('updateComment not available in API');
      }
    } catch (err) {
      console.error('Failed to update comment:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading };
}