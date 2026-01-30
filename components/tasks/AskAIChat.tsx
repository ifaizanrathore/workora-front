'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Loader2,
  ChevronDown,
  Flag,
  Calendar,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Priority {
  id: string;
  label: string;
  color: string;
  textColor: string;
}

interface TaskTag {
  name: string;
  tag_bg: string;
  tag_fg: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: AIAction[];
}

interface AIAction {
  type: 'priority' | 'tag' | 'dueDate';
  label: string;
  value: any;
}

interface AskAIChatProps {
  isOpen: boolean;
  onClose: () => void;
  taskName: string;
  description: string;
  onApplyPriority: (priority: Priority) => void;
  onApplyTags: (tags: TaskTag[]) => void;
  onApplyDueDate: (date: string) => void;
  availableTags: TaskTag[];
}

const priorityOptions: Priority[] = [
  { id: '1', label: 'Urgent', color: 'bg-red-500', textColor: 'text-red-600' },
  { id: '2', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { id: '3', label: 'Normal', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { id: '4', label: 'Low', color: 'bg-gray-400', textColor: 'text-gray-600' },
];

export const AskAIChat: React.FC<AskAIChatProps> = ({
  isOpen,
  onClose,
  taskName,
  description,
  onApplyPriority,
  onApplyTags,
  onApplyDueDate,
  availableTags,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'How can I help with this task? I can suggest priorities, tags, due dates, or help refine the description.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isCollapsed) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isCollapsed]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'How can I help with this task? I can suggest priorities, tags, due dates, or help refine the description.',
        },
      ]);
      setInput('');
      setIsCollapsed(false);
    }
  }, [isOpen]);

  const generateResponse = (userMessage: string): Message => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Priority suggestions
    if (lowerMessage.includes('priority') || lowerMessage.includes('urgent') || lowerMessage.includes('important')) {
      const suggestedPriority = taskName.toLowerCase().includes('urgent') || 
                                taskName.toLowerCase().includes('asap') ||
                                lowerMessage.includes('urgent')
        ? priorityOptions[0]
        : taskName.toLowerCase().includes('bug') || taskName.toLowerCase().includes('fix')
          ? priorityOptions[1]
          : priorityOptions[2];

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Based on "${taskName}", I'd suggest **${suggestedPriority.label}** priority. ${
          suggestedPriority.id === '1' 
            ? 'The keywords suggest this needs immediate attention.' 
            : suggestedPriority.id === '2'
              ? 'Bug fixes and technical tasks typically warrant high priority.'
              : 'This seems like a standard task with normal priority.'
        }`,
        actions: [
          { type: 'priority', label: `Apply ${suggestedPriority.label}`, value: suggestedPriority },
          ...priorityOptions.filter(p => p.id !== suggestedPriority.id).slice(0, 2).map(p => ({
            type: 'priority' as const,
            label: p.label,
            value: p,
          })),
        ],
      };
    }

    // Tag suggestions
    if (lowerMessage.includes('tag') || lowerMessage.includes('label') || lowerMessage.includes('categorize')) {
      const suggestedTags = availableTags.slice(0, 3);
      
      if (suggestedTags.length === 0) {
        return {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'No tags are available in this space yet. You can create new tags by clicking the Tags button.',
        };
      }

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Here are some tags that might fit this task:`,
        actions: suggestedTags.map(tag => ({
          type: 'tag' as const,
          label: tag.name,
          value: tag,
        })),
      };
    }

    // Due date suggestions
    if (lowerMessage.includes('due') || lowerMessage.includes('deadline') || lowerMessage.includes('when')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + (5 - endOfWeek.getDay()));

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'When should this task be completed? Here are some suggestions:',
        actions: [
          { type: 'dueDate', label: 'Tomorrow', value: tomorrow.toISOString().split('T')[0] },
          { type: 'dueDate', label: 'End of Week', value: endOfWeek.toISOString().split('T')[0] },
          { type: 'dueDate', label: 'Next Week', value: nextWeek.toISOString().split('T')[0] },
        ],
      };
    }

    // General help
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: `I can help you with:\n• **Priority** - "What priority should this be?"\n• **Tags** - "Suggest tags for this task"\n• **Due date** - "When should this be due?"\n• **Description** - "Help me write a better description"`,
    };
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = generateResponse(input);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 800);
  };

  const handleAction = (action: AIAction) => {
    switch (action.type) {
      case 'priority':
        onApplyPriority(action.value);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✓ Applied **${action.value.label}** priority`,
        }]);
        break;
      case 'tag':
        onApplyTags([action.value]);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✓ Added tag **${action.value.name}**`,
        }]);
        break;
      case 'dueDate':
        onApplyDueDate(action.value);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✓ Set due date to **${new Date(action.value).toLocaleDateString()}**`,
        }]);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="border border-[#E8E6FA] rounded-lg bg-white overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-2.5 bg-[#F9FAFB] border-b border-[#ECECEC] cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#5B4FD1]" />
          <span className="text-sm font-medium text-[#111827]">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <ChevronDown 
              className={cn(
                "w-4 h-4 text-[#6B7280] transition-transform",
                isCollapsed && "rotate-180"
              )} 
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>
      </div>

      {/* Chat Content */}
      {!isCollapsed && (
        <>
          {/* Messages */}
          <div className="h-48 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div
                  className={cn(
                    'text-sm whitespace-pre-wrap',
                    message.role === 'user' 
                      ? 'text-[#111827] bg-[#F3F4F6] rounded-lg px-3 py-2 ml-8' 
                      : 'text-[#6B7280]'
                  )}
                >
                  {message.role === 'assistant' && (
                    <span className="text-[#5B4FD1] font-medium">AI: </span>
                  )}
                  {message.content.split('**').map((part, i) => 
                    i % 2 === 1 ? <strong key={i} className="text-[#111827]">{part}</strong> : part
                  )}
                </div>

                {/* Action Buttons */}
                {message.actions && message.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-6">
                    {message.actions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleAction(action)}
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                          action.type === 'priority' 
                            ? "border border-[#D1D5DB] text-[#6B7280] hover:bg-gray-100"
                            : action.type === 'tag'
                              ? "text-white"
                              : "border border-[#D1D5DB] text-[#6B7280] hover:bg-gray-100"
                        )}
                        style={action.type === 'tag' ? {
                          backgroundColor: action.value.tag_bg,
                          color: action.value.tag_fg,
                        } : undefined}
                      >
                        {action.type === 'priority' && (
                          <Flag className={cn("w-3 h-3", action.value.textColor)} />
                        )}
                        {action.type === 'dueDate' && (
                          <Calendar className="w-3 h-3" />
                        )}
                        {action.type === 'tag' && (
                          <Tag className="w-3 h-3" />
                        )}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <Sparkles className="w-3.5 h-3.5 text-[#5B4FD1]" />
                <span>AI is thinking</span>
                <div className="flex gap-0.5">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-[#ECECEC]">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                className="flex-1 px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#5B4FD1] focus:ring-1 focus:ring-[#5B4FD1]/20 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-2 bg-[#5B4FD1] text-white rounded-lg hover:bg-[#4A3FB8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AskAIChat;