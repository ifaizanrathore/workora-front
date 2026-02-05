import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: string | Date | number | null | undefined, options?: {
  includeTime?: boolean;
  relative?: boolean;
  short?: boolean;
}): string {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (isNaN(d.getTime())) return '';

  if (options?.relative) {
    return formatRelativeTime(d);
  }

  if (options?.short) {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  };

  if (options?.includeTime) {
    dateOptions.hour = 'numeric';
    dateOptions.minute = '2-digit';
  }

  return d.toLocaleDateString('en-US', dateOptions);
}

/**
 * Sort tasks by field and direction
 * Works with any task-like object - no type constraints
 */
export function sortTasks<T>(
  tasks: T[],
  sortBy: string = 'created',
  direction: 'asc' | 'desc' = 'desc'
): T[] {
  return [...tasks].sort((a, b) => {
    const taskA = a as Record<string, any>;
    const taskB = b as Record<string, any>;
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = (taskA.name || '').localeCompare(taskB.name || '');
        break;
      
      case 'dueDate':
      case 'due_date':
        const dateA = taskA.due_date || taskA.dueDate;
        const dateB = taskB.due_date || taskB.dueDate;
        if (!dateA && !dateB) comparison = 0;
        else if (!dateA) comparison = 1;
        else if (!dateB) comparison = -1;
        else comparison = new Date(dateA).getTime() - new Date(dateB).getTime();
        break;
      
      case 'priority':
        const priorityOrder: Record<string, number> = { 
          'urgent': 1, '1': 1,
          'high': 2, '2': 2,
          'normal': 3, '3': 3,
          'low': 4, '4': 4,
        };
        const pA = String(taskA.priority?.priority || taskA.priority?.id || '5').toLowerCase();
        const pB = String(taskB.priority?.priority || taskB.priority?.id || '5').toLowerCase();
        comparison = (priorityOrder[pA] || 5) - (priorityOrder[pB] || 5);
        break;
      
      case 'status':
        comparison = (taskA.status?.status || '').localeCompare(taskB.status?.status || '');
        break;
      
      case 'created':
      case 'dateCreated':
      case 'date_created':
      default:
        const createdA = taskA.date_created || taskA.dateCreated;
        const createdB = taskB.date_created || taskB.dateCreated;
        if (!createdA && !createdB) comparison = 0;
        else if (!createdA) comparison = 1;
        else if (!createdB) comparison = -1;
        else comparison = new Date(createdA).getTime() - new Date(createdB).getTime();
        break;
    }

    return direction === 'desc' ? -comparison : comparison;
  });
}

/**
 * Group an array by a key function
 */
export function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Get time remaining until a deadline
 */
export function getTimeRemaining(deadline: string | Date | number) {
  const now = new Date();
  const due = new Date(deadline);
  const diff = due.getTime() - now.getTime();

  if (diff < 0) {
    return { overdue: true, text: 'Overdue' };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return { overdue: false, text: `${days}d ${hours % 24}h` };
  }

  if (hours > 0) {
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { overdue: false, text: `${hours}h ${minutes}m` };
  }

  const minutes = Math.floor(diff / (1000 * 60));
  return { overdue: false, text: `${minutes}m` };
}

/**
 * Get status color classes
 */
export function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('green') || statusLower === 'on track' || statusLower === 'complete' || statusLower === 'done') {
    return 'bg-green-100 text-green-800';
  }
  
  if (statusLower.includes('orange') || statusLower === 'at risk' || statusLower === 'in progress') {
    return 'bg-orange-100 text-orange-800';
  }
  
  if (statusLower.includes('red') || statusLower === 'off track' || statusLower === 'overdue') {
    return 'bg-red-100 text-red-800';
  }
  
  return 'bg-gray-100 text-gray-800';
}

/**
 * Format a countdown timer from milliseconds
 */
export function formatCountdown(ms: number): string {
  if (ms < 0) {
    return 'Overdue';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }

  return `${seconds}s`;
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return '0m';

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
}

/**
 * Format a date to relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  const absDiff = Math.abs(diff);

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const isFuture = diff > 0;
  const prefix = isFuture ? 'in ' : '';
  const suffix = isFuture ? '' : ' ago';

  if (days > 0) {
    return `${prefix}${days} day${days > 1 ? 's' : ''}${suffix}`;
  }

  if (hours > 0) {
    return `${prefix}${hours} hour${hours > 1 ? 's' : ''}${suffix}`;
  }

  if (minutes > 0) {
    return `${prefix}${minutes} minute${minutes > 1 ? 's' : ''}${suffix}`;
  }

  return 'just now';
}

/**
 * Format a date to a short string (e.g., "Jan 15" or "Jan 15, 2024")
 */
export function formatShortDate(date: string | Date, includeYear = false): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    ...(includeYear && { year: 'numeric' }),
  };
  return d.toLocaleDateString('en-US', options);
}

/**
 * Format a date to ISO string for datetime-local input
 */
export function formatDateTimeLocal(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString().slice(0, 16);
}

/**
 * Get priority color as a hex string - for inline styles
 */
export function getPriorityColor(priority: string | number | null | undefined): string {
  if (!priority) return '#9CA3AF'; // gray
  
  const p = typeof priority === 'string' ? priority.toLowerCase() : String(priority);

  switch (p) {
    case 'urgent':
    case '1':
      return '#EF4444'; // red
    case 'high':
    case '2':
      return '#F97316'; // orange
    case 'normal':
    case '3':
      return '#3B82F6'; // blue
    case 'low':
    case '4':
      return '#6B7280'; // gray
    default:
      return '#9CA3AF';
  }
}

/**
 * Get priority color classes (bg, text, border) - for Tailwind classes
 */
export function getPriorityColorClasses(priority: string | number | null | undefined): {
  bg: string;
  text: string;
  border: string;
} {
  if (!priority) {
    return { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
  }
  
  const p = typeof priority === 'string' ? priority.toLowerCase() : String(priority);

  switch (p) {
    case 'urgent':
    case '1':
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
    case 'high':
    case '2':
      return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' };
    case 'normal':
    case '3':
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' };
    case 'low':
    case '4':
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' };
  }
}

/**
 * Get priority label
 */
export function getPriorityLabel(priority: string | number | null | undefined): string {
  if (!priority) return 'None';
  
  const p = typeof priority === 'string' ? priority.toLowerCase() : String(priority);

  switch (p) {
    case 'urgent':
    case '1':
      return 'Urgent';
    case 'high':
    case '2':
      return 'High';
    case 'normal':
    case '3':
      return 'Normal';
    case 'low':
    case '4':
      return 'Low';
    default:
      return p.charAt(0).toUpperCase() + p.slice(1);
  }
}

/**
 * Get initials from a name or email
 */
export function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return 'U';
}

/**
 * Get user initials from name (used by Avatar component)
 */
export function getUserInitials(name: string): string {
  if (!name || typeof name !== 'string') return '?';
  
  const trimmed = name.trim();
  if (!trimmed) return '?';
  
  // If it's an email, use the first letter of the local part
  if (trimmed.includes('@')) {
    return trimmed.charAt(0).toUpperCase();
  }
  
  // Split by spaces and get first letter of each word (max 2)
  const parts = trimmed.split(/\s+/).filter(Boolean);
  
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  // Return first letter of first and last name
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Generate a consistent avatar background color based on a string (name/email)
 */
export function getAvatarColor(name: string): string {
  if (!name || typeof name !== 'string') {
    return '#6B7280'; // Default gray
  }

  const colors = [
    '#5B4FD1', // Purple (primary)
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
  ];

  // Generate a hash from the string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to pick a color
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a color is light or dark
 */
export function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5;
}

/**
 * Get contrasting text color for a background
 */
export function getContrastColor(bgColor: string): string {
  return isLightColor(bgColor) ? '#000000' : '#ffffff';
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string | null | undefined): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Safely parse JSON
 */
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Format number with commas
 */
export function formatNumber(num: number | null | undefined): string {
  if (num == null) return '0';
  return num.toLocaleString();
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Countdown time structure
 */
export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  totalSeconds: number;
  isOverdue: boolean;
  text: string;
}

/**
 * Get countdown time from a target date
 */
export function getCountdown(targetDate: string | number | Date): CountdownTime {
  const now = new Date().getTime();
  // Handle string timestamps (e.g., "1737619200000") by parsing to number first
  let target: number;
  if (typeof targetDate === 'string') {
    const parsed = parseInt(targetDate, 10);
    target = !isNaN(parsed) && parsed > 0 ? new Date(parsed).getTime() : new Date(targetDate).getTime();
  } else {
    target = new Date(targetDate).getTime();
  }
  const diff = target - now;
  
  const isOverdue = diff < 0;
  const absDiff = Math.abs(diff);
  
  const totalSeconds = Math.floor(absDiff / 1000);
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);
  
  let text = '';
  if (isOverdue) {
    text = 'Overdue';
  } else if (days > 0) {
    text = `${days}d ${hours}h`;
  } else if (hours > 0) {
    text = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    text = `${minutes}m ${seconds}s`;
  } else {
    text = `${seconds}s`;
  }
  
  return {
    days,
    hours,
    minutes,
    seconds,
    total: diff,
    totalSeconds: isOverdue ? -totalSeconds : totalSeconds,
    isOverdue,
    text,
  };
}
/**
 * Parse date handling string timestamps (milliseconds)
 */
function parseDate(date: string | Date | number): Date {
  if (date instanceof Date) return date;
  if (typeof date === 'number') return new Date(date);
  // Handle string timestamps like "1737619200000"
  const parsed = parseInt(date, 10);
  if (!isNaN(parsed) && parsed > 1000000000000) {
    return new Date(parsed);
  }
  return new Date(date);
}

/**
 * Format time ago (e.g., "2 mins ago", "1 hour ago")
 */
export function formatTimeAgo(date: string | Date | number): string {
  const now = new Date();
  const then = parseDate(date);

  if (isNaN(then.getTime())) return '';

  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

  return formatDate(date, { short: true });
}

/**
 * Format time compact (e.g., "2m", "1h", "5d")
 */
export function formatTimeCompact(date: string | Date | number): string {
  const now = new Date();
  const then = parseDate(date);

  if (isNaN(then.getTime())) return '';

  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;
  if (diffWeek < 4) return `${diffWeek}w`;

  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format file size (e.g., "1.2 MB", "500 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}