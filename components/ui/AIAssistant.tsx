'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Send,
  Sparkles,
  Loader2,
  Minus,
  Copy,
  Check,
  Zap,
  ListChecks,
  FileText,
  BarChart3,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/stores';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const QUICK_PROMPTS = [
  { icon: BarChart3, label: 'Summarize my tasks', prompt: 'Give me a summary of all my current tasks — what\'s overdue, what\'s due soon, and overall progress.' },
  { icon: ListChecks, label: 'Break down a task', prompt: 'Help me break down a complex task into smaller subtasks. I\'ll describe the task.' },
  { icon: FileText, label: 'Write description', prompt: 'Help me write a detailed task description with acceptance criteria. I\'ll give you the task name.' },
  { icon: Zap, label: 'Daily standup', prompt: 'Generate a daily standup update based on my tasks — what was completed recently, what\'s in progress, and what\'s blocked or overdue.' },
];

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { tasks } = useTaskStore();

  // Build task context for AI
  const taskContext = useMemo(() => {
    if (tasks.length === 0) return '';

    const now = Date.now();
    const overdue = tasks.filter(t => t.due_date && Number(t.due_date) < now && t.status?.type !== 'closed');
    const completed = tasks.filter(t => t.status?.type === 'closed');
    const open = tasks.filter(t => t.status?.type !== 'closed');

    const taskSummaries = tasks.slice(0, 30).map(t => {
      const parts = [`- "${t.name}" (status: ${t.status?.status || 'unknown'}`];
      if (t.priority?.priority) parts.push(`priority: ${t.priority.priority}`);
      if (t.assignees?.length) parts.push(`assigned: ${t.assignees.map(a => a.username || a.email).join(', ')}`);
      if (t.due_date) {
        const due = new Date(Number(t.due_date));
        parts.push(`due: ${due.toLocaleDateString()}`);
      }
      if (t.tags?.length) parts.push(`tags: ${t.tags.map(tg => tg.name).join(', ')}`);
      return parts.join(', ') + ')';
    }).join('\n');

    return `Total tasks: ${tasks.length} (${open.length} open, ${completed.length} completed, ${overdue.length} overdue)\n\nTask list:\n${taskSummaries}`;
  }, [tasks]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  // Close on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Don't close, just ignore - user may want to keep it open
      }
    };
    if (isOpen) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen]);

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

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
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
  }, [messages, isLoading, taskContext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleCopy = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleClearChat = useCallback(() => {
    setMessages([]);
  }, []);

  // Render markdown-lite (bold, code blocks, lists)
  const renderContent = (content: string) => {
    const lines = content.split('\n');
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

      // Bold text
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const rendered = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-semibold text-[#1A1A2E] dark:text-white">{part.slice(2, -2)}</strong>;
        }
        // Inline code
        const codeParts = part.split(/(`[^`]+`)/g);
        return codeParts.map((cp, k) => {
          if (cp.startsWith('`') && cp.endsWith('`')) {
            return <code key={`${j}-${k}`} className="bg-[#F3F4F6] dark:bg-gray-800 text-[#6E62E5] px-1 py-0.5 rounded text-xs font-mono">{cp.slice(1, -1)}</code>;
          }
          return cp;
        });
      });

      // Bullet points
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
        elements.push(<div key={i} className="h-2" />);
      } else {
        elements.push(<div key={i}>{rendered}</div>);
      }
    });

    return elements;
  };

  return (
    <>
      {/* Floating AI Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#6E62E5] to-[#8B5CF6] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all group"
          title="Ask AI (Ctrl+J)"
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">Ask AI</span>
        </button>
      )}

      {/* AI Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className={cn(
            'fixed z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-[#ECEDF0] dark:border-gray-700 flex flex-col transition-all duration-200',
            isMinimized
              ? 'bottom-6 right-6 w-72 h-14'
              : 'bottom-6 right-6 w-[420px] h-[600px] max-h-[80vh]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#ECEDF0] dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6E62E5] to-[#8B5CF6] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white">Workora AI</h3>
                {!isMinimized && (
                  <p className="text-[10px] text-[#9CA3AF] dark:text-gray-500">Powered by GPT-4o</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isMinimized && messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="p-1.5 rounded-lg text-[#9CA3AF] hover:bg-[#F5F7FA] dark:hover:bg-gray-800 hover:text-red-500 transition-colors"
                  title="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg text-[#9CA3AF] hover:bg-[#F5F7FA] dark:hover:bg-gray-800 hover:text-[#5C5C6D] dark:hover:text-gray-300 transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#9CA3AF] hover:bg-[#F5F7FA] dark:hover:bg-gray-800 hover:text-[#5C5C6D] dark:hover:text-gray-300 transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.length === 0 ? (
                  // Welcome + Quick Prompts
                  <div className="flex flex-col items-center pt-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6E62E5]/10 to-[#8B5CF6]/10 flex items-center justify-center mb-4">
                      <Sparkles className="h-7 w-7 text-[#6E62E5]" />
                    </div>
                    <h3 className="text-base font-semibold text-[#1A1A2E] dark:text-white mb-1">
                      How can I help?
                    </h3>
                    <p className="text-xs text-[#9CA3AF] dark:text-gray-500 text-center mb-6 max-w-[280px]">
                      I can analyze your tasks, break down work, write descriptions, and generate reports.
                    </p>

                    {/* Quick Prompts */}
                    <div className="w-full space-y-2">
                      {QUICK_PROMPTS.map((qp) => {
                        const Icon = qp.icon;
                        return (
                          <button
                            key={qp.label}
                            onClick={() => sendMessage(qp.prompt)}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border border-[#ECEDF0] dark:border-gray-700 hover:border-[#6E62E5]/40 dark:hover:border-[#6E62E5]/40 hover:bg-[#F8F7FF] dark:hover:bg-purple-900/10 transition-all text-left group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#F3F0FF] dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#6E62E5] group-hover:text-white transition-colors">
                              <Icon className="h-4 w-4 text-[#6E62E5] group-hover:text-white" />
                            </div>
                            <span className="text-sm font-medium text-[#5C5C6D] dark:text-gray-300 group-hover:text-[#1A1A2E] dark:group-hover:text-white transition-colors">
                              {qp.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // Chat Messages
                  messages.map((msg) => (
                    <div key={msg.id} className={cn('flex gap-2.5', msg.role === 'user' && 'flex-row-reverse')}>
                      {/* Avatar */}
                      {msg.role === 'assistant' ? (
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6E62E5] to-[#8B5CF6] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sparkles className="h-3.5 w-3.5 text-white" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-[#F3F4F6] dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MessageSquare className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        </div>
                      )}

                      {/* Bubble */}
                      <div className={cn(
                        'max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed relative group',
                        msg.role === 'user'
                          ? 'bg-[#6E62E5] text-white rounded-br-sm'
                          : 'bg-[#F5F7FA] dark:bg-gray-800 text-[#5C5C6D] dark:text-gray-300 rounded-bl-sm'
                      )}>
                        {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}

                        {/* Copy button for AI messages */}
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
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6E62E5] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-[#F5F7FA] dark:bg-gray-800 rounded-xl rounded-bl-sm px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#6E62E5] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-[#6E62E5] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-[#6E62E5] animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-[#ECEDF0] dark:border-gray-800 flex-shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about your tasks..."
                    rows={1}
                    className="flex-1 resize-none px-3.5 py-2.5 bg-[#F5F7FA] dark:bg-gray-800 border border-transparent focus:border-[#6E62E5] dark:focus:border-[#6E62E5] rounded-xl text-sm text-[#1A1A2E] dark:text-white placeholder-[#9CA3AF] dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6E62E5]/20 transition-all max-h-24"
                    style={{ minHeight: '40px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = '40px';
                      target.style.height = Math.min(target.scrollHeight, 96) + 'px';
                    }}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isLoading}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#6E62E5] text-white rounded-xl hover:bg-[#5B4FD1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-[#B0B0C0] dark:text-gray-600 mt-1.5 text-center">
                  AI can make mistakes. Verify important information.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AIAssistant;
