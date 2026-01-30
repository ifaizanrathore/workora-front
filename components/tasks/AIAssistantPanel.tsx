'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Image as ImageIcon,
  MessageSquare,
  PenLine,
  Clipboard,
  Loader2,
  Check,
  Flag,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// Types
export interface Priority {
  id: string;
  label: string;
  color: string;
  textColor: string;
}

export interface TaskTag {
  name: string;
  tag_bg: string;
  tag_fg: string;
}

export interface ExtractedTaskData {
  name?: string;
  description?: string;
  priority?: Priority;
  tags?: TaskTag[];
  dueDate?: string;
  timeEstimate?: string;
  checklist?: Array<{ name: string }>;
}

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onExtract: (data: ExtractedTaskData) => void;
  listId?: string;
  currentTaskName?: string;
}

const priorityOptions: Priority[] = [
  { id: '1', label: 'Urgent', color: 'bg-red-500', textColor: 'text-red-600' },
  { id: '2', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { id: '3', label: 'Normal', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { id: '4', label: 'Low', color: 'bg-gray-400', textColor: 'text-gray-600' },
];

type TabType = 'image' | 'text' | 'prompt';

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  isOpen,
  onClose,
  onExtract,
  listId,
  currentTaskName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<TabType>('image');
  const [aiText, setAiText] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiImageBase64, setAiImageBase64] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedTaskData | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Reset when panel closes
  useEffect(() => {
    if (!isOpen) {
      setAiText('');
      setAiPrompt('');
      setAiImage(null);
      setAiImageBase64(null);
      setExtractedData(null);
      setIsExtracting(false);
      setExtractionError(null);
    }
  }, [isOpen]);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAiImage(result);
      // Extract base64 part (remove data:image/...;base64, prefix)
      const base64 = result.split(',')[1];
      setAiImageBase64(base64);
      setExtractedData(null);
      setExtractionError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleImageSelect(file);
    },
    [handleImageSelect]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (!isOpen) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageSelect(file);
            setActiveTab('image');
            break;
          }
        }
      }
    },
    [handleImageSelect, isOpen]
  );

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const clearInput = () => {
    setAiImage(null);
    setAiImageBase64(null);
    setAiText('');
    setAiPrompt('');
    setExtractedData(null);
    setExtractionError(null);
  };

  // Map API response to our ExtractedTaskData format
  const mapApiResponseToExtractedData = (task: any): ExtractedTaskData => {
    let priority: Priority | undefined;
    if (task.priority) {
      const priorityNum = typeof task.priority === 'number' 
        ? task.priority 
        : parseInt(task.priority);
      priority = priorityOptions.find(p => p.id === priorityNum.toString());
    }

    const tags: TaskTag[] | undefined = task.suggestedTags?.map((tagName: string) => ({
      name: tagName,
      tag_bg: '#5B4FD1',
      tag_fg: '#ffffff',
    }));

    return {
      name: task.name || task.title,
      description: task.description || task.summary,
      priority,
      tags: tags?.length ? tags : undefined,
      checklist: task.checklist,
    };
  };

  const handleExtract = async () => {
    setIsExtracting(true);
    setExtractedData(null);
    setExtractionError(null);

    // Use listId if available, otherwise use placeholder (backend doesn't actually use it for extraction)
    const extractionListId = listId || 'default';

    try {
      let result;

      if (activeTab === 'image' && aiImageBase64) {
        // Call POST /ai/extract-tasks with { image: base64, listId }
        result = await api.extractTasksFromImage(aiImageBase64, extractionListId);
      } else if (activeTab === 'text' && aiText.trim()) {
        // Call POST /ai/extract-tasks-text with { text, listId }
        result = await api.extractTasksFromText(aiText.trim(), extractionListId);
      } else if (activeTab === 'prompt' && aiPrompt.trim()) {
        // For prompt, also use text extraction with instruction prefix
        result = await api.extractTasksFromText(
          `Create a task based on this instruction: ${aiPrompt.trim()}`,
          extractionListId
        );
      } else {
        throw new Error('No content to extract');
      }

      // API returns { tasks: [...] }
      if (result?.tasks && result.tasks.length > 0) {
        const extracted = mapApiResponseToExtractedData(result.tasks[0]);
        setExtractedData(extracted);
      } else {
        setExtractionError('No tasks could be extracted from the provided content. Try being more specific.');
      }
    } catch (error: any) {
      console.error('Failed to extract:', error);
      setExtractionError(
        error?.message || 'Failed to extract task details. Please try again.'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApply = () => {
    if (extractedData) {
      onExtract(extractedData);
      setTimeout(() => {
        onClose();
      }, 50);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="border border-[#E8E6FA] rounded-lg bg-gradient-to-br from-[#F9F8FF] to-white overflow-hidden animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6FA]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#5B4FD1]/10">
            <Sparkles className="w-4 h-4 text-[#5B4FD1]" />
          </div>
          <span className="text-sm font-medium text-[#111827]">AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X className="w-4 h-4 text-[#9CA3AF]" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#F3F4F6] mx-4 mt-4 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('image')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all',
            activeTab === 'image'
              ? 'bg-white text-[#111827] shadow-sm'
              : 'text-[#6B7280] hover:text-[#111827]'
          )}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Image
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all',
            activeTab === 'text'
              ? 'bg-white text-[#111827] shadow-sm'
              : 'text-[#6B7280] hover:text-[#111827]'
          )}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Text
        </button>
        <button
          onClick={() => setActiveTab('prompt')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all',
            activeTab === 'prompt'
              ? 'bg-white text-[#111827] shadow-sm'
              : 'text-[#6B7280] hover:text-[#111827]'
          )}
        >
          <PenLine className="w-3.5 h-3.5" />
          Prompt
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Image Tab */}
        {activeTab === 'image' && (
          <div className="space-y-3">
            {!aiImage ? (
              <div
                onDrop={handleFileDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer',
                  isDragging
                    ? 'border-[#5B4FD1] bg-[#5B4FD1]/5'
                    : 'border-[#D1D5DB] hover:border-[#5B4FD1]/50 hover:bg-[#F9F8FF]'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && handleImageSelect(e.target.files[0])
                  }
                  className="hidden"
                />
                <Upload className="w-8 h-8 mx-auto mb-2 text-[#9CA3AF]" />
                <p className="text-sm text-[#6B7280] mb-1">
                  Drop image or click to upload
                </p>
                <div className="inline-flex items-center gap-1 px-2 py-1 border border-[#D1D5DB] rounded-full text-xs text-[#9CA3AF]">
                  <Clipboard className="w-3 h-3" />
                  Ctrl+V to paste
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="rounded-lg overflow-hidden border border-[#D1D5DB] bg-[#F9FAFB]">
                  <img
                    src={aiImage}
                    alt="Uploaded"
                    className="w-full max-h-40 object-contain"
                  />
                </div>
                <button
                  onClick={() => {
                    setAiImage(null);
                    setAiImageBase64(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-md text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Text Tab */}
        {activeTab === 'text' && (
          <textarea
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="Paste chat, email, meeting notes..."
            className="w-full px-3 py-2.5 border border-[#D1D5DB] rounded-lg text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#5B4FD1] focus:ring-2 focus:ring-[#5B4FD1]/10 resize-none h-32 transition-all"
          />
        )}

        {/* Prompt Tab */}
        {activeTab === 'prompt' && (
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder={`Describe the task you want to create...\n\nExample: Create a high priority task for landing page design, assign to the design team, due Friday`}
            className="w-full px-3 py-2.5 border border-[#D1D5DB] rounded-lg text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#5B4FD1] focus:ring-2 focus:ring-[#5B4FD1]/10 resize-none h-32 transition-all"
          />
        )}

        {/* Error Display */}
        {extractionError && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{extractionError}</p>
          </div>
        )}

        {/* Extracted Data Preview */}
        {extractedData && (
          <div className="p-3 rounded-lg border border-[#5B4FD1]/30 bg-[#5B4FD1]/5 space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#5B4FD1] font-medium">
              <Check className="w-3.5 h-3.5" />
              Extracted Data
            </div>
            <div className="space-y-2">
              {extractedData.name && (
                <div>
                  <span className="text-xs text-[#9CA3AF]">Task Name:</span>
                  <p className="text-sm font-medium text-[#111827]">{extractedData.name}</p>
                </div>
              )}
              {extractedData.description && (
                <div>
                  <span className="text-xs text-[#9CA3AF]">Description:</span>
                  <p className="text-xs text-[#6B7280] line-clamp-2">{extractedData.description}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {extractedData.priority && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#D1D5DB] rounded text-xs text-[#6B7280]">
                    <Flag className={cn('w-3 h-3', extractedData.priority.textColor)} />
                    {extractedData.priority.label}
                  </span>
                )}
                {extractedData.tags?.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: tag.tag_bg, color: tag.tag_fg }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
              {extractedData.checklist && extractedData.checklist.length > 0 && (
                <div>
                  <span className="text-xs text-[#9CA3AF]">Checklist ({extractedData.checklist.length} items):</span>
                  <ul className="mt-1 space-y-0.5">
                    {extractedData.checklist.slice(0, 3).map((item, i) => (
                      <li key={i} className="text-xs text-[#6B7280] flex items-center gap-1">
                        <div className="w-3 h-3 border border-[#D1D5DB] rounded" />
                        {item.name}
                      </li>
                    ))}
                    {extractedData.checklist.length > 3 && (
                      <li className="text-xs text-[#9CA3AF]">
                        +{extractedData.checklist.length - 3} more items
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {(aiText || aiImage || aiPrompt) && !extractedData && (
            <button
              onClick={clearInput}
              className="px-3 py-1.5 text-xs text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              Clear
            </button>
          )}
          
          {!extractedData ? (
            <button
              onClick={handleExtract}
              disabled={
                isExtracting ||
                (activeTab === 'image' && !aiImage) ||
                (activeTab === 'text' && !aiText.trim()) ||
                (activeTab === 'prompt' && !aiPrompt.trim())
              }
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5B4FD1] text-white rounded-lg text-sm font-medium hover:bg-[#4A3FB8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Extract & Fill
                </>
              )}
            </button>
          ) : (
            <div className="flex-1 flex gap-2">
              <button
                onClick={clearInput}
                className="px-4 py-2.5 border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#6B7280] hover:bg-gray-50 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleApply}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5B4FD1] text-white rounded-lg text-sm font-medium hover:bg-[#4A3FB8] transition-colors"
              >
                <Check className="w-4 h-4" />
                Apply to Task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPanel;