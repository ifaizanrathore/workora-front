'use client';

import React, { useEffect, useState } from 'react';
import { Target, Plus, Loader2, RefreshCw } from 'lucide-react';
import { useGoals } from '@/hooks';
import { useWorkspaceStore, useGoalStore } from '@/stores';
import { GoalCard, GoalDetailModal, CreateGoalModal } from '@/components/goals';
import { EmptyGoals } from '@/components/ui/empty-states';
import type { Goal } from '@/types';

export default function GoalsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const {
    selectedGoal,
    isGoalModalOpen,
    isCreateGoalOpen,
    openGoalModal,
    closeGoalModal,
    openCreateGoal,
    closeCreateGoal,
    setGoals,
  } = useGoalStore();

  const { data: goals, isLoading, error, refetch } = useGoals(currentWorkspace?.id || null);

  useEffect(() => {
    setGoals(goals);
  }, [goals, setGoals]);

  const activeGoals = goals.filter((g) => !g.archived);
  const archivedGoals = goals.filter((g) => g.archived);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-purple-500" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Goals</h1>
          {activeGoals.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
              {activeGoals.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={openCreateGoal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Goal
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-red-500 mb-3">Failed to load goals</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : activeGoals.length === 0 ? (
          <EmptyGoals onAction={openCreateGoal} />
        ) : (
          <div className="space-y-6">
            {/* Active Goals */}
            <div className="grid gap-3">
              {activeGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onClick={() => openGoalModal(goal)}
                />
              ))}
            </div>

            {/* Archived Goals */}
            {archivedGoals.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  Archived ({archivedGoals.length})
                </h2>
                <div className="grid gap-3 opacity-60">
                  {archivedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onClick={() => openGoalModal(goal)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedGoal && (
        <GoalDetailModal
          goalId={selectedGoal.id}
          isOpen={isGoalModalOpen}
          onClose={closeGoalModal}
          onDeleted={refetch}
          onUpdated={refetch}
        />
      )}

      {currentWorkspace && (
        <CreateGoalModal
          teamId={currentWorkspace.id}
          isOpen={isCreateGoalOpen}
          onClose={closeCreateGoal}
          onCreated={refetch}
        />
      )}
    </div>
  );
}
