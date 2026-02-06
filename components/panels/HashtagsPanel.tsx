'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Hash,
  Loader2,
  ThumbsUp,
  Sparkles,
  X,
  Search,
  MessageCircle,
  Send,
  Smile,
  Paperclip,
  AtSign,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatTimeCompact, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { useTaskSocket } from '@/hooks/useSocket';
import { useAuthStore, useWorkspaceStore } from '@/stores';
import { SkeletonHashtagsPanel } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';
import type { User } from '@/types';

// Common emoji list
const EMOJI_LIST = [
  { category: 'Smileys', emojis: ['😀', '😂', '😊', '🥰', '😎', '🤔', '😅', '😢', '😡', '🥳'] },
  { category: 'Hands', emojis: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '💪', '👋', '🫡'] },
  { category: 'Objects', emojis: ['🔥', '⭐', '💡', '🎯', '🚀', '✅', '❌', '⚡', '💬', '📌'] },
  { category: 'Symbols', emojis: ['❤️', '💜', '💚', '🏆', '🎉', '📎', '🔗', '⏰', '📝', '🏷️'] },
];

interface HashtagsPanelProps {
  taskId: string;
  initialFilter?: string | null;
}

interface Comment {
  id: string;
  comment_text?: string;
  text?: string;
  user?: {
    id?: string | number;
    username?: string;
    email?: string;
    profilePicture?: string;
  };
  date?: string;
  date_created?: string;
  resolved?: boolean;
}

// Extract hashtags from text using regex
const extractHashtags = (text: string): string[] => {
  const regex = /#[\w]+/g;
  const matches = text.match(regex) || [];
  const uniqueTags = Array.from(new Set(matches.map((tag) => tag.toLowerCase())));
  return uniqueTags;
};

// Highlight hashtags and mentions in text
const highlightText = (
  text: string,
  onHashtagClick: (tag: string) => void
): React.ReactNode => {
  const parts = text.split(/(@[\w]+|#[\w]+)/g);

  return parts.map((part, index) => {
    if (part.match(/^#[\w]+$/)) {
      return (
        <button
          key={index}
          onClick={() => onHashtagClick(part.toLowerCase())}
          className="text-[#7C3AED] hover:text-[#6D28D9] font-medium hover:underline"
        >
          {part}
        </button>
      );
    }
    if (part.match(/^@[\w]+$/)) {
      return (
        <span key={index} className="text-[#3B82F6] font-medium">
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export const HashtagsPanel: React.FC<HashtagsPanelProps> = ({ taskId, initialFilter }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(initialFilter || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const mentionRef = useRef<HTMLDivElement>(null);

  // Icon functionality state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [members, setMembers] = useState<User[]>([]);

  // Get current user from auth store
  const currentUser = useAuthStore((state) => state.user);
  const { currentWorkspace } = useWorkspaceStore();

  // WebSocket connection for real-time updates
  const { isConnected, activities } = useTaskSocket(taskId);

  // Sync initialFilter prop to activeFilter state
  useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);

  // Fetch initial comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!taskId) return;

      setIsLoading(true);
      try {
        const data = await api.getTaskComments(taskId);
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
        setComments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [taskId]);

  // Handle real-time updates from WebSocket
  useEffect(() => {
    if (activities.length === 0) return;

    const latestActivity = activities[0];

    if (latestActivity.type === 'comment_added' && latestActivity.data) {
      const newComment: Comment = {
        id: latestActivity.data.id || `temp-${Date.now()}`,
        comment_text: latestActivity.data.comment_text || latestActivity.data.text,
        user: latestActivity.data.user,
        date: latestActivity.data.date || new Date().toISOString(),
      };

      setComments((prev) => {
        // Avoid duplicates
        if (prev.some((c) => c.id === newComment.id)) return prev;
        return [newComment, ...prev];
      });

      // Scroll to top to show new message
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    if (latestActivity.type === 'comment_deleted' && latestActivity.data?.id) {
      setComments((prev) => prev.filter((c) => c.id !== latestActivity.data.id));
    }

    if (latestActivity.type === 'comment_updated' && latestActivity.data) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === latestActivity.data.id ? { ...c, ...latestActivity.data } : c
        )
      );
    }
  }, [activities]);

  // Extract all unique hashtags from comments with counts
  const hashtagsWithCounts = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    comments.forEach((comment) => {
      const text = comment.comment_text || comment.text || '';
      extractHashtags(text).forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [comments]);

  // Filter comments based on active hashtag and search
  const filteredComments = useMemo(() => {
    let result = comments;

    if (activeFilter) {
      result = result.filter((comment) => {
        const text = comment.comment_text || comment.text || '';
        const hashtags = extractHashtags(text);
        return hashtags.includes(activeFilter);
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((comment) => {
        const text = (comment.comment_text || comment.text || '').toLowerCase();
        const userName = (comment.user?.username || '').toLowerCase();
        return text.includes(query) || userName.includes(query);
      });
    }

    return result;
  }, [comments, activeFilter, searchQuery]);

  // Handle hashtag click - filter AND insert into input
  const handleHashtagClick = useCallback((tag: string) => {
    if (activeFilter === tag) {
      setActiveFilter(null);
    } else {
      setActiveFilter(tag);
    }
  }, [activeFilter]);

  // Insert hashtag into comment input
  const insertHashtag = useCallback((tag: string) => {
    const hashtag = tag.startsWith('#') ? tag : `#${tag}`;
    setCommentText((prev) => {
      const newText = prev ? `${prev} ${hashtag} ` : `${hashtag} `;
      return newText;
    });
    inputRef.current?.focus();
  }, []);

  const clearFilter = () => {
    setActiveFilter(null);
    setSearchQuery('');
  };

  // Send comment
  const handleSendComment = async () => {
    if (!commentText.trim() || isSending) return;

    const textToSend = commentText.trim();
    setIsSending(true);

    try {
      const result = await api.createTaskComment(taskId, {
        comment_text: textToSend,
      });

      // Optimistically add to list using current user info
      const newComment: Comment = {
        id: result?.id || `temp-${Date.now()}`,
        comment_text: textToSend,
        user: {
          id: currentUser?.id,
          username: currentUser?.username || currentUser?.email?.split('@')[0] || 'You',
          email: currentUser?.email,
          profilePicture: currentUser?.profilePicture,
        },
        date: new Date().toISOString(),
      };

      setComments((prev) => {
        // Avoid duplicates if result has an id
        if (result?.id && prev.some((c) => c.id === result.id)) return prev;
        return [newComment, ...prev];
      });

      setCommentText('');
    } catch (err) {
      console.error('Failed to send comment:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendComment();
    }
  };

  // Fetch members for @mention
  useEffect(() => {
    if (!currentWorkspace?.id) return;
    const fetchMembers = async () => {
      try {
        const data = await api.getMembers(currentWorkspace.id);
        setMembers(Array.isArray(data) ? data : []);
      } catch {
        // Members not available
      }
    };
    fetchMembers();
  }, [currentWorkspace?.id]);

  // Close popovers on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (mentionRef.current && !mentionRef.current.contains(e.target as Node)) {
        setShowMentionList(false);
        setMentionSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const insertAtCursor = useCallback((text: string) => {
    const textarea = inputRef.current;
    if (!textarea) {
      setCommentText((prev) => prev + text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = commentText;
    const newValue = current.slice(0, start) + text + current.slice(end);
    setCommentText(newValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    });
  }, [commentText]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    insertAtCursor(emoji);
    setShowEmojiPicker(false);
  }, [insertAtCursor]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;
    setIsUploading(true);
    try {
      await api.uploadAttachment(taskId, file);
      toast.success(`Uploaded: ${file.name}`);
      insertAtCursor(`[📎 ${file.name}] `);
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [taskId, insertAtCursor]);

  const handleMentionSelect = useCallback((user: User) => {
    insertAtCursor(`@${user.username || user.email || 'user'} `);
    setShowMentionList(false);
    setMentionSearch('');
  }, [insertAtCursor]);

  const handleHashtagInsert = useCallback(() => {
    insertAtCursor('#');
  }, [insertAtCursor]);

  const filteredMembers = members.filter((m) => {
    if (!mentionSearch) return true;
    const q = mentionSearch.toLowerCase();
    return (m.username?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q));
  });

  if (isLoading) {
    return <SkeletonHashtagsPanel />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#ECEDF0]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-[#7C3AED]" />
            <h3 className="text-base font-semibold text-[#1A1A2E]">Hashtags</h3>
            <span className="text-xs text-[#9CA3AF]">
              {comments.length} message{comments.length !== 1 ? 's' : ''}
            </span>
            {isConnected && (
              <span className="w-2 h-2 rounded-full bg-green-500" title="Live" />
            )}
          </div>
          {(activeFilter || searchQuery) && (
            <button
              onClick={clearFilter}
              className="flex items-center gap-1 px-2 py-1 text-xs text-[#6B7280] hover:text-[#1A1A2E] hover:bg-[#F5F5F7] rounded-md transition-colors"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#F5F5F7] border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 placeholder-[#9CA3AF]"
          />
        </div>
      </div>

      {/* Hashtags Pills */}
      {hashtagsWithCounts.length > 0 && (
        <div className="px-4 py-3 border-b border-[#ECEDF0] bg-[#FAFBFC]">
          <div className="flex flex-wrap gap-2">
            {hashtagsWithCounts.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => handleHashtagClick(tag)}
                onDoubleClick={() => insertHashtag(tag)}
                title="Click to filter, double-click to insert"
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  activeFilter === tag
                    ? 'bg-[#7C3AED] text-white shadow-sm'
                    : 'bg-white text-[#7C3AED] border border-[#E5E7EB] hover:border-[#7C3AED] hover:bg-[#F3F0FF]'
                )}
              >
                <span>{tag}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px]',
                    activeFilter === tag
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F3F0FF] text-[#7C3AED]'
                  )}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Discussions */}
      <div className="flex-1 overflow-y-auto">
        <div ref={messagesEndRef} />
        {filteredComments.length > 0 ? (
          <div className="divide-y divide-[#ECEDF0]">
            {filteredComments.map((comment) => (
              <DiscussionItem
                key={comment.id}
                comment={comment}
                onHashtagClick={handleHashtagClick}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-[#9CA3AF]">
            {activeFilter || searchQuery ? (
              <>
                <Search className="h-8 w-8 mb-2" />
                <p>No results found</p>
                <button
                  onClick={clearFilter}
                  className="text-xs text-[#7C3AED] mt-2 hover:underline"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <MessageCircle className="h-8 w-8 mb-2" />
                <p>No discussions yet</p>
                <p className="text-xs mt-1">Start the conversation below</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="border-t border-[#ECEDF0] bg-white p-3">
        <div className="border border-[#E5E7EB] rounded-lg overflow-hidden focus-within:border-[#7C3AED] focus-within:ring-1 focus-within:ring-[#7C3AED]/20">
          <textarea
            ref={inputRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Type a message... Use # for hashtags'
            className="w-full px-3 py-2.5 text-sm text-[#1A1A2E] placeholder-[#9CA3AF] resize-none focus:outline-none"
            rows={2}
          />
          <div className="flex items-center justify-between px-3 py-2 bg-[#FAFBFC] border-t border-[#F3F4F6]">
            <div className="flex items-center gap-2 relative">
              {/* Emoji Picker */}
              <div ref={emojiRef} className="relative">
                <button
                  onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowMentionList(false); }}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    showEmojiPicker ? 'text-[#7C3AED] bg-[#F3F0FF]' : 'text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F5F5F7]'
                  )}
                  title="Insert emoji"
                >
                  <Smile className="h-4 w-4" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 w-[280px] bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-3 z-50">
                    {EMOJI_LIST.map((group) => (
                      <div key={group.category} className="mb-2 last:mb-0">
                        <p className="text-[10px] font-medium text-[#9CA3AF] mb-1 uppercase tracking-wide">{group.category}</p>
                        <div className="flex flex-wrap gap-1">
                          {group.emojis.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleEmojiSelect(emoji)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F0FF] text-lg transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* File Attachment */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  isUploading ? 'text-[#7C3AED]' : 'text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F5F5F7]'
                )}
                title="Attach file"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>

              {/* @Mention */}
              <div ref={mentionRef} className="relative">
                <button
                  onClick={() => { setShowMentionList(!showMentionList); setShowEmojiPicker(false); }}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    showMentionList ? 'text-[#7C3AED] bg-[#F3F0FF]' : 'text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F5F5F7]'
                  )}
                  title="Mention someone"
                >
                  <AtSign className="h-4 w-4" />
                </button>
                {showMentionList && (
                  <div className="absolute bottom-full left-0 mb-2 w-[220px] bg-white rounded-xl shadow-xl border border-[#E5E7EB] z-50 overflow-hidden">
                    <div className="p-2 border-b border-[#F3F4F6]">
                      <input
                        type="text"
                        value={mentionSearch}
                        onChange={(e) => setMentionSearch(e.target.value)}
                        placeholder="Search members..."
                        className="w-full px-2 py-1.5 text-xs bg-[#F5F5F7] rounded-md focus:outline-none text-[#1A1A2E] placeholder-[#9CA3AF]"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[180px] overflow-y-auto py-1">
                      {filteredMembers.length > 0 ? (
                        filteredMembers.map((member) => (
                          <button
                            key={member.id}
                            onClick={() => handleMentionSelect(member)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F5F5F7] transition-colors text-left"
                          >
                            <Avatar name={member.username || member.email || 'U'} src={member.profilePicture} size="xs" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-[#1A1A2E] truncate">{member.username || 'User'}</p>
                              {member.email && <p className="text-[10px] text-[#9CA3AF] truncate">{member.email}</p>}
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-[#9CA3AF] text-center py-3">No members found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Hashtag Insertion */}
              <button
                onClick={handleHashtagInsert}
                className="p-1.5 text-[#9CA3AF] hover:text-[#7C3AED] hover:bg-[#F3F0FF] rounded transition-colors"
                title="Insert hashtag"
              >
                <Hash className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleSendComment}
              disabled={!commentText.trim() || isSending}
              className={cn(
                'p-2 rounded-lg transition-colors',
                commentText.trim()
                  ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white'
                  : 'bg-[#F5F5F7] text-[#C4C4C4]'
              )}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-[#9CA3AF] mt-1.5 text-center">
          Press Cmd + Enter to send
        </p>
      </div>
    </div>
  );
};

// Discussion Item Component
interface DiscussionItemProps {
  comment: Comment;
  onHashtagClick: (tag: string) => void;
}

const DiscussionItem: React.FC<DiscussionItemProps> = ({ comment, onHashtagClick }) => {
  const text = comment.comment_text || comment.text || '';
  const userName = comment.user?.username || 'Unknown';
  const dateStr = comment.date || comment.date_created || '';

  return (
    <div className="px-4 py-4 hover:bg-[#FAFBFC] transition-colors group">
      <div className="flex items-start gap-3">
        <Avatar name={userName} src={comment.user?.profilePicture} size="md" />
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#1A1A2E] text-sm">{userName}</span>
            <span className="text-xs text-[#9CA3AF]">
              {dateStr ? formatTimeCompact(dateStr) : ''}
            </span>
          </div>

          {/* Message with highlighted hashtags and mentions */}
          <p className="mt-1.5 text-sm text-[#374151] leading-relaxed break-words">
            {highlightText(text, onHashtagClick)}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="flex items-center gap-1.5 px-2 py-1 text-[#9CA3AF] hover:text-[#1A1A2E] hover:bg-[#F5F5F7] rounded transition-colors">
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1 text-[#9CA3AF] hover:text-[#1A1A2E] hover:bg-[#F5F5F7] rounded transition-colors">
              <span className="text-sm">😀</span>
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[#7C3AED] bg-[#F3F0FF] rounded hover:bg-[#E9E3FF] transition-colors">
              <Sparkles className="h-3 w-3" />
              AI
            </button>
            <button className="px-2 py-1 text-xs text-[#6B7280] hover:text-[#7C3AED] hover:bg-[#F5F5F7] rounded transition-colors">
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HashtagsPanel;
