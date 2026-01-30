import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api, CreateTaskInput } from '@/lib/api';
import {
  User,
  Workspace,
  Space,
  Folder,
  List,
  Task,
  Comment,
  Attachment,
  TaskAccountability,
  UpdateTaskInput,
  Tag,
} from '@/types';
import toast from 'react-hot-toast';

// Query Keys
export const queryKeys = {
  profile: ['profile'] as const,
  workspaces: ['workspaces'] as const,
  spaces: (teamId: string) => ['spaces', teamId] as const,
  folders: (spaceId: string) => ['folders', spaceId] as const,
  lists: (spaceId: string) => ['lists', spaceId] as const,
  folderLists: (folderId: string) => ['folderLists', folderId] as const,
  tasks: (listId: string) => ['tasks', listId] as const,
  task: (taskId: string) => ['task', taskId] as const,
  subtasks: (taskId: string) => ['subtasks', taskId] as const,
  comments: (taskId: string) => ['comments', taskId] as const,
  attachments: (taskId: string) => ['attachments', taskId] as const,
  accountability: (taskId: string) => ['accountability', taskId] as const,
  tags: (spaceId: string) => ['tags', spaceId] as const,
  discussion: (taskId: string) => ['discussion', taskId] as const,
  activity: (taskId: string) => ['activity', taskId] as const,
};

// ============ Auth Hooks ============
export function useProfile(options?: Omit<UseQueryOptions<User, Error>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => api.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    ...options,
  });
}

// ============ Workspace Hooks ============
export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: () => api.getWorkspaces(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSpaces(teamId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.spaces(teamId!),
    queryFn: () => api.getSpaces(teamId!),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFolders(spaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.folders(spaceId!),
    queryFn: () => api.getFolders(spaceId!),
    enabled: !!spaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFolderlessLists(spaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.lists(spaceId!),
    queryFn: () => api.getFolderlessLists(spaceId!),
    enabled: !!spaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useListsInFolder(folderId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.folderLists(folderId!),
    queryFn: () => api.getLists(folderId!),
    enabled: !!folderId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============ Task Hooks ============
export function useTasks(listId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks(listId!),
    queryFn: () => api.getTasks(listId!),
    enabled: !!listId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useTask(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.task(taskId!),
    queryFn: () => api.getTask(taskId!),
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });
}

export function useSubtasks(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.subtasks(taskId!),
    queryFn: () => api.getSubtasks(taskId!),
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => api.createTask(input),
    onSuccess: (task, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(variables.listId) });
      toast.success('Task created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create task');
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      api.updateTask(taskId, input),
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.task(task.id), task);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update task');
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => api.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete task');
    },
  });
}

// ============ Comment Hooks ============
export function useComments(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.comments(taskId!),
    queryFn: () => api.getTaskComments(taskId!),
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: { comment_text: string; assignee?: number; notify_all?: boolean } }) =>
      api.createTaskComment(taskId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(variables.taskId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add comment');
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      input,
      taskId,
    }: {
      commentId: string;
      input: { comment_text?: string; resolved?: boolean };
      taskId: string;
    }) => api.updateComment(commentId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(variables.taskId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update comment');
    },
  });
}

// ============ Attachment Hooks ============
export function useAttachments(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.attachments(taskId!),
    queryFn: () => api.getTaskAttachments(taskId!),
    enabled: !!taskId,
    staleTime: 60 * 1000,
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, file }: { taskId: string; file: File }) =>
      api.uploadAttachment(taskId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments(variables.taskId) });
      toast.success('File uploaded');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload file');
    },
  });
}

// ============ Checklist Hooks ============
export function useCreateChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, name }: { taskId: string; name: string }) =>
      api.addChecklist(taskId, name),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(variables.taskId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create checklist');
    },
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      checklistId,
      itemId,
      input,
      taskId,
    }: {
      checklistId: string;
      itemId: string;
      input: { name?: string; resolved?: boolean; assignee?: number };
      taskId: string;
    }) => api.updateChecklistItem(checklistId, itemId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(variables.taskId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update item');
    },
  });
}

export function useCreateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      checklistId,
      name,
      taskId,
    }: {
      checklistId: string;
      name: string;
      taskId: string;
    }) => api.addChecklistItem(checklistId, name),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(variables.taskId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add item');
    },
  });
}

// ============ Tag Hooks ============
export function useTags(spaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tags(spaceId!),
    queryFn: () => api.getSpaceTags(spaceId!),
    enabled: !!spaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, tagName }: { taskId: string; tagName: string }) =>
      api.addTaskTag(taskId, tagName),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(variables.taskId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add tag');
    },
  });
}

export function useRemoveTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, tagName }: { taskId: string; tagName: string }) =>
      api.removeTaskTag(taskId, tagName),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task(variables.taskId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove tag');
    },
  });
}

// ============ Accountability Hooks ============
export function useTaskAccountability(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.accountability(taskId!),
    queryFn: () => api.getTaskAccountability(taskId!),
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });
}

export function useSetTaskETA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      listId,
      eta,
      reason,
      syncFromDueDate,
    }: {
      taskId: string;
      listId: string;
      eta: string;
      reason?: string;
      syncFromDueDate?: boolean;
    }) => api.setEta(taskId, listId, { eta, reason, syncFromDueDate }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accountability(variables.taskId) });
      toast.success('ETA set successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to set ETA');
    },
  });
}

export function useExtendTaskETA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      newEta,
      reason,
    }: {
      taskId: string;
      newEta: string;
      reason: string;
    }) => api.extendEta(taskId, { newEta, reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accountability(variables.taskId) });
      toast.success('ETA extended');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to extend ETA');
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => api.updateTask(taskId, { status: 'complete' }),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accountability(taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) });
      toast.success('Task marked complete');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete task');
    },
  });
}

// ============ Panel Hooks ============
// Discussion is essentially threaded comments
export function useTaskDiscussion(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.discussion(taskId!),
    queryFn: () => api.getTaskComments(taskId!),
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });
}

// Activity fetches task activity/history
export function useTaskActivity(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.activity(taskId!),
    queryFn: () => api.getTaskActivity(taskId!),
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });
}