'use client';

import React from 'react';
import { X, Plus } from 'lucide-react';
import type { Checklist, ChecklistItem } from '@/hooks';

interface ChecklistSectionProps {
  checklists: Checklist[];
  newChecklistItem: Record<string, string>;
  onRemoveChecklist: (id: string) => void;
  onRemoveChecklistItem: (checklistId: string, itemId: string) => void;
  onSetNewChecklistItem: (checklistId: string, value: string) => void;
  onAddChecklistItem: (checklistId: string) => void;
}

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  checklists,
  newChecklistItem,
  onRemoveChecklist,
  onRemoveChecklistItem,
  onSetNewChecklistItem,
  onAddChecklistItem,
}) => {
  if (checklists.length === 0) return null;

  return (
    <div className="space-y-3">
      {checklists.map((checklist) => (
        <div
          key={checklist.id}
          className="border border-gray-200 rounded-xl p-4 bg-gray-50/50"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-sm text-gray-900">
              {checklist.name}
            </span>
            <button
              onClick={() => onRemoveChecklist(checklist.id)}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              aria-label={`Delete ${checklist.name}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {checklist.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 group">
                <div className="w-4 h-4 border-2 border-gray-300 rounded" />
                <span className="text-sm text-gray-600 flex-1">{item.name}</span>
                <button
                  onClick={() => onRemoveChecklistItem(checklist.id, item.id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Delete checklist item: ${item.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <input
              value={newChecklistItem[checklist.id] || ''}
              onChange={(e) =>
                onSetNewChecklistItem(checklist.id, e.target.value)
              }
              placeholder="Add item..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddChecklistItem(checklist.id);
                }
              }}
              aria-label="Checklist item input"
            />
            <button
              onClick={() => onAddChecklistItem(checklist.id)}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              aria-label="Add checklist item"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
