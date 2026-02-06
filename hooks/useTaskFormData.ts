'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/stores';
import type { TaskStatus, Assignee, TaskTag } from './useCreateTaskForm';

export interface TaskFormData {
  statuses: TaskStatus[];
  members: Assignee[];
  tags: TaskTag[];
  lists: any[];
}

interface UseTaskFormDataOptions {
  isOpen: boolean;
  listId?: string;
}

export function useTaskFormData({ isOpen, listId }: UseTaskFormDataOptions) {
  const { currentList, currentWorkspace, currentSpace, lists, setCurrentList, setLists } =
    useWorkspaceStore();

  const [data, setData] = useState<TaskFormData>({
    statuses: [],
    members: [],
    tags: [],
    lists: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListsIfNeeded = useCallback(async () => {
    if (lists.length > 0) {
      return lists;
    }

    let fetchedLists: any[] = [];

    if (currentSpace?.id) {
      try {
        fetchedLists = await api.getFolderlessLists(currentSpace.id);
      } catch (e) {
        console.warn('Failed to fetch lists from space:', e);
      }
    }

    if (fetchedLists.length === 0 && currentWorkspace?.id) {
      try {
        const spaces = await api.getSpaces(currentWorkspace.id);
        if (spaces && spaces.length > 0) {
          if (!currentSpace) {
            useWorkspaceStore.getState().setCurrentSpace(spaces[0]);
          }
          const spaceId = currentSpace?.id || spaces[0]?.id;
          if (spaceId) {
            fetchedLists = await api.getFolderlessLists(spaceId);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch spaces/lists from workspace:', e);
      }
    }

    if (fetchedLists && fetchedLists.length > 0) {
      setLists(fetchedLists);
      if (!currentList) {
        setCurrentList(fetchedLists[0]);
      }
      return fetchedLists;
    }

    return lists.length > 0 ? lists : [];
  }, [currentSpace?.id, currentWorkspace?.id, currentList, lists, setCurrentList, setLists]);

  const fetchFormData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch lists
      const fetchedLists = await fetchListsIfNeeded();

      // Fetch statuses for current list
      const effectiveListId = listId || currentList?.id || fetchedLists[0]?.id;
      let statuses: TaskStatus[] = [];
      if (effectiveListId) {
        statuses = await api.getListStatuses(effectiveListId);
      }

      // Fetch workspace members
      let members: Assignee[] = [];
      if (currentWorkspace?.id) {
        members = await api.getMembers(currentWorkspace.id);
      }

      // Fetch space tags
      let tags: TaskTag[] = [];
      if (currentSpace?.id) {
        tags = await api.getSpaceTags(currentSpace.id);
      }

      setData({
        statuses: statuses as TaskStatus[],
        members,
        tags,
        lists: fetchedLists,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch form data';
      setError(errorMsg);
      console.error('Failed to fetch form data:', err);
    } finally {
      setLoading(false);
    }
  }, [listId, currentList?.id, currentWorkspace?.id, currentSpace?.id, fetchListsIfNeeded]);

  useEffect(() => {
    if (!isOpen) return;
    fetchFormData();
  }, [isOpen, fetchFormData]);

  const refetch = useCallback(() => {
    fetchFormData();
  }, [fetchFormData]);

  return { data, loading, error, refetch };
}
