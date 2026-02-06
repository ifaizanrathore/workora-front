'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Copy,
  Check,
  ListChecks,
  FileText,
  Zap,
  Tags,
  Plus,
  CheckSquare,
  GitBranch,
  X,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { Task } from '@/types';
import { useTaskStore } from '@/stores';
import toast from 'react-hot-toast';

// ============================================================
// TYPES
// ============================================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actionable?: ActionableData;
}

interface ActionableData {
  type: 'subtasks' | 'checklist' | 'description';
  items?: Array<{ name: string; selected: boolean }>;
  description?: string;
}

interface AIPanelProps {
  taskId: string;
  listId: string;
  task: Task | null;
  onTaskUpdate?: () => void;
}

// ============================================================
// QUICK PROMPTS (Task-scoped)
// ============================================================

const QUICK_PROMPTS = [
  {
    icon: GitBranch,
    label: 'Break into subtasks',
    prompt: 'Analyze this task and break it down into smaller, actionable subtasks. Return them as a JSON code block with format: ```json\n{"subtasks": ["subtask 1", "subtask 2", ...]}\n```',
  },
  {
    icon: CheckSquare,
    label: 'Generate checklist',
    prompt: 'Create a detailed checklist for this task with step-by-step items. Return them as a JSON code block with format: ```json\n{"checklist": ["step 1", "step 2", ...]}\n```',
  },
  {
    icon: FileText,
    label: 'Improve description',
    prompt: 'Write a detailed, well-structured description for this task including context, acceptance criteria, and any relevant details. Return it as a JSON code block with format: ```json\n{"description": "the improved description here"}\n```',
  },
  {
    icon: Tags,
    label: 'Suggest priority & tags',
    prompt: 'Based on the task details, suggest an appropriate priority level (1=urgent, 2=high, 3=normal, 4=low) and relevant tags. Explain your reasoning.',
  },
];

// ============================================================
// AI PANEL COMPONENT
// ============================================================

export const AIPanel: React.FC<AIPanelProps> = ({ taskId, listId, task, onTaskUpdate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creatingItems, setCreatingItems] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { updateTask } = useTaskStore();

  // Build task-specific context
  const taskContext = useMemo(() => {
    if (!task) return '';

    const parts: string[] = [];
    parts.push(`Task: "${task.name}"`);
    if (task.description) parts.push(`Description: ${task.description}`);
    if (task.status?.status) parts.push(`Status: ${task.status.status}`);
    if (task.priority?.priority) parts.push(`Priority: ${task.priority.priority}`);
    if (task.assignees?.length) {
      parts.push(`Assignees: ${task.assignees.map(a => a.username || a.email).join(', ')}`);
    }
    if (task.due_date) {
      parts.push(`Due date: ${new Date(Number(task.due_date)).toLocaleDateString()}`);
    }
    if (task.tags?.length) {
      parts.push(`Tags: ${task.tags.map(t => t.name).join(', ')}`);
    }
    if (task.checklists?.length) {
      const items = task.checklists.flatMap(c => c.items || []);
      const resolved = items.filter(i => i.resolved).length;
      parts.push(`Checklists: ${resolved}/${items.length} items completed`);
      parts.push(`Checklist items: ${items.map(i => `${i.resolved ? '[x]' : '[ ]'} ${i.name}`).join(', ')}`);
    }

    return parts.join('\n');
  }, [task]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  // Parse actionable JSON from AI response
  const parseActionable = useCallback((content: string): ActionableData | undefined => {
    const jsonMatch = content.match(/```json\s*\n([\s\S]*?)\n```/);
    if (!jsonMatch) return undefined;

    try {
      const parsed = JSON.parse(jsonMatch[1]);

      if (parsed.subtasks && Array.isArray(parsed.subtasks)) {
        return {
          type: 'subtasks',
          items: parsed.subtasks.map((s: string) => ({ name: s, selected: true })),
        };
      }
      if (parsed.checklist && Array.isArray(parsed.checklist)) {
        return {
          type: 'checklist',
          items: parsed.checklist.map((s: string) => ({ name: s, selected: true })),
        };
      }
      if (parsed.description && typeof parsed.description === 'string') {
        return {
          type: 'description',
          description: parsed.description,
        };
      }
    } catch {
      // Not valid JSON, return undefined
    }
    return undefined;
  }, []);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const data = await api.aiChat(chatHistory, taskContext);

      const actionable = parseActionable(data.content);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
        actionable,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message || 'Something went wrong. Please try again.'}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, taskContext, parseActionable]);

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Copy message
  const handleCopy = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Toggle item selection
  const toggleItem = useCallback((msgId: string, itemIndex: number) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== msgId || !msg.actionable?.items) return msg;
      const newItems = [...msg.actionable.items];
      newItems[itemIndex] = { ...newItems[itemIndex], selected: !newItems[itemIndex].selected };
      return { ...msg, actionable: { ...msg.actionable, items: newItems } };
    }));
  }, []);

  // Create subtasks from AI suggestion
  const handleCreateSubtasks = useCallback(async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg?.actionable?.items) return;

    const selected = msg.actionable.items.filter(i => i.selected);
    if (selected.length === 0) {
      toast.error('Select at least one subtask');
      return;
    }

    setCreatingItems(msgId);
    let created = 0;

    try {
      for (const item of selected) {
        await api.createSubtask(taskId, listId, { name: item.name });
        created++;
      }
      toast.success(`Created ${created} subtask${created !== 1 ? 's' : ''}`);
      onTaskUpdate?.();
    } catch (err: any) {
      toast.error(`Created ${created} subtasks, but failed: ${err.message}`);
    } finally {
      setCreatingItems(null);
    }
  }, [messages, taskId, listId, onTaskUpdate]);

  // Create checklist from AI suggestion
  const handleCreateChecklist = useCallback(async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg?.actionable?.items) return;

    const selected = msg.actionable.items.filter(i => i.selected);
    if (selected.length === 0) {
      toast.error('Select at least one item');
      return;
    }

    setCreatingItems(msgId);

    try {
      const checklist = await api.addChecklist(taskId, 'AI Generated Checklist');
      const checklistId = checklist?.id;
      if (!checklistId) throw new Error('Failed to create checklist');

      for (const item of selected) {
        await api.addChecklistItem(checklistId, item.name);
      }
      toast.success(`Created checklist with ${selected.length} items`);
      onTaskUpdate?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create checklist');
    } finally {
      setCreatingItems(null);
    }
  }, [messages, taskId, onTaskUpdate]);

  // Apply description from AI suggestion
  const handleApplyDescription = useCallback(async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg?.actionable?.description) return;

    setCreatingItems(msgId);

    try {
      await api.updateTask(taskId, { description: msg.actionable.description });
      updateTask(taskId, { description: msg.actionable.description } as any);
      toast.success('Description updated');
      onTaskUpdate?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update description');
    } finally {
      setCreatingItems(null);
    }
  }, [messages, taskId, updateTask, onTaskUpdate]);

  // Render markdown-lite
  const renderContent = (content: string) => {
    // Remove JSON code blocks from display (they're shown as actionable UI)
    const cleaned = content.replace(/```json\s*\n[\s\S]*?\n```/g, '').trim();
    const lines = cleaned.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let codeBlockIndex = 0;

    lines.forEach((line, i) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${codeBlockIndex}`} className="bg-[#1A1A2E] dark:bg-gray-950 text-green-400 text-xs rounded-lg p-3 my-2 overflow-x-auto font-mono">
              <code>{codeContent.trim()}</code>
            </pre>
          );
          codeContent = '';
          inCodeBlock = false;
          codeBlockIndex++;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }

      // Bold text + inline code
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const rendered = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-semibold text-[#1A1A2E] dark:text-white">{part.slice(2, -2)}</strong>;
        }
        const codeParts = part.split(/(`[^`]+`)/g);
        return codeParts.map((cp, k) => {
          if (cp.startsWith('`') && cp.endsWith('`')) {
            return <code key={`${j}-${k}`} className="bg-[#F3F4F6] dark:bg-gray-800 text-[#6E62E5] px-1 py-0.5 rounded text-xs font-mono">{cp.slice(1, -1)}</code>;
          }
          return cp;
        });
      });

      if (line.match(/^[\s]*[-•]\s/)) {
        elements.push(
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-[#6E62E5] mt-0.5">•</span>
            <span>{rendered}</span>
          </div>
        );
      } else if (line.match(/^\d+\.\s/)) {
        const num = line.match(/^(\d+)\./)?.[1];
        const text = line.replace(/^\d+\.\s*/, '');
        const textParts = text.split(/(\*\*.*?\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-semibold text-[#1A1A2E] dark:text-white">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        elements.push(
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-[#6E62E5] font-semibold min-w-[1.2rem]">{num}.</span>
            <span>{textParts}</span>
          </div>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-1.5" />);
      } else {
        elements.push(<div key={i}>{rendered}</div>);
      }
    });

    return elements;
  };

  // Render actionable UI (subtask/checklist/description buttons)
  const renderActionable = (msg: ChatMessage) => {
    if (!msg.actionable) return null;
    const { type, items, description } = msg.actionable;
    const isCreating = creatingItems === msg.id;

    if (type === 'description' && description) {
      return (
        <div className="mt-3 border border-[#ECEDF0] dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-[#F8F7FF] dark:bg-purple-900/10 border-b border-[#ECEDF0] dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs font-medium text-[#6E62E5]">Suggested Description</span>
          </div>
          <div className="px-3 py-2 text-xs text-[#5C5C6D] dark:text-gray-400 max-h-32 overflow-y-auto whitespace-pre-wrap">
            {description}
          </div>
          <div className="px-3 py-2 border-t border-[#ECEDF0] dark:border-gray-700">
            <button
              onClick={() => handleApplyDescription(msg.id)}
              disabled={isCreating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6E62E5] text-white text-xs font-medium rounded-lg hover:bg-[#5B4FD1] disabled:opacity-50 transition-colors"
            >
              {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Apply Description
            </button>
          </div>
        </div>
      );
    }

    if ((type === 'subtasks' || type === 'checklist') && items) {
      const selectedCount = items.filter(i => i.selected).length;
      return (
        <div className="mt-3 border border-[#ECEDF0] dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-[#F8F7FF] dark:bg-purple-900/10 border-b border-[#ECEDF0] dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs font-medium text-[#6E62E5]">
              {type === 'subtasks' ? 'Suggested Subtasks' : 'Suggested Checklist'}
            </span>
            <span className="text-[10px] text-[#9CA3AF]">{selectedCount}/{items.length} selected</span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {items.map((item, idx) => (
              <label
                key={idx}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#F5F7FA] dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => toggleItem(msg.id, idx)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-[#6E62E5] focus:ring-[#6E62E5]"
                />
                <span className={cn(
                  'text-xs',
                  item.selected ? 'text-[#1A1A2E] dark:text-white' : 'text-[#9CA3AF] line-through'
                )}>
                  {item.name}
                </span>
              </label>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-[#ECEDF0] dark:border-gray-700 flex items-center gap-2">
            <button
              onClick={() => type === 'subtasks' ? handleCreateSubtasks(msg.id) : handleCreateChecklist(msg.id)}
              disabled={isCreating || selectedCount === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6E62E5] text-white text-xs font-medium rounded-lg hover:bg-[#5B4FD1] disabled:opacity-50 transition-colors"
            >
              {isCreating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              Create {selectedCount} {type === 'subtasks' ? 'Subtask' : 'Item'}{selectedCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#ECEDF0] dark:border-gray-700 flex items-center gap-2.5 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6E62E5] to-[#8B5CF6] flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white">Workora AI</h3>
          <p className="text-[10px] text-[#9CA3AF] dark:text-gray-500 truncate">
            Analyzing: {task?.name || 'Task'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center pt-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6E62E5]/10 to-[#8B5CF6]/10 flex items-center justify-center mb-3">
              <Sparkles className="h-6 w-6 text-[#6E62E5]" />
            </div>
            <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white mb-1">
              What can I help with?
            </h3>
            <p className="text-[11px] text-[#9CA3AF] dark:text-gray-500 text-center mb-4 max-w-[240px]">
              I can break down this task, create checklists, improve descriptions, and more.
            </p>
            <div className="w-full space-y-1.5">
              {QUICK_PROMPTS.map((qp) => {
                const Icon = qp.icon;
                return (
                  <button
                    key={qp.label}
                    onClick={() => sendMessage(qp.prompt)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg border border-[#ECEDF0] dark:border-gray-700 hover:border-[#6E62E5]/40 hover:bg-[#F8F7FF] dark:hover:bg-purple-900/10 transition-all text-left group"
                  >
                    <div className="w-7 h-7 rounded-md bg-[#F3F0FF] dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#6E62E5] transition-colors">
                      <Icon className="h-3.5 w-3.5 text-[#6E62E5] group-hover:text-white" />
                    </div>
                    <span className="text-xs font-medium text-[#5C5C6D] dark:text-gray-300 group-hover:text-[#1A1A2E] dark:group-hover:text-white transition-colors">
                      {qp.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
              {msg.role === 'assistant' ? (
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#6E62E5] to-[#8B5CF6] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-md bg-[#F3F4F6] dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare className="h-3 w-3 text-[#9CA3AF]" />
                </div>
              )}
              <div className={cn(
                'max-w-[88%] rounded-xl px-3 py-2 text-[13px] leading-relaxed relative group',
                msg.role === 'user'
                  ? 'bg-[#6E62E5] text-white rounded-br-sm'
                  : 'bg-[#F5F7FA] dark:bg-gray-800 text-[#5C5C6D] dark:text-gray-300 rounded-bl-sm'
              )}>
                {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                {msg.role === 'assistant' && renderActionable(msg)}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1 bg-white dark:bg-gray-700 rounded-md shadow-sm border border-[#ECEDF0] dark:border-gray-600 transition-opacity"
                    title="Copy"
                  >
                    {copiedId === msg.id ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-[#9CA3AF]" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#6E62E5] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <div className="bg-[#F5F7FA] dark:bg-gray-800 rounded-xl rounded-bl-sm px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6E62E5] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#6E62E5] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#6E62E5] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-[#ECEDF0] dark:border-gray-800 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this task..."
            rows={1}
            className="flex-1 resize-none px-3 py-2 bg-[#F5F7FA] dark:bg-gray-800 border border-transparent focus:border-[#6E62E5] rounded-lg text-[13px] text-[#1A1A2E] dark:text-white placeholder-[#9CA3AF] dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6E62E5]/20 transition-all max-h-20"
            style={{ minHeight: '36px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = '36px';
              target.style.height = Math.min(target.scrollHeight, 80) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-[#6E62E5] text-white rounded-lg hover:bg-[#5B4FD1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIPanel;
