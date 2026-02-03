'use client';

import React, { useEffect } from 'react';
import { useTasks } from '@/hooks';
import { useWorkspaceStore, useTaskStore } from '@/stores';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { Task } from '@/types'; 

export default function HomePage() {
  const { currentList } = useWorkspaceStore();
  const { setTasks, isModalOpen, isCreateModalOpen } = useTaskStore();

  // Fetch tasks for current list (single argument)
  const { data: tasks, isLoading } = useTasks(currentList?.id);

  // Update store when tasks load
  useEffect(() => {
    if (tasks) {
      setTasks(tasks);
    }
  }, [tasks, setTasks]);

  return (
    <div className="h-full">
      <TaskList tasks={tasks || []} isLoading={isLoading} />
      {isModalOpen && <TaskDetailModal />}
      {isCreateModalOpen && <CreateTaskModal />}
    </div>
  );
}