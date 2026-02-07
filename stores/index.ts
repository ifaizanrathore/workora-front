import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Workspace, Space, Folder, List, Task, PanelType, Goal } from '@/types';

// Auth Store - no persist to avoid hydration loops
interface AuthState { 
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}));

// Workspace Store
interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  spaces: Space[];
  currentSpace: Space | null;
  folders: Folder[];
  lists: List[];
  currentList: List | null;
  isLoading: boolean;
  
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setSpaces: (spaces: Space[]) => void;
  setCurrentSpace: (space: Space | null) => void;
  setFolders: (folders: Folder[]) => void;
  setLists: (lists: List[]) => void;
  setCurrentList: (list: List | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      currentWorkspace: null,
      spaces: [],
      currentSpace: null,
      folders: [],
      lists: [],
      currentList: null,
      isLoading: false,
      
      setWorkspaces: (workspaces) => set({ workspaces }),
      setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
      setSpaces: (spaces) => set({ spaces }),
      setCurrentSpace: (currentSpace) => set({ currentSpace }),
      setFolders: (folders) => set({ folders }),
      setLists: (lists) => set({ lists }),
      setCurrentList: (currentList) => set({ currentList }),
      setLoading: (isLoading) => set({ isLoading }),
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

// Task Store
interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  isModalOpen: boolean;
  isCreateModalOpen: boolean;
  filters: {
    status: string[];
    priority: string[];
    assignee: string[];
    tags: string[];
    search: string;
  };
  sortBy: 'priority' | 'dueDate' | 'name' | 'status';
  sortDirection: 'asc' | 'desc';
  viewMode: 'list' | 'board';
  groupBy: 'status' | 'priority' | 'assignee' | 'none';
  
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  setSelectedTask: (task: Task | null) => void;
  openTaskModal: (task: Task) => void;
  closeTaskModal: () => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  setFilters: (filters: Partial<TaskState['filters']>) => void;
  clearFilters: () => void;
  setSortBy: (sortBy: TaskState['sortBy']) => void;
  setSortDirection: (direction: TaskState['sortDirection']) => void;
  setViewMode: (mode: TaskState['viewMode']) => void;
  setGroupBy: (groupBy: TaskState['groupBy']) => void;
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  selectedTask: null,
  isModalOpen: false,
  isCreateModalOpen: false,
  filters: {
    status: [],
    priority: [],
    assignee: [],
    tags: [],
    search: '',
  },
  sortBy: 'priority',
  sortDirection: 'asc',
  viewMode: 'list',
  groupBy: 'status',
  
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
      selectedTask:
        state.selectedTask?.id === taskId
          ? { ...state.selectedTask, ...updates }
          : state.selectedTask,
    })),
  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      selectedTask: state.selectedTask?.id === taskId ? null : state.selectedTask,
      isModalOpen: state.selectedTask?.id === taskId ? false : state.isModalOpen,
    })),
  setSelectedTask: (selectedTask) => set({ selectedTask }),
  openTaskModal: (task) => set({ selectedTask: task, isModalOpen: true }),
  closeTaskModal: () => set({ isModalOpen: false }),
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () =>
    set({
      filters: {
        status: [],
        priority: [],
        assignee: [],
        tags: [],
        search: '',
      },
    }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortDirection: (sortDirection) => set({ sortDirection }),
  setViewMode: (viewMode) => set({ viewMode }),
  setGroupBy: (groupBy) => set({ groupBy }),
}));

// UI Store
interface UIState {
  sidebarOpen: boolean;
  sidebarWidth: number;
  activePanel: PanelType;
  isPanelOpen: boolean;
  searchOpen: boolean;
  commandPaletteOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setActivePanel: (panel: PanelType) => void;
  togglePanel: () => void;
  openPanel: (panel: PanelType) => void;
  closePanel: () => void;
  setSearchOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setTheme: (theme: UIState['theme']) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarWidth: 240,
      activePanel: 'activity',
      isPanelOpen: true,
      searchOpen: false,
      commandPaletteOpen: false,
      theme: 'light',
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
      setActivePanel: (activePanel) => set({ activePanel, isPanelOpen: true }),
      togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
      openPanel: (panel) => set({ activePanel: panel, isPanelOpen: true }),
      closePanel: () => set({ isPanelOpen: false }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'workora-ui',
    }
  )
);

// Timer Store
interface TimerState {
  activeTaskId: string | null;
  startTime: number | null;
  elapsedTime: number;
  isRunning: boolean;
  
  startTimer: (taskId: string) => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
}

export const useTimerStore = create<TimerState>()((set, get) => ({
  activeTaskId: null,
  startTime: null,
  elapsedTime: 0,
  isRunning: false,
  
  startTimer: (taskId) =>
    set({
      activeTaskId: taskId,
      startTime: Date.now(),
      elapsedTime: 0,
      isRunning: true,
    }),
  stopTimer: () =>
    set({
      isRunning: false,
    }),
  resetTimer: () =>
    set({
      activeTaskId: null,
      startTime: null,
      elapsedTime: 0,
      isRunning: false,
    }),
  tick: () => {
    const { startTime, isRunning } = get();
    if (isRunning && startTime) {
      set({ elapsedTime: Date.now() - startTime });
    }
  },
}));

// Goal Store
interface GoalState {
  goals: Goal[];
  selectedGoal: Goal | null;
  isGoalModalOpen: boolean;
  isCreateGoalOpen: boolean;

  setGoals: (goals: Goal[]) => void;
  setSelectedGoal: (goal: Goal | null) => void;
  openGoalModal: (goal: Goal) => void;
  closeGoalModal: () => void;
  openCreateGoal: () => void;
  closeCreateGoal: () => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  removeGoal: (goalId: string) => void;
}

export const useGoalStore = create<GoalState>()((set) => ({
  goals: [],
  selectedGoal: null,
  isGoalModalOpen: false,
  isCreateGoalOpen: false,

  setGoals: (goals) => set({ goals }),
  setSelectedGoal: (selectedGoal) => set({ selectedGoal }),
  openGoalModal: (goal) => set({ selectedGoal: goal, isGoalModalOpen: true }),
  closeGoalModal: () => set({ isGoalModalOpen: false }),
  openCreateGoal: () => set({ isCreateGoalOpen: true }),
  closeCreateGoal: () => set({ isCreateGoalOpen: false }),
  updateGoal: (goalId, updates) =>
    set((state) => ({
      goals: state.goals.map((g) => (g.id === goalId ? { ...g, ...updates } : g)),
      selectedGoal:
        state.selectedGoal?.id === goalId
          ? { ...state.selectedGoal, ...updates }
          : state.selectedGoal,
    })),
  removeGoal: (goalId) =>
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== goalId),
      selectedGoal: state.selectedGoal?.id === goalId ? null : state.selectedGoal,
    })),
}));
