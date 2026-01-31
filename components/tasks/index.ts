'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task } from '@/types';

// ============================================================
// TASK STORE
// ============================================================

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  isModalOpen: boolean;
  isCreateModalOpen: boolean;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  setSelectedTask: (task: Task | null) => void;
  
  // Modal actions
  openTaskModal: (task: Task) => void;
  closeTaskModal: () => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  selectedTask: null,
  isModalOpen: false,
  isCreateModalOpen: false,
  
  setTasks: (tasks) => set({ tasks }),
  
  addTask: (task) => set((state) => ({ 
    tasks: [task, ...state.tasks] 
  })),
  
  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map((t) => 
      t.id === taskId ? { ...t, ...updates } : t
    ),
    selectedTask: state.selectedTask?.id === taskId 
      ? { ...state.selectedTask, ...updates } 
      : state.selectedTask,
  })),
  
  deleteTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== taskId),
  })),
  
  setSelectedTask: (task) => set({ selectedTask: task }),
  
  openTaskModal: (task) => set({ 
    isModalOpen: true, 
    selectedTask: task 
  }),
  
  closeTaskModal: () => set({ 
    isModalOpen: false, 
    selectedTask: null 
  }),
  
  openCreateModal: () => set({ isCreateModalOpen: true }),
  
  closeCreateModal: () => set({ isCreateModalOpen: false }),
}));

// ============================================================
// WORKSPACE STORE
// ============================================================

interface Workspace {
  id: string;
  name: string;
  color?: string;
  avatar?: string;
}

interface Space {
  id: string;
  name: string;
  color?: string;
  private?: boolean;
}

interface List {
  id: string;
  name: string;
  color?: string;
  taskCount?: number;
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  spaces: Space[];
  currentSpace: Space | null;
  lists: List[];
  currentList: List | null;
  
  // Actions
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setSpaces: (spaces: Space[]) => void;
  setCurrentSpace: (space: Space | null) => void;
  setLists: (lists: List[]) => void;
  setCurrentList: (list: List | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      currentWorkspace: null,
      spaces: [],
      currentSpace: null,
      lists: [],
      currentList: null,
      
      setWorkspaces: (workspaces) => set({ workspaces }),
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      setSpaces: (spaces) => set({ spaces }),
      setCurrentSpace: (space) => set({ currentSpace: space }),
      setLists: (lists) => set({ lists }),
      setCurrentList: (list) => set({ currentList: list }),
    }),
    {
      name: 'workora-workspace',
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
        currentSpace: state.currentSpace,
        currentList: state.currentList,
      }),
    }
  )
);

// ============================================================
// UI STORE
// ============================================================

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'light',
      
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'workora-ui',
    }
  )
);