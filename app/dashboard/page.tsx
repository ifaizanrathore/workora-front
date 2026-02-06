'use client';

import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { TaskList } from '@/components/tasks/TaskList';
import { useTaskStore, useWorkspaceStore } from '@/stores';
import { api } from '@/lib/api';
import { ListTree } from 'lucide-react';
import { SkeletonTaskList } from '@/components/ui/skeleton';

// Lazy load heavy modal components for better performance
const CreateTaskModal = lazy(() => import('@/components/tasks/CreateTaskModal').then(m => ({ default: m.CreateTaskModal })));
const TaskDetailModal = lazy(() => import('@/components/tasks/TaskDetailModal').then(m => ({ default: m.TaskDetailModal })));

// Modal loading fallback
const ModalLoadingFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-600 dark:text-gray-300">Loading...</span>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { tasks, setTasks, isModalOpen, isCreateModalOpen, openCreateModal } = useTaskStore();
  const { 
    currentList, 
    currentWorkspace, 
    currentSpace, 
    setCurrentWorkspace,
    setCurrentSpace, 
    setCurrentList, 
    setLists, 
    setSpaces 
  } = useWorkspaceStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!currentList?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedTasks = await api.getTasks(currentList.id);
      setTasks(fetchedTasks);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [currentList?.id, setTasks]);

  // Initialize: First fetch workspaces if not set
  useEffect(() => {
    const initWorkspaces = async () => {
      if (currentWorkspace?.id) return;

      try {
        const workspaces = await api.getWorkspaces();
        
        if (workspaces && workspaces.length > 0) {
          setCurrentWorkspace(workspaces[0] as any);
        }
      } catch (err) {
        console.error('Failed to fetch workspaces:', err);
      }
    };

    initWorkspaces();
  }, []);

  // Initialize workspace data (spaces, lists) when workspace is set
  useEffect(() => {
    let isCancelled = false;
    
    const initializeWorkspace = async () => {
      if (!currentWorkspace?.id) return;
      
      setIsInitializing(true);
      
      try {
        const spaces = await api.getSpaces(currentWorkspace.id);
        if (isCancelled) return;
        
        setSpaces(spaces);
        
        if (spaces && spaces.length > 0) {
          const spaceToUse = spaces[0];
          setCurrentSpace(spaceToUse);
          
          const lists = await api.getFolderlessLists(spaceToUse.id);
          if (isCancelled) return;
          
          setLists(lists);
          
          if (lists && lists.length > 0) {
            setCurrentList(lists[0]);
          }
        }
      } catch (err) {
        console.error('Failed to initialize workspace:', err);
      } finally {
        if (!isCancelled) {
          setIsInitializing(false);
        }
      }
    };

    initializeWorkspace();
    
    return () => {
      isCancelled = true;
    };
  }, [currentWorkspace?.id, setSpaces, setCurrentSpace, setLists, setCurrentList]);

  // Fetch tasks when list changes
  useEffect(() => {
    if (currentList?.id) {
      fetchTasks();
    }
  }, [currentList?.id, fetchTasks]);

  // Show loading while initializing
  if (isInitializing && !currentList) {
    return (
      <div className="h-full flex flex-col bg-[#F8F9FB] dark:bg-gray-900">
        {/* Skeleton Header */}
        <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-[#ECEDF0] dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-6 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
        {/* Skeleton Task List */}
        <div className="flex-1 overflow-hidden">
          <SkeletonTaskList rows={8} />
        </div>
      </div>
    );
  }

  // Show empty state if no list
  if (!currentList && !isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#F8F9FB] dark:bg-gray-900">
        <div className="w-20 h-20 rounded-full bg-[#F3F0FF] dark:bg-purple-900/30 flex items-center justify-center mb-6">
          <ListTree className="h-10 w-10 text-[#7C3AED] dark:text-purple-400" />
        </div>
        <h2 className="text-xl font-semibold text-[#1A1A2E] dark:text-white mb-2">No list selected</h2>
        <p className="text-[#8C8C9A] dark:text-gray-400 text-sm mb-6 text-center max-w-md">
          Select a list from the sidebar to view tasks, or create a new list in your ClickUp workspace.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg text-sm font-medium hover:bg-[#6D28D9] transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] dark:bg-gray-900">
      {/* List Header */}
      <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-[#ECEDF0] dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[#1A1A2E] dark:text-white">
              {currentList?.name || 'Tasks'}
            </h1>
            <span className="px-2.5 py-1 bg-[#F3F4F6] dark:bg-gray-800 text-[#6B7280] dark:text-gray-400 text-sm font-medium rounded-md">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchTasks}
              className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg text-sm font-medium hover:bg-[#6D28D9] transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <TaskList 
            tasks={tasks} 
            isLoading={isLoading}
            listId={currentList?.id}
            workspaceId={currentWorkspace?.id}
            listName={currentList?.name}
            onTaskUpdate={fetchTasks}
            onAddTask={openCreateModal}
          />
        )}
      </div>

      {/* Modals - Lazy loaded with Suspense */}
      <Suspense fallback={<ModalLoadingFallback />}>
        {isCreateModalOpen && <CreateTaskModal />}
        {isModalOpen && <TaskDetailModal />}
      </Suspense>
    </div>
  );
}