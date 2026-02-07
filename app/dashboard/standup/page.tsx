'use client';

import React, { useState, useCallback } from 'react';
import { Sparkles, Loader2, Copy, Check, RefreshCw, Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/stores';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

type StandupFormat = 'standard' | 'detailed' | 'slack';

const FORMAT_OPTIONS: { id: StandupFormat; label: string; description: string }[] = [
  { id: 'standard', label: 'Standard', description: 'Classic Done / Doing / Blockers format' },
  { id: 'detailed', label: 'Detailed', description: 'Includes priorities, assignees, and due dates' },
  { id: 'slack', label: 'Slack-ready', description: 'Formatted with emojis for Slack/Teams' },
];

export default function StandupPage() {
  const { tasks } = useTaskStore();
  const [standup, setStandup] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<StandupFormat>('standard');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);

  const generateStandup = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setStandup('');

    try {
      const taskSummary = tasks.map(t => {
        const status = t.status?.status || 'unknown';
        const priority = t.priority?.priority || 'none';
        const assignees = t.assignees?.map(a => a.username || a.email).join(', ') || 'unassigned';
        const dueDate = t.due_date ? new Date(Number(t.due_date)).toLocaleDateString() : 'no due date';
        const tags = t.tags?.map(tag => tag.name || (tag as any).tag).filter(Boolean).join(', ') || '';
        return `- "${t.name}" [status: ${status}, priority: ${priority}, assigned: ${assignees}, due: ${dueDate}${tags ? `, tags: ${tags}` : ''}]`;
      }).join('\n');

      const formatInstructions = format === 'slack'
        ? 'Format the standup with emojis for Slack/Teams. Use checkmarks, arrows, and warning signs.'
        : format === 'detailed'
          ? 'Include task priorities, assignees, and due dates in the standup.'
          : 'Use a clean, concise format.';

      const result = await api.aiChat([{
        role: 'user',
        content: `Generate a daily standup report based on these tasks. Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.

Tasks:
${taskSummary}

Instructions:
- Categorize into: Done (completed/closed tasks), In Progress (active tasks), Blocked/At Risk (overdue or high-priority unstarted)
- ${formatInstructions}
- Be concise but informative
- If no tasks fit a category, mention "None" for that section
- Add a brief one-line summary at the end`,
      }]);

      setStandup(result.content);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate standup');
    } finally {
      setLoading(false);
    }
  }, [tasks, loading, format]);

  const handleCopy = useCallback(() => {
    if (!standup) return;
    navigator.clipboard.writeText(standup);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [standup]);

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-gray-900 border-b border-[#ECEDF0] dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-[#1A1A2E] dark:text-white">
                AI Standup Generator
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Generate daily standup reports from your tasks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="h-3.5 w-3.5 inline mr-1" />
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Format Selector */}
            <div className="relative">
              <button
                onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <span>{FORMAT_OPTIONS.find(f => f.id === format)?.label}</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>
              {showFormatDropdown && (
                <div className="absolute top-full mt-1 left-0 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                  {FORMAT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setFormat(opt.id); setShowFormatDropdown(false); }}
                      className={cn(
                        'w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                        format === opt.id && 'bg-purple-50 dark:bg-purple-900/20'
                      )}
                    >
                      <span className={cn('text-sm font-medium', format === opt.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300')}>{opt.label}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={generateStandup}
              disabled={loading || tasks.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Generating...' : standup ? 'Regenerate' : 'Generate Standup'}
            </button>

            {/* Copy Button */}
            {standup && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>

          {/* Task Count Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Based on {tasks.length} task{tasks.length !== 1 ? 's' : ''} in current list
          </div>

          {/* Empty State */}
          {!standup && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Ready to generate your standup
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-1">
                AI will analyze your tasks and create a structured standup report with what&apos;s done, in progress, and blocked.
              </p>
              {tasks.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-3">
                  No tasks loaded. Select a list first to generate a standup.
                </p>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && !standup && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing {tasks.length} tasks...</p>
            </div>
          )}

          {/* Standup Output */}
          {standup && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">Daily Standup</span>
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="px-4 py-4">
                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-[13px]">
                  {standup}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
