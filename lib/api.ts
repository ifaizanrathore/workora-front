const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================================
// TYPES
// ============================================================

export interface TaskStatus {
  id: string;
  status: string;
  color: string;
  type?: string;
  orderindex?: number;
}

export interface Assignee {
  id: number;
  username: string;
  email: string;
  profilePicture?: string;
  color?: string;
  initials?: string;
}

export interface TaskTag {
  name: string;
  tag_bg: string;
  tag_fg: string;
}

export interface Priority {
  id: string;
  label: string;
  color: string;
  textColor: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  resolved: boolean;
  assignee?: Assignee;
  orderindex?: number;
}

export interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
  resolved?: number;
  unresolved?: number;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  priority?: { id: string; priority: string; color: string };
  assignees: Assignee[];
  tags: TaskTag[];
  due_date?: string;
  start_date?: string;
  time_estimate?: number;
  checklists?: Checklist[];
  date_created: string;
  date_updated: string;
  creator: Assignee;
  list?: { id: string; name: string };
  folder?: { id: string; name: string };
  space?: { id: string; name: string };
  parent?: string;
  custom_fields?: any[];
  attachments?: any[];
}

export interface CreateTaskInput {
  listId: string;
  name: string;
  description?: string;
  status?: string;
  priority?: number;
  assignees?: number[];
  tags?: string[];
  dueDate?: string;
  startDate?: string;
  timeEstimate?: number;
  checklist?: Array<{ name: string; items?: string[] }>;
}

export interface ExtractedTaskResult {
  name: string;
  description?: string;
  priority?: number;
  suggestedTags?: string[];
  estimatedTime?: number;
  checklist?: Array<{ name: string }>;
}

// ============================================================
// API CLIENT
// ============================================================

class ApiClient {
  // ============================================================
  // TOKEN & AUTH HELPERS
  // ============================================================

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  setToken(token: string | null): void {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  async getClickUpAuthUrl(): Promise<string> {
    const response = await fetch(`${API_URL}/clickup/auth/url`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    const data = await response.json();
    return data.url;
  }

  // ============================================================
  // HELPER: Check if task is completed
  // ============================================================

  isTaskCompleted(task: any): boolean {
    if (!task?.status) return false;
    
    const statusType = task.status.type?.toLowerCase();
    const statusName = task.status.status?.toLowerCase();
    
    return (
      statusType === 'closed' ||
      statusName === 'complete' ||
      statusName === 'completed' ||
      statusName === 'done' ||
      statusName === 'closed'
    );
  }

  private async guardTaskNotCompleted(taskId: string, action: string): Promise<void> {
    try {
      const task = await this.getTask(taskId);
      if (this.isTaskCompleted(task)) {
        throw new Error(`Cannot ${action} on a completed task. Please reopen the task first.`);
      }
    } catch (error: any) {
      if (error.message?.includes('completed task')) {
        throw error;
      }
      console.warn('Guard check failed, proceeding with operation:', error.message);
    }
  }

  // ============================================================
  // REQUEST HELPER
  // ============================================================
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const fullUrl = `${API_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'An error occurred' }));
      console.error(`❌ API Error ${response.status}:`, errorBody);
      throw new Error(errorBody.message || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return null as T;
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
      return null as T;
    }

    const text = await response.text();
    
    if (!text || text.trim() === '') {
      return null as T;
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn('Failed to parse JSON response:', text.substring(0, 100));
      return null as T;
    }
  }

  // ============================================================
  // AUTH
  // ============================================================

  async login(email: string, password: string) {
    return this.request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: { email: string; password: string; name: string }) {
    return this.request<{ access_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile() {
    return this.request<any>('/auth/profile');
  }

  // ============================================================
  // WORKSPACES & LISTS
  // ============================================================

  async getWorkspaces() {
    return this.request<Array<{ id: string; name: string }>>('/clickup/workspaces');
  }

  async getSpaces(teamId: string) {
    const response = await this.request<any>(`/clickup/workspaces/${teamId}/spaces`);
    return response?.spaces || response || [];
  }

  async getFolders(spaceId: string) {
    const response = await this.request<any>(`/clickup/spaces/${spaceId}/folders`);
    return response?.folders || response || [];
  }

  async getLists(folderId: string) {
    const response = await this.request<any>(`/clickup/folders/${folderId}/lists`);
    return response?.lists || response || [];
  }

  async getFolderlessLists(spaceId: string) {
    const response = await this.request<any>(`/clickup/spaces/${spaceId}/lists`);
    return response?.lists || response || [];
  }

  async getList(listId: string) {
    return this.request<any>(`/clickup/lists/${listId}`);
  }

  async getListStatuses(listId: string): Promise<TaskStatus[]> {
    try {
      const statuses = await this.request<TaskStatus[]>(`/clickup/lists/${listId}/statuses`);
      if (statuses && Array.isArray(statuses)) {
        return statuses;
      }
    } catch (e) {
      try {
        const list = await this.getList(listId);
        if (list?.statuses && Array.isArray(list.statuses)) {
          return list.statuses;
        }
      } catch (listError) {
        console.warn('Failed to get list statuses:', listError);
      }
    }
    
    return [
      { id: 'open', status: 'Open', color: '#d3d3d3' },
      { id: 'in_progress', status: 'In Progress', color: '#4194f6' },
      { id: 'review', status: 'Review', color: '#f9d900' },
      { id: 'complete', status: 'Complete', color: '#6bc950', type: 'closed' },
    ];
  }

  // ============================================================
  // MEMBERS
  // ============================================================

  async getMembers(teamId: string): Promise<Assignee[]> {
    if (!teamId) {
      return [];
    }
    
    try {
      const response = await this.request<any>(`/clickup/workspaces/${teamId}/members`);
      
      // Backend returns array directly (already mapped m.user in clickup.service.ts)
      const members = response?.members || response || [];
      
      if (!members || members.length === 0) {
        return [];
      }
      
      // Handle both formats (raw ClickUp with m.user or pre-mapped)
      return members.map((m: any) => ({
        id: m.user?.id || m.id,
        username: m.user?.username || m.username || m.user?.email || m.email || 'Unknown',
        email: m.user?.email || m.email || '',
        profilePicture: m.user?.profilePicture || m.profilePicture || null,
        color: m.user?.color || m.color || null,
        initials: m.user?.initials || m.initials || (m.username ? m.username[0].toUpperCase() : null),
      }));
    } catch (e) {
      console.error('Failed to fetch members:', e);
      return [];
    }
  }

  // ============================================================
  // TAGS
  // ============================================================

  async getSpaceTags(spaceId: string): Promise<TaskTag[]> {
    try {
      const response = await this.request<any>(`/clickup/spaces/${spaceId}/tags`);
      const tags = response?.tags || response || [];
      
      return tags.map((t: any) => ({
        name: t.name,
        tag_bg: t.tag_bg || '#5B4FD1',
        tag_fg: t.tag_fg || '#ffffff',
      }));
    } catch (e) {
      console.warn('Failed to get space tags:', e);
      return [];
    }
  }

  async createSpaceTag(spaceId: string, data: { name: string; tag_bg?: string; tag_fg?: string }) {
    return this.request<TaskTag>(`/clickup/spaces/${spaceId}/tags`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addTaskTag(taskId: string, tagName: string) {
    return this.request<any>(`/tasks/${taskId}/tags/${encodeURIComponent(tagName)}`, {
      method: 'POST',
    });
  }

  async removeTaskTag(taskId: string, tagName: string) {
    return this.request<any>(`/tasks/${taskId}/tags/${encodeURIComponent(tagName)}`, {
      method: 'DELETE',
    });
  }

  // ============================================================
  // TASKS
  // ============================================================

  async getTasks(listId: string): Promise<Task[]> {
    const response = await this.request<any>(`/tasks?listId=${listId}`);
    return response?.tasks || response || [];
  }

  async getTask(taskId: string): Promise<Task> {
    return this.request<Task>(`/tasks/${taskId}`);
  }

  async createTask(data: CreateTaskInput): Promise<Task> {
    const payload: Record<string, any> = {
      listId: data.listId,
      name: data.name,
    };

    if (data.description) payload.description = data.description;
    if (data.status) payload.status = data.status;
    if (data.priority !== undefined) payload.priority = data.priority;
    if (data.assignees && data.assignees.length > 0) payload.assignees = data.assignees;
    if (data.tags && data.tags.length > 0) payload.tags = data.tags;
    
    if (data.dueDate) {
      const timestamp = new Date(data.dueDate).getTime();
      if (!isNaN(timestamp)) payload.dueDate = timestamp;
    }
    if (data.startDate) {
      const timestamp = new Date(data.startDate).getTime();
      if (!isNaN(timestamp)) payload.startDate = timestamp;
    }
    
    if (data.timeEstimate) payload.timeEstimate = data.timeEstimate;
    
    if (data.checklist && data.checklist.length > 0) {
      payload.checklist = data.checklist;
    }

    try {
      const task = await this.request<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      return task;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, data: any) {
    if (!data.status) {
      await this.guardTaskNotCompleted(taskId, 'update');
    }
    
    return this.request<Task>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(taskId: string) {
    return this.request<{ success: boolean }>(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================
  // SUBTASKS
  // ============================================================

  async getSubtasks(taskId: string) {
    return this.request<Task[]>(`/tasks/${taskId}/subtasks`);
  }

  async createSubtask(taskId: string, listId: string, data: {
    name: string;
    description?: string;
    assignees?: number[];
    priority?: number;
    due_date?: number;
    status?: string;
  }) {
    return this.request<Task>(`/tasks/${taskId}/subtasks?listId=${listId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubtask(subtaskId: string, data: any) {
    return this.request<Task>(`/tasks/subtasks/${subtaskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSubtask(subtaskId: string) {
    return this.request<{ success: boolean }>(`/tasks/subtasks/${subtaskId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================
  // COMMENTS
  // ============================================================

  async getTaskComments(taskId: string) {
    const response = await this.request<any>(`/tasks/${taskId}/comments`);
    return response?.comments || [];
  }

  async createTaskComment(taskId: string, data: {
    comment_text: string;
    assignee?: number;
    notify_all?: boolean;
  }) {
    return this.request<any>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComment(commentId: string, data: {
    comment_text?: string;
    resolved?: boolean;
  }) {
    return this.request<any>(`/tasks/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteComment(commentId: string) {
    return this.request<{ success: boolean }>(`/tasks/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  async getCommentReplies(commentId: string) {
    return this.request<any>(`/tasks/comments/${commentId}/replies`);
  }

  async createCommentReply(commentId: string, data: {
    comment_text: string;
    assignee?: number;
    notify_all?: boolean;
  }) {
    return this.request<any>(`/tasks/comments/${commentId}/replies`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resolveComment(commentId: string, resolved: boolean) {
    return this.request<any>(`/tasks/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ resolved }),
    });
  }

  // ============================================================
  // ACTIVITY / HISTORY
  // ============================================================

  async getTaskActivity(taskId: string) {
    return this.request<any[]>(`/tasks/${taskId}/activity`);
  }

  async getTaskTimeInStatus(taskId: string) {
    return this.request<any>(`/clickup/tasks/${taskId}/time-in-status`);
  }

  async getTaskActivityCombined(taskId: string) {
    return this.request<any>(`/tasks/${taskId}/activity/combined`);
  }

  // ============================================================
  // WEBHOOKS MANAGEMENT
  // ============================================================

  async getWebhooks(teamId: string) {
    return this.request<any[]>(`/webhooks?teamId=${teamId}`);
  }

  async createWebhook(teamId: string, data: {
    endpoint?: string;
    events?: string[];
    spaceId?: string;
    folderId?: string;
    listId?: string;
    taskId?: string;
  }) {
    return this.request<any>('/webhooks', {
      method: 'POST',
      body: JSON.stringify({ teamId, ...data }),
    });
  }

  async deleteWebhook(webhookId: string) {
    return this.request<{ success: boolean }>(`/webhooks/${webhookId}`, {
      method: 'DELETE',
    });
  }

  async setupActivityTracking(teamId: string) {
    return this.request<any>('/webhooks/setup-activity-tracking', {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    });
  }

  async getWebhookHealth(teamId: string) {
    return this.request<any>(`/webhooks/health?teamId=${teamId}`);
  }

  // ============================================================
  // CUSTOM FIELDS
  // ============================================================

  async getListCustomFields(listId: string) {
    return this.request<any[]>(`/tasks/custom-fields?listId=${listId}`);
  }

  async setCustomFieldValue(taskId: string, fieldId: string, value: any) {
    await this.guardTaskNotCompleted(taskId, 'set custom field');
    
    return this.request<any>(`/tasks/${taskId}/custom-fields/${fieldId}`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  }

  async removeCustomFieldValue(taskId: string, fieldId: string) {
    return this.request<{ success: boolean }>(`/tasks/${taskId}/custom-fields/${fieldId}`, {
      method: 'DELETE',
    });
  }

  async createCustomField(listId: string, data: {
    name: string;
    type: string;
    type_config?: any;
    required?: boolean;
  }) {
    return this.request<any>(`/clickup/lists/${listId}/custom-fields`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // ATTACHMENTS
  // ============================================================

  async getTaskAttachments(taskId: string) {
    return this.request<any[]>(`/tasks/${taskId}/attachments`);
  }

  async uploadAttachment(taskId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const response = await fetch(`${API_URL}/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload attachment');
    }

    return response.json();
  }

  // ============================================================
  // CHECKLISTS
  // ============================================================

  async addChecklist(taskId: string, name: string) {
    await this.guardTaskNotCompleted(taskId, 'add checklist');
    
    const response = await this.request<any>(`/tasks/${taskId}/checklists`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });

    return response?.checklist || response;
  }

  async deleteChecklist(checklistId: string) {
    return this.request<{ success: boolean }>(`/tasks/checklists/${checklistId}`, {
      method: 'DELETE',
    });
  }

  async addChecklistItem(checklistId: string, name: string) {
    return this.request<any>(`/tasks/checklists/${checklistId}/items`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async updateChecklistItem(checklistId: string, itemId: string, data: {
    name?: string;
    resolved?: boolean;
    assignee?: number;
  }) {
    return this.request<any>(`/tasks/checklists/${checklistId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteChecklistItem(checklistId: string, itemId: string) {
    return this.request<{ success: boolean }>(`/tasks/checklists/${checklistId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================
  // TIME TRACKING - TASK-LEVEL
  // ============================================================

  async getTimeEntries(taskId: string) {
    return this.request<any[]>(`/clickup/tasks/${taskId}/time`);
  }

  async trackTime(taskId: string, data: { duration: number; start?: number; end?: number }) {
    await this.guardTaskNotCompleted(taskId, 'track time');
    
    return this.request<any>(`/tasks/${taskId}/time`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteTimeEntry(taskId: string, intervalId: string) {
    return this.request<{ success: boolean }>(`/tasks/${taskId}/time/${intervalId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================
  // TIME TRACKING - NATIVE CLICKUP TIMER
  // ============================================================

  async getRunningTimer(teamId: string) {
    return this.request<any>(`/clickup/team/${teamId}/time_entries/current`);
  }

  async startTimer(teamId: string, taskId: string, description?: string) {
    await this.guardTaskNotCompleted(taskId, 'start timer');
    
    const timer = await this.request<any>(`/clickup/team/${teamId}/time_entries/start`, {
      method: 'POST',
      body: JSON.stringify({
        tid: taskId,
        description: description || '',
        billable: false,
      }),
    });
    
    if (!timer || timer.start === undefined) {
      throw new Error('Invalid response from timer API');
    }
    
    return timer;
  }

  async stopTimer(teamId: string) {
    return this.request<any>(`/clickup/team/${teamId}/time_entries/stop`, {
      method: 'POST',
    });
  }

  async addTimeEntry(teamId: string, data: {
    taskId: string;
    start: number;
    duration: number;
    description?: string;
    billable?: boolean;
  }) {
    await this.guardTaskNotCompleted(data.taskId, 'add time entry');
    
    return this.request<any>(`/clickup/team/${teamId}/time_entries`, {
      method: 'POST',
      body: JSON.stringify({
        tid: data.taskId,
        start: data.start,
        duration: data.duration,
        description: data.description || '',
        billable: data.billable ?? false,
      }),
    });
  }

  async getTeamTimeEntries(teamId: string, options?: {
    startDate?: number;
    endDate?: number;
    assignee?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('start_date', options.startDate.toString());
    if (options?.endDate) params.append('end_date', options.endDate.toString());
    if (options?.assignee) params.append('assignee', options.assignee.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/clickup/team/${teamId}/time_entries${query}`);
  }

  async deleteTeamTimeEntry(teamId: string, intervalId: string) {
    return this.request<{ success: boolean }>(`/clickup/team/${teamId}/time_entries/${intervalId}`, {
      method: 'DELETE',
    });
  }

  async updateTimeEntry(teamId: string, intervalId: string, data: {
    start?: number;
    end?: number;
    duration?: number;
    description?: string;
    billable?: boolean;
    tags?: string[];
  }) {
    return this.request<any>(`/clickup/team/${teamId}/time_entries/${intervalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // ASSIGNEES
  // ============================================================

  async updateAssignees(taskId: string, data: { add?: number[]; rem?: number[] }) {
    await this.guardTaskNotCompleted(taskId, 'update assignees');
    
    return this.request<any>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ assignees: data }),
    });
  }

  // ============================================================
  // WORKORA: INSTRUCTION PANELS
  // ============================================================

  async getPanels(taskId: string) {
    return this.request<any[]>(`/panels?taskId=${taskId}`);
  }

  async createPanel(data: {
    taskId: string;
    title: string;
    content: string;
    type?: 'instruction' | 'reference' | 'checklist';
    order?: number;
  }) {
    return this.request<any>('/panels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePanel(panelId: string, data: {
    title?: string;
    content?: string;
    type?: 'instruction' | 'reference' | 'checklist';
    order?: number;
  }) {
    return this.request<any>(`/panels/${panelId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePanel(panelId: string) {
    return this.request<{ success: boolean }>(`/panels/${panelId}`, {
      method: 'DELETE',
    });
  }

  async markPanelAsRead(panelId: string) {
    return this.request<any>(`/panels/${panelId}/read`, {
      method: 'POST',
    });
  }

  // ============================================================
  // WORKORA: ACCOUNTABILITY / ETA TRACKING
  // ============================================================

  async getTaskAccountability(taskId: string) {
    return this.request<any>(`/accountability/task/${taskId}`);
  }

  async getAccountabilityDashboard() {
    return this.request<any>('/accountability/dashboard');
  }

  async getActiveNotification() {
    return this.request<any>('/accountability/active-notification');
  }

  async getTasksRequiringAction() {
    return this.request<any[]>('/accountability/requiring-action');
  }

  async setEta(taskId: string, listId: string, data: {
    eta: string;
    reason?: string;
    syncFromDueDate?: boolean;
  }) {
    await this.guardTaskNotCompleted(taskId, 'set ETA');
    
    const accountability = await this.getTaskAccountability(taskId);
    if (accountability?.currentEta && !accountability.isExpired && !accountability.completedAt) {
      throw new Error('Cannot change ETA before it expires. Complete the task or wait for the current ETA to expire.');
    }
    
    return this.request<any>(`/accountability/task/${taskId}/eta?listId=${listId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async extendEta(taskId: string, data: { newEta: string; reason: string }) {
    await this.guardTaskNotCompleted(taskId, 'extend ETA');
    
    const accountability = await this.getTaskAccountability(taskId);
    if (!accountability?.currentEta) {
      throw new Error('No ETA set. Use "Set ETA" to set an initial deadline.');
    }
    if (!accountability.isExpired) {
      throw new Error('Cannot extend ETA before it expires. Complete the task or wait for expiry.');
    }
    
    return this.request<any>(`/accountability/task/${taskId}/extend`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async postponeEta(taskId: string, data: { newEta: string; reason: string }) {
    return this.extendEta(taskId, data);
  }

  async markTaskComplete(taskId: string, data?: { proofUrl?: string }) {
    return this.request<any>(`/accountability/task/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async syncFromDueDate(taskId: string, listId: string) {
    return this.request<any>(`/accountability/task/${taskId}/sync-due-date?listId=${listId}`, {
      method: 'POST',
    });
  }

  async getAccountabilityHistory(taskId: string) {
    return this.request<any[]>(`/accountability/task/${taskId}/history`);
  }

  // ============================================================
  // WORKORA: SYNC STATUS
  // ============================================================

  async getSyncStatus(taskId?: string | null) {
    return {
      lastSyncAt: new Date().toISOString(),
      status: 'synced' as const,
      errorMessage: null,
      pendingChanges: 0,
      pending: 0,
      failed: 0,
    };
  }

  async triggerSync(taskId?: string | null) {
    return { success: true, syncedAt: new Date().toISOString() };
  }

  async retrySync(taskId?: string | null) {
    return { success: true, syncedAt: new Date().toISOString() };
  }

  // ============================================================
  // WORKORA: AI FEATURES
  // ============================================================

  async extractTasksFromImage(imageBase64: string, listId: string): Promise<{ tasks: ExtractedTaskResult[] }> {
    try {
      const result = await this.request<{ tasks: ExtractedTaskResult[] }>('/ai/extract-tasks', {
        method: 'POST',
        body: JSON.stringify({ image: imageBase64, listId }),
      });
      return result || { tasks: [] };
    } catch (error) {
      console.error('❌ AI Extract from Image - Error:', error);
      throw error;
    }
  }

  async extractTasksFromText(text: string, listId: string): Promise<{ tasks: ExtractedTaskResult[] }> {
    try {
      const result = await this.request<{ tasks: ExtractedTaskResult[] }>('/ai/extract-tasks-text', {
        method: 'POST',
        body: JSON.stringify({ text, listId }),
      });
      return result || { tasks: [] };
    } catch (error) {
      console.error('❌ AI Extract from Text - Error:', error);
      throw error;
    }
  }

  async generateChecklist(taskId: string, taskDescription: string) {
    return this.request<{ checklist: string[] }>('/ai/generate-checklist', {
      method: 'POST',
      body: JSON.stringify({ taskId, description: taskDescription }),
    });
  }

  async suggestEta(taskId: string) {
    return this.request<{
      suggestedEta: string;
      confidence: 'low' | 'medium' | 'high';
      reasoning: string;
    }>('/ai/suggest-eta', {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    });
  }

  async simplifyTask(
    taskId: string,
    listId: string,
    description: string,
    existingChecklist?: string[]
  ) {
    return this.request<{
      success: boolean;
      data: {
        steps: string[];
        generatedAt: string;
      };
    }>('/ai/simplify-task', {
      method: 'POST',
      body: JSON.stringify({ taskId, listId, description, existingChecklist }),
    });
  }

  async getSimplifiedChecklist(taskId: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/ai/simplify/${taskId}`);
  }

  async explainStep(step: string, taskContext?: string) {
    return this.request<{
      success: boolean;
      data: { explanation: string };
    }>('/ai/explain-step', {
      method: 'POST',
      body: JSON.stringify({ step, taskContext }),
    });
  }

  // ============================================================
  // WORKORA: NOTIFICATIONS
  // ============================================================

  async getNotifications(options?: { unreadOnly?: boolean; limit?: number }) {
    const params = new URLSearchParams();
    if (options?.unreadOnly) params.append('unreadOnly', 'true');
    if (options?.limit) params.append('limit', options.limit.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/notifications${query}`);
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request<any>(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<any>('/notifications/read-all', {
      method: 'POST',
    });
  }

  // ============================================================
  // WORKORA: DASHBOARD / ANALYTICS
  // ============================================================

  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  async getProductivityReport(dateRange: { start: string; end: string }) {
    return this.request<any>('/dashboard/productivity', {
      method: 'POST',
      body: JSON.stringify(dateRange),
    });
  }

  // ============================================================
  // WORKORA: HASHTAG SEARCH
  // ============================================================

  async searchHashtags(hashtag: string, options?: { listId?: string; spaceId?: string }) {
    const params = new URLSearchParams({ hashtag });
    if (options?.listId) params.append('listId', options.listId);
    if (options?.spaceId) params.append('spaceId', options.spaceId);

    return this.request<any>(`/search/hashtags?${params.toString()}`);
  }

  async getPopularHashtags(spaceId?: string) {
    const params = spaceId ? `?spaceId=${spaceId}` : '';
    return this.request<any>(`/search/hashtags/popular${params}`);
  }

  // ============================================================
  // WORKORA: TASK ACTIVITIES
  // ============================================================

  async getTaskActivities(
    taskId: string,
    options?: { limit?: number; offset?: number; types?: string[] }
  ) {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    if (options?.types) params.set('types', options.types.join(','));

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any>(`/tasks/${taskId}/activities${query}`);
  }

  async getRecentActivities(options?: { limit?: number; teamId?: string }) {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.teamId) params.set('teamId', options.teamId);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any>(`/activities/recent${query}`);
  }

  async getTaskActivitySummary(taskId: string) {
    return this.request<any>(`/tasks/${taskId}/activities/summary`);
  }
}

export const api = new ApiClient();