'use client';

import React, { useState } from 'react';
import { Plus, CheckSquare, ListTodo, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskItemsTabsProps {
  taskId: string;
  listId: string;
}

type TabType = 'subtasks' | 'checklist' | 'actions';

export const TaskItemsTabs: React.FC<TaskItemsTabsProps> = ({ taskId, listId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('subtasks');

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'subtasks', label: 'Subtasks', icon: <ListTodo className="h-3.5 w-3.5" /> },
    { id: 'checklist', label: 'Checklist', icon: <CheckSquare className="h-3.5 w-3.5" /> },
    { id: 'actions', label: 'Actions', icon: <Zap className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="border-t border-[#ECEDF0] pt-4">
      {/* Tab Headers */}
      <div className="flex items-center gap-1 mb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-[#F3F0FF] text-[#7C3AED]'
                : 'text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F5F5F7]'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[100px]">
        {activeTab === 'subtasks' && (
          <div className="space-y-2">
            <button className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#9CA3AF] hover:text-[#7C3AED] hover:bg-[#F5F5F7] rounded-lg transition-colors">
              <Plus className="h-4 w-4" />
              <span>Add subtask</span>
            </button>
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="space-y-2">
            <button className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#9CA3AF] hover:text-[#7C3AED] hover:bg-[#F5F5F7] rounded-lg transition-colors">
              <Plus className="h-4 w-4" />
              <span>Add checklist item</span>
            </button>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-2">
            <button className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#9CA3AF] hover:text-[#7C3AED] hover:bg-[#F5F5F7] rounded-lg transition-colors">
              <Plus className="h-4 w-4" />
              <span>Add action</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItemsTabs;
