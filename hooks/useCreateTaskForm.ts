'use client';

import { useReducer, useCallback } from 'react';

export interface Assignee {
  id: number;
  username: string;
  email: string;
  profilePicture?: string;
}

export interface TaskTag {
  name: string;
  tag_bg: string;
  tag_fg: string;
}

export interface TaskStatus {
  id: string;
  status: string;
  color: string;
  type?: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  completed: boolean;
}

export interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export interface Priority {
  id: string;
  label: string;
  color: string;
  textColor: string;
}

export interface CreateTaskFormState {
  // Basic fields
  taskName: string;
  description: string;
  showDescription: boolean;
  status: TaskStatus | null;
  priority: Priority | null;
  
  // Relationships
  assignees: Assignee[];
  tags: TaskTag[];
  watchers: Assignee[];
  
  // Dates and time
  dueDate: string;
  startDate: string;
  timeEstimate: string;
  
  // Checklists
  checklists: Checklist[];
  newChecklistItem: Record<string, string>;
  
  // UI state
  showTimeEstimateInput: boolean;
  visibleFields: Record<string, boolean>;
  error: string | null;
}

type CreateTaskFormAction =
  | { type: 'SET_TASK_NAME'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'TOGGLE_SHOW_DESCRIPTION' }
  | { type: 'SET_STATUS'; payload: TaskStatus | null }
  | { type: 'SET_PRIORITY'; payload: Priority | null }
  | { type: 'ADD_ASSIGNEE'; payload: Assignee }
  | { type: 'REMOVE_ASSIGNEE'; payload: number }
  | { type: 'ADD_TAG'; payload: TaskTag }
  | { type: 'REMOVE_TAG'; payload: string }
  | { type: 'ADD_WATCHER'; payload: Assignee }
  | { type: 'REMOVE_WATCHER'; payload: number }
  | { type: 'SET_DUE_DATE'; payload: string }
  | { type: 'SET_START_DATE'; payload: string }
  | { type: 'SET_TIME_ESTIMATE'; payload: string }
  | { type: 'ADD_CHECKLIST'; payload: Checklist }
  | { type: 'REMOVE_CHECKLIST'; payload: string }
  | { type: 'ADD_CHECKLIST_ITEM'; payload: { checklistId: string; item: ChecklistItem } }
  | { type: 'REMOVE_CHECKLIST_ITEM'; payload: { checklistId: string; itemId: string } }
  | { type: 'SET_NEW_CHECKLIST_ITEM'; payload: { checklistId: string; value: string } }
  | { type: 'TOGGLE_TIME_ESTIMATE_INPUT' }
  | { type: 'TOGGLE_FIELD_VISIBILITY'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_FORM' };

const initialVisibleFields: Record<string, boolean> = {
  assignee: true,
  dueDate: true,
  priority: true,
  tags: true,
  checklist: false,
  timeEstimate: false,
  startDate: false,
  watchers: false,
  dependencies: false,
  recurring: false,
  attachments: false,
};

const initialState: CreateTaskFormState = {
  taskName: '',
  description: '',
  showDescription: false,
  status: null,
  priority: null,
  assignees: [],
  tags: [],
  watchers: [],
  dueDate: '',
  startDate: '',
  timeEstimate: '',
  checklists: [],
  newChecklistItem: {},
  showTimeEstimateInput: false,
  visibleFields: initialVisibleFields,
  error: null,
};

function formReducer(
  state: CreateTaskFormState,
  action: CreateTaskFormAction
): CreateTaskFormState {
  switch (action.type) {
    case 'SET_TASK_NAME':
      return { ...state, taskName: action.payload, error: null };
    
    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload };
    
    case 'TOGGLE_SHOW_DESCRIPTION':
      return { ...state, showDescription: !state.showDescription };
    
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    
    case 'SET_PRIORITY':
      return { ...state, priority: action.payload };
    
    case 'ADD_ASSIGNEE':
      return {
        ...state,
        assignees: [...state.assignees, action.payload],
      };
    
    case 'REMOVE_ASSIGNEE':
      return {
        ...state,
        assignees: state.assignees.filter(a => a.id !== action.payload),
      };
    
    case 'ADD_TAG':
      return {
        ...state,
        tags: state.tags.some(t => t.name === action.payload.name)
          ? state.tags
          : [...state.tags, action.payload],
      };
    
    case 'REMOVE_TAG':
      return {
        ...state,
        tags: state.tags.filter(t => t.name !== action.payload),
      };
    
    case 'ADD_WATCHER':
      return {
        ...state,
        watchers: [...state.watchers, action.payload],
      };
    
    case 'REMOVE_WATCHER':
      return {
        ...state,
        watchers: state.watchers.filter(w => w.id !== action.payload),
      };
    
    case 'SET_DUE_DATE':
      return { ...state, dueDate: action.payload };
    
    case 'SET_START_DATE':
      return { ...state, startDate: action.payload };
    
    case 'SET_TIME_ESTIMATE':
      return {
        ...state,
        timeEstimate: action.payload,
        visibleFields: { ...state.visibleFields, timeEstimate: true },
      };
    
    case 'ADD_CHECKLIST':
      return {
        ...state,
        checklists: [...state.checklists, action.payload],
        visibleFields: { ...state.visibleFields, checklist: true },
      };
    
    case 'REMOVE_CHECKLIST':
      return {
        ...state,
        checklists: state.checklists.filter(c => c.id !== action.payload),
      };
    
    case 'ADD_CHECKLIST_ITEM':
      return {
        ...state,
        checklists: state.checklists.map(c =>
          c.id === action.payload.checklistId
            ? { ...c, items: [...c.items, action.payload.item] }
            : c
        ),
        newChecklistItem: {
          ...state.newChecklistItem,
          [action.payload.checklistId]: '',
        },
      };
    
    case 'REMOVE_CHECKLIST_ITEM':
      return {
        ...state,
        checklists: state.checklists.map(c =>
          c.id === action.payload.checklistId
            ? { ...c, items: c.items.filter(i => i.id !== action.payload.itemId) }
            : c
        ),
      };
    
    case 'SET_NEW_CHECKLIST_ITEM':
      return {
        ...state,
        newChecklistItem: {
          ...state.newChecklistItem,
          [action.payload.checklistId]: action.payload.value,
        },
      };
    
    case 'TOGGLE_TIME_ESTIMATE_INPUT':
      return { ...state, showTimeEstimateInput: !state.showTimeEstimateInput };
    
    case 'TOGGLE_FIELD_VISIBILITY':
      return {
        ...state,
        visibleFields: {
          ...state.visibleFields,
          [action.payload]: !state.visibleFields[action.payload],
        },
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'RESET_FORM':
      return initialState;
    
    default:
      return state;
  }
}

export function useCreateTaskForm() {
  const [state, dispatch] = useReducer(formReducer, initialState);

  // Task name actions
  const setTaskName = useCallback((name: string) => {
    dispatch({ type: 'SET_TASK_NAME', payload: name });
  }, []);

  const setDescription = useCallback((desc: string) => {
    dispatch({ type: 'SET_DESCRIPTION', payload: desc });
  }, []);

  const toggleShowDescription = useCallback(() => {
    dispatch({ type: 'TOGGLE_SHOW_DESCRIPTION' });
  }, []);

  // Status and priority
  const setStatus = useCallback((status: TaskStatus | null) => {
    dispatch({ type: 'SET_STATUS', payload: status });
  }, []);

  const setPriority = useCallback((priority: Priority | null) => {
    dispatch({ type: 'SET_PRIORITY', payload: priority });
  }, []);

  // Assignees
  const addAssignee = useCallback((assignee: Assignee) => {
    dispatch({ type: 'ADD_ASSIGNEE', payload: assignee });
  }, []);

  const removeAssignee = useCallback((id: number) => {
    dispatch({ type: 'REMOVE_ASSIGNEE', payload: id });
  }, []);

  // Tags
  const addTag = useCallback((tag: TaskTag) => {
    dispatch({ type: 'ADD_TAG', payload: tag });
  }, []);

  const removeTag = useCallback((name: string) => {
    dispatch({ type: 'REMOVE_TAG', payload: name });
  }, []);

  // Watchers
  const addWatcher = useCallback((watcher: Assignee) => {
    dispatch({ type: 'ADD_WATCHER', payload: watcher });
  }, []);

  const removeWatcher = useCallback((id: number) => {
    dispatch({ type: 'REMOVE_WATCHER', payload: id });
  }, []);

  // Dates
  const setDueDate = useCallback((date: string) => {
    dispatch({ type: 'SET_DUE_DATE', payload: date });
  }, []);

  const setStartDate = useCallback((date: string) => {
    dispatch({ type: 'SET_START_DATE', payload: date });
  }, []);

  const setTimeEstimate = useCallback((time: string) => {
    dispatch({ type: 'SET_TIME_ESTIMATE', payload: time });
  }, []);

  // Checklists
  const addChecklist = useCallback((checklist: Checklist) => {
    dispatch({ type: 'ADD_CHECKLIST', payload: checklist });
  }, []);

  const removeChecklist = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_CHECKLIST', payload: id });
  }, []);

  const addChecklistItem = useCallback((checklistId: string, item: ChecklistItem) => {
    dispatch({ type: 'ADD_CHECKLIST_ITEM', payload: { checklistId, item } });
  }, []);

  const removeChecklistItem = useCallback((checklistId: string, itemId: string) => {
    dispatch({ type: 'REMOVE_CHECKLIST_ITEM', payload: { checklistId, itemId } });
  }, []);

  const setNewChecklistItem = useCallback((checklistId: string, value: string) => {
    dispatch({ type: 'SET_NEW_CHECKLIST_ITEM', payload: { checklistId, value } });
  }, []);

  // UI
  const toggleTimeEstimateInput = useCallback(() => {
    dispatch({ type: 'TOGGLE_TIME_ESTIMATE_INPUT' });
  }, []);

  const toggleFieldVisibility = useCallback((field: string) => {
    dispatch({ type: 'TOGGLE_FIELD_VISIBILITY', payload: field });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  return {
    state,
    setTaskName,
    setDescription,
    toggleShowDescription,
    setStatus,
    setPriority,
    addAssignee,
    removeAssignee,
    addTag,
    removeTag,
    addWatcher,
    removeWatcher,
    setDueDate,
    setStartDate,
    setTimeEstimate,
    addChecklist,
    removeChecklist,
    addChecklistItem,
    removeChecklistItem,
    setNewChecklistItem,
    toggleTimeEstimateInput,
    toggleFieldVisibility,
    setError,
    resetForm,
  };
}
