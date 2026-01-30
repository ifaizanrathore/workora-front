'use client';

import React, { useEffect, useState } from 'react';
import { TaskList } from '@/components/tasks/TaskList';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { useTaskStore, useWorkspaceStore } from '@/stores';
import { api } from '@/lib/api';
import { Loader2, ListTree, Plus } from 'lucide-react';

export default function DashboardPage() {
  const { tasks, setTasks, isModalOpen, isCreateModalOpen, openCreateModal } = useTaskStore();
  const { currentList, currentWorkspace, currentSpace, setCurrentSpace, setCurrentList, setLists, setSpaces } = useWorkspaceStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize workspace data
  useEffect(() => {
    if (currentWorkspace?.id) {
      initializeWorkspace();
    }
  }, [currentWorkspace?.id]);

  // Fetch tasks when list changes
  useEffect(() => {
    if (currentList?.id) {
      fetchTasks();
    }
  }, [currentList?.id]);

  const initializeWorkspace = async () => {
    if (!currentWorkspace?.id) return;
    
    setIsInitializing(true);
    try {
      // Get spaces
      const spaces = await api.getSpaces(currentWorkspace.id);
      setSpaces(spaces);
      
      if (spaces && spaces.length > 0) {
        // Set first space as current
        const firstSpace = spaces[0];
        setCurrentSpace(firstSpace);
        
        // Get lists from first space
        const lists = await api.getFolderlessLists(firstSpace.id);
        setLists(lists);
        
        // Auto-select first list
        if (lists && lists.length > 0) {
          setCurrentList(lists[0]);
        }
      }
    } catch (err) {
      console.error('Failed to initialize workspace:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  const fetchTasks = async () => {
    if (!currentList?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedTasks = await api.getTasks(currentList.id);
      setTasks(fetchedTasks);
    } catch (err: any) {
      console.error('Failed to fetch tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while initializing
  if (isInitializing && !currentList) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#F8F9FB]">
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED] mb-4" />
        <p className="text-[#5C5C6D] text-sm">Loading your workspace...</p>
      </div>
    );
  }

  // Show empty state if no list
  if (!currentList && !isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#F8F9FB]">
        <div className="w-20 h-20 rounded-full bg-[#F3F0FF] flex items-center justify-center mb-6">
          <ListTree className="h-10 w-10 text-[#7C3AED]" />
        </div>
        <h2 className="text-xl font-semibold text-[#1A1A2E] mb-2">No list selected</h2>
        <p className="text-[#8C8C9A] text-sm mb-6 text-center max-w-md">
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
    <div className="h-full flex flex-col bg-[#F8F9FB]">
      {/* List Header */}
      <div className="px-6 py-4 bg-white border-b border-[#ECEDF0]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[#1A1A2E]">
              {currentList?.name || 'Tasks'}
            </h1>
            <span className="px-2.5 py-1 bg-[#F3F4F6] text-[#6B7280] text-sm font-medium rounded-md">
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
          <TaskList tasks={tasks} isLoading={isLoading} />
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && <CreateTaskModal />}
      {isModalOpen && <TaskDetailModal />}
    </div>
  );
}