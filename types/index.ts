// User types
export interface User {
  id: string | number;
  email: string;
  username: string;
  color?: string;
  profilePicture?: string;
  initials?: string;
  clickupId?: string;
}

// Workspace types
export interface Workspace {
  id: string;
  name: string;
  color?: string;
  avatar?: string;
  members?: WorkspaceMember[];
}

export interface WorkspaceMember {
  user: User;
  role: string;
}

// Space types
export interface Space {
  id: string;
  name: string;
  private: boolean;
  color?: string;
  avatar?: string;
  statuses?: Status[];
  features?: SpaceFeatures;
}

export interface SpaceFeatures {
  due_dates: boolean;
  time_tracking: boolean;
  tags: boolean;
  checklists: boolean;
  custom_fields: boolean;
  priorities: boolean;
}

// Folder types
export interface Folder {
  id: string;
  name: string;
  orderindex: number;
  hidden: boolean;
  space: { id: string; name: string };
  lists: List[];
}

// List types
export interface List {
  id: string;
  name: string;
  orderindex: number;
  status?: Status;
  priority?: Priority;
  assignee?: User;
  folder?: { id: string; name: string; hidden: boolean };
  space?: { id: string; name: string };
  taskCount?: number;
}

// Status types
export interface Status {
  id?: string;
  status: string;
  color: string;
  orderindex?: number;
  type?: 'open' | 'custom' | 'closed' | string;
}

// Priority types
export interface Priority {
  id: string;
  priority: string | null;
  color: string;
  orderindex?: string;
}

// Task types - using snake_case to match API
export interface Task {
  id: string;
  custom_id?: string;
  name: string;
  description?: string;
  text_content?: string;
  status: Status;
  priority?: Priority;
  orderindex?: string;
  date_created: string;
  date_updated: string;
  date_closed?: string;
  date_done?: string;
  due_date?: string;
  start_date?: string;
  time_estimate?: number;
  time_spent?: number;
  creator: User;
  assignees: User[];
  watchers?: User[];
  checklists?: Checklist[];
  tags: Tag[];
  custom_fields?: CustomField[];
  list?: { id: string; name: string };
  folder?: { id: string; name: string };
  space?: { id: string; name: string };
  url?: string;
  linked_tasks?: LinkedTask[];
  parent?: string;
  subtasks?: Task[];
  attachments?: Attachment[];
}

export interface LinkedTask {
  task_id: string;
  link_id: string;
  date_created: string;
  task?: Task;
}

// Checklist types
export interface Checklist {
  id: string;
  name: string;
  orderindex?: number;
  resolved?: number;
  unresolved?: number;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  name: string;
  orderindex?: number;
  resolved: boolean;
  assignee?: User;
  due_date?: string;
  parent?: string;
  children?: ChecklistItem[];
}

// Tag types - using snake_case to match API
export interface Tag {
  name: string;
  tag_fg?: string;
  tag_bg?: string;
  creator?: number;
   color?: string; 
}

// Custom field types
export interface CustomField {
  id: string;
  name: string;
  type: CustomFieldType;
  type_config?: Record<string, unknown>;
  date_created?: string;
  hide_from_guests?: boolean;
  required?: boolean;
  value?: unknown;
}

export type CustomFieldType =
  | 'drop_down'
  | 'text'
  | 'date'
  | 'text_area'
  | 'number'
  | 'labels'
  | 'checkbox'
  | 'assignee'
  | 'watcher'
  | 'responsible'
  | 'dependency_task'
  | 'recurring_task'
  | 'due_date';

// Comment types
export interface Comment {
  id: string;
  text: string;
  text_content?: string;
  parent_id?: string;
  user: User;
  resolved: boolean;
  assignee?: User;
  assigned_by?: User;
  reactions?: Reaction[];
  date_created: string;
  replies?: Comment[];
  attachments?: Attachment[];
}

export interface Reaction {
  emoji: string;
  users: User[];
}

// Attachment types
export interface Attachment {
  id: string;
  title: string;
  url: string;
  url_w_thumbnail?: string;
  thumbnail_small?: string;
  thumbnail_medium?: string;
  thumbnail_large?: string;
  extension: string;
  size: number;
  date_created: string;
  user?: User;
  type?: string;
}

// Time tracking types
export interface TimeEntry {
  id: string;
  task?: { id: string; name: string };
  user: User;
  start: string;
  end?: string;
  duration: number;
  description?: string;
  billable?: boolean;
  tags?: Tag[];
}

export interface RunningTimer {
  id: string;
  task: { id: string; name: string };
  user: User;
  start: string;
  duration: number;
}

// Accountability types
export interface TaskAccountability {
  id: string;
  taskId: string;
  userId: string;
  listId: string;
  etaSetAt?: string;
  etaDeadline?: string;
  graceDeadline?: string;
  originalEta?: number;
  currentEta?: number;
  gracePeriod?: number;
  extensions: ETAExtension[];
  strikes: number;
  maxStrikes: number;
  status: AccountabilityStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ETAExtension {
  id: string;
  reason: string;
  additionalTime: number;
  requestedAt: string;
  originalDeadline: string;
  newDeadline: string;
  strikeApplied: boolean;
}

export type AccountabilityStatus =
  | 'not_set'
  | 'active'
  | 'grace_period'
  | 'overdue'
  | 'completed'
  | 'failed';

// Panel types
export type PanelType =
  | 'activity'
  | 'discussion'
  | 'comments'
  | 'eta'
  | 'tags'
  | 'links';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  user: User;
  field?: string;
  before?: unknown;
  after?: unknown;
  comment?: string;
  date_created: string;
}

export type ActivityType =
  | 'task_created'
  | 'status_changed'
  | 'assignee_added'
  | 'assignee_removed'
  | 'due_date_changed'
  | 'priority_changed'
  | 'comment_added'
  | 'attachment_added'
  | 'checklist_added'
  | 'checklist_item_resolved';

// Discussion/Chat types
export interface DiscussionMessage {
  id: string;
  text: string;
  user: User;
  attachments?: Attachment[];
  mentions?: User[];
  tags?: Tag[];
  date_created: string;
  isOwn?: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Filter types
export interface TaskFilters {
  status?: string[];
  priority?: string[];
  assignee?: string[];
  tags?: string[];
  dueDate?: {
    from?: string;
    to?: string;
  };
  search?: string;
}

// Sort types
export interface TaskSort {
  field: 'name' | 'due_date' | 'priority' | 'status' | 'date_created' | 'date_updated';
  direction: 'asc' | 'desc';
}

// Create/Update types
export interface CreateTaskInput {
  name: string;
  description?: string;
  status?: string;
  priority?: number;
  due_date?: number;
  start_date?: number;
  time_estimate?: number;
  assignees?: number[];
  tags?: string[];
  custom_fields?: { id: string; value: unknown }[];
  listId: string;
  parent?: string;
}

export interface UpdateTaskInput {
  name?: string;
  description?: string;
  status?: string;
  priority?: number;
  due_date?: number;
  start_date?: number;
  time_estimate?: number;
  assignees?: { add?: number[]; rem?: number[] };
  parent?: string;
}

export interface CreateCommentInput {
  text: string;
  assignee?: number;
  notify_all?: boolean;
}

// Sync status types
export interface SyncStatus {
  lastSyncAt: string;
  status: 'synced' | 'syncing' | 'error' | 'pending';
  pending: number;
  failed: number;
}