'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  Sparkles,
  Upload,
  Image as ImageIcon,
  MessageSquare,
  Clipboard,
  Check,
  Loader2,
  Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import type { Priority, TaskTag } from '@/hooks';

// API response types for AI extraction
interface ExtractedTaskFromAPI {
  name: string;
  description?: string;
  priority?: number;
  suggestedTags?: string[];
}

interface ExtractedTask {
  name: string;
  description?: string;
  priority?: Priority;
  tags?: TaskTag[];
}

interface AIExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtract: (data: ExtractedTask) => void;
  listId?: string;
}

const priorityOptions: Priority[] = [
  { id: '1', label: 'Urgent', color: 'bg-red-500', textColor: 'text-red-600' },
  { id: '2', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { id: '3', label: 'Normal', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { id: '4', label: 'Low', color: 'bg-gray-400', textColor: 'text-gray-600' },
];

export const AIExtractionModal: React.FC<AIExtractionModalProps> = ({
  isOpen,
  onClose,
  onExtract,
  listId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'image' | 'text'>('image');
  const [aiText, setAiText] = useState('');
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAiText('');
      setAiImage(null);
      setExtractedTasks([]);
      setShowPreview(false);
      setIsExtracting(false);
    }
  }, [isOpen]);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setAiImage(e.target?.result as string);
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

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const clearInput = () => {
    setAiImage(null);
    setAiText('');
    setExtractedTasks([]);
    setShowPreview(false);
  };

  const handleExtract = async () => {
    if (!listId) return;

    setIsExtracting(true);

    try {
      let result;

      if (mode === 'image' && aiImage) {
        const base64 = aiImage.split(',')[1];
        result = await api.extractTasksFromImage(base64, listId);
      } else if (mode === 'text' && aiText.trim()) {
        result = await api.extractTasksFromText(aiText, listId);
      }

      if (result?.tasks && result.tasks.length > 0) {
        // Map API response to our format with proper typing
        const mappedTasks: ExtractedTask[] = result.tasks.map((task: ExtractedTaskFromAPI) => ({
          name: task.name,
          description: task.description,
          priority: task.priority ? priorityOptions.find(p => p.id === task.priority?.toString()) : undefined,
          tags: task.suggestedTags?.map((tag: string) => ({
            name: tag,
            tag_bg: '#5B4FD1',
            tag_fg: '#fff',
          })),
        }));

        setExtractedTasks(mappedTasks);
        setShowPreview(true);
        toast.success(`Found ${mappedTasks.length} task(s)`);
      } else {
        toast.error('No tasks could be extracted. Please try with different content.');
        setExtractedTasks([]);
        setShowPreview(false);
      }
    } catch (error) {
      console.error('Failed to extract tasks:', error);
      toast.error('Failed to extract tasks. Please try again.');
      setExtractedTasks([]);
      setShowPreview(false);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUseTask = (task: ExtractedTask) => {
    onExtract(task);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#ECECEC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-[#6B7280]" strokeWidth={1.5} />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-purple-100">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-[#111827]">AI Task Extraction</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-5 w-5 text-[#9CA3AF]" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Mode Tabs */}
          <div className="flex bg-[#F3F4F6] rounded-lg p-1">
            <button
              onClick={() => setMode('image')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all',
                mode === 'image'
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#111827]'
              )}
            >
              <ImageIcon className="w-4 h-4" />
              From Screenshot
            </button>
            <button
              onClick={() => setMode('text')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all',
                mode === 'text'
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#111827]'
              )}
            >
              <MessageSquare className="w-4 h-4" />
              From Text
            </button>
          </div>

          {/* Image Upload */}
          {mode === 'image' && (
            <div className="space-y-4">
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
                    'relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
                    isDragging
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-[#D1D5DB] hover:border-purple-400 hover:bg-purple-50/50'
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
                  <Upload className="w-10 h-10 mx-auto mb-3 text-[#9CA3AF]" />
                  <p className="text-sm font-medium text-[#6B7280] mb-1">
                    Drop an image, paste from clipboard, or click to upload
                  </p>
                  <p className="text-xs text-[#9CA3AF] mb-3">
                    Screenshots of chats, emails, design mockups, whiteboards, etc.
                  </p>
                  <div className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#D1D5DB] rounded-full text-xs text-[#6B7280]">
                    <Clipboard className="w-3 h-3" />
                    Ctrl+V to paste
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden border border-[#D1D5DB] bg-[#F9FAFB]">
                    <img
                      src={aiImage}
                      alt="Uploaded screenshot"
                      className="w-full max-h-48 object-contain"
                    />
                    <button
                      onClick={clearInput}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-md text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={handleExtract}
                    disabled={isExtracting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5B4FD1] text-white rounded-lg text-sm font-medium hover:bg-[#4A3FB8] disabled:opacity-50 transition-colors"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing image...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Extract Task Details
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Text Input */}
          {mode === 'text' && (
            <div className="space-y-4">
              <textarea
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder={`Paste a chat conversation, email, meeting notes, or describe the task in detail...

Example:
"Hey, can you create a landing page for our new product launch? It should have a hero section, feature highlights, pricing table, and a contact form. Due by Friday. High priority."`}
                className="w-full px-3.5 py-3 border border-[#D1D5DB] rounded-lg text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#5B4FD1] focus:ring-2 focus:ring-[#5B4FD1]/10 resize-none h-40 transition-all"
              />
              <div className="flex gap-2">
                {aiText && (
                  <button
                    onClick={() => setAiText('')}
                    className="px-4 py-2 border border-[#D1D5DB] rounded-lg text-sm text-[#6B7280] hover:bg-gray-50 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={handleExtract}
                  disabled={isExtracting || !aiText.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5B4FD1] text-white rounded-lg text-sm font-medium hover:bg-[#4A3FB8] disabled:opacity-50 transition-colors"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Extract Task Details
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Extracted Tasks Preview */}
          {showPreview && extractedTasks.length > 0 && (
            <div className="pt-4 border-t border-[#ECECEC] space-y-3">
              <p className="text-sm font-medium text-[#111827] flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Found {extractedTasks.length} task(s)
              </p>

              {extractedTasks.map((task, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-[#D1D5DB] bg-white hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[#111827]">{task.name}</p>
                      {task.description && (
                        <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {task.priority && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#D1D5DB] rounded text-xs text-[#6B7280]">
                            <Flag
                              className={cn('w-3 h-3', task.priority.textColor)}
                            />
                            {task.priority.label}
                          </span>
                        )}
                        {task.tags?.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: tag.tag_bg,
                              color: tag.tag_fg,
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUseTask(task)}
                      className="px-3 py-1.5 text-xs font-medium text-[#5B4FD1] border border-[#5B4FD1] rounded-md hover:bg-purple-50 transition-colors flex-shrink-0"
                    >
                      Use This
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F9FAFB] border-t border-[#ECECEC] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#D1D5DB] rounded-lg text-sm font-medium text-[#6B7280] hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIExtractionModal;