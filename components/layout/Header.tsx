'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, HelpCircle, ChevronDown, Settings, LogOut, User, Sun, Moon, Keyboard, Flag, X, Menu } from 'lucide-react';
import { cn, getUserInitials, getAvatarColor } from '@/lib/utils';
import { useAuthStore, useWorkspaceStore, useTaskStore, useUIStore } from '@/stores';
import { useTheme } from '@/contexts/ThemeContext';
import { Task } from '@/types';
import { NotificationCenter } from '@/components/ui/NotificationCenter';

// Priority colors for search results
const PRIORITY_COLORS: Record<string, string> = {
  '1': '#EF4444', // Urgent
  '2': '#F59E0B', // High
  '3': '#3B82F6', // Normal
  '4': '#9CA3AF', // Low
};

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { tasks, openTaskModal } = useTaskStore();
  const { toggleTheme, isDark } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showShortcutsHint, setShowShortcutsHint] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Filter tasks based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show recent tasks (first 5) when search is empty but open
      return tasks.slice(0, 5);
    }
    const q = searchQuery.toLowerCase().trim();
    return tasks.filter((task) => {
      if (task.name.toLowerCase().includes(q)) return true;
      if (task.status?.status?.toLowerCase().includes(q)) return true;
      if (task.assignees?.some(a => (a.username || a.email || '').toLowerCase().includes(q))) return true;
      if (task.tags?.some(t => (t.name || '').toLowerCase().includes(q))) return true;
      return false;
    }).slice(0, 8);
  }, [searchQuery, tasks]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults.length, searchQuery]);

  // Handle selecting a task from search results
  const handleSelectTask = useCallback((task: Task) => {
    openTaskModal(task);
    setSearchQuery('');
    setIsSearchOpen(false);
    searchInputRef.current?.blur();
  }, [openTaskModal]);

  // Keyboard navigation for search
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
      e.preventDefault();
      handleSelectTask(searchResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      setIsSearchOpen(false);
      searchInputRef.current?.blur();
    }
  }, [searchResults, selectedIndex, handleSelectTask]);

  // Global Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        if (isSearchOpen) {
          setSearchQuery('');
          setIsSearchOpen(false);
          searchInputRef.current?.blur();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    logout();
    router.push('/login');
  };

  const userName = user?.username || user?.email || 'User';
  const userInitials = getUserInitials(userName);
  const avatarColor = getAvatarColor(userName);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-[56px] sm:h-[60px] px-3 sm:px-6 bg-white dark:bg-gray-900 border-b border-[#ECEDF0] dark:border-gray-800 transition-colors">
      {/* Left: Hamburger on mobile, spacer on desktop */}
      <div className="w-[40px] md:w-[100px] flex items-center">
        <button
          onClick={() => useUIStore.getState().toggleSidebar()}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-full text-[#9CA3AF] hover:bg-[#F5F7FA] dark:hover:bg-gray-800 hover:text-[#5C5C6D] dark:hover:text-gray-300 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Center - Search Bar */}
      <div className="flex-1 flex justify-center mx-2 sm:mx-4 max-w-xl" ref={searchContainerRef}>
        <div className="relative w-full">
          {/* Search Input */}
          <div className={cn(
            'flex items-center w-full h-9 px-3 rounded-lg border transition-all duration-200',
            isSearchOpen
              ? 'bg-white dark:bg-gray-800 border-[#6E62E5] dark:border-[#6E62E5] shadow-sm ring-2 ring-[#6E62E5]/20'
              : 'bg-[#F5F7FA] dark:bg-gray-800 border-transparent hover:bg-[#ECEDF0] dark:hover:bg-gray-700 cursor-text'
          )}
            onClick={() => { setIsSearchOpen(true); searchInputRef.current?.focus(); }}
          >
            <Search className="h-4 w-4 text-[#9CA3AF] dark:text-gray-500 flex-shrink-0" strokeWidth={2} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder={`Search in ${currentWorkspace?.name || 'workspace'}...`}
              className="flex-1 bg-transparent border-none outline-none text-sm text-[#1A1A2E] dark:text-white placeholder-[#9CA3AF] dark:placeholder-gray-500 ml-2.5"
            />
            {searchQuery ? (
              <button
                onClick={(e) => { e.stopPropagation(); setSearchQuery(''); searchInputRef.current?.focus(); }}
                className="flex items-center justify-center w-5 h-5 rounded text-[#9CA3AF] hover:text-[#5C5C6D] dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-0.5 flex-shrink-0">
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-[#9CA3AF] dark:text-gray-500 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm">Ctrl</kbd>
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-[#9CA3AF] dark:text-gray-500 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm">K</kbd>
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-[#ECEDF0] dark:border-gray-700 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
              {/* Section Header */}
              <div className="px-3 py-2 border-b border-[#ECEDF0] dark:border-gray-800">
                <span className="text-[11px] font-semibold text-[#9CA3AF] dark:text-gray-500 uppercase tracking-wider">
                  {searchQuery.trim() ? `Results (${searchResults.length})` : 'Recent Tasks'}
                </span>
              </div>

              {/* Results */}
              {searchResults.length > 0 ? (
                <div className="py-1">
                  {searchResults.map((task, index) => (
                    <button
                      key={task.id}
                      onClick={() => handleSelectTask(task)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors',
                        index === selectedIndex
                          ? 'bg-[#F3F0FF] dark:bg-purple-900/30'
                          : 'hover:bg-[#F5F7FA] dark:hover:bg-gray-800'
                      )}
                    >
                      {/* Status dot */}
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-gray-900"
                        style={{ backgroundColor: task.status?.color || '#9CA3AF' }}
                      />

                      {/* Task name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1A1A2E] dark:text-white truncate font-medium">
                          {task.name}
                        </p>
                        <p className="text-[11px] text-[#9CA3AF] dark:text-gray-500 truncate mt-0.5">
                          {task.status?.status}
                          {task.list?.name ? ` · ${task.list.name}` : ''}
                        </p>
                      </div>

                      {/* Priority flag */}
                      {task.priority?.id && task.priority.id !== '0' && (
                        <Flag
                          className="h-3.5 w-3.5 flex-shrink-0"
                          style={{ color: PRIORITY_COLORS[task.priority.id] || '#9CA3AF' }}
                          fill={PRIORITY_COLORS[task.priority.id] || '#9CA3AF'}
                          strokeWidth={0}
                        />
                      )}

                      {/* Assignee avatar */}
                      {task.assignees?.[0] && (
                        <div className="flex -space-x-1.5 flex-shrink-0">
                          {task.assignees.slice(0, 2).map((assignee) => (
                            assignee.profilePicture ? (
                              <img
                                key={String(assignee.id)}
                                src={assignee.profilePicture}
                                alt={assignee.username || ''}
                                className="w-5 h-5 rounded-full object-cover ring-1 ring-white dark:ring-gray-900"
                              />
                            ) : (
                              <div
                                key={String(assignee.id)}
                                className="flex items-center justify-center w-5 h-5 rounded-full text-white text-[9px] font-bold ring-1 ring-white dark:ring-gray-900"
                                style={{ backgroundColor: getAvatarColor(assignee.username || assignee.email || '') }}
                              >
                                {getUserInitials(assignee.username || assignee.email || '?')}
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <Search className="h-8 w-8 text-[#D1D5DB] dark:text-gray-600 mb-2" />
                  <p className="text-sm font-medium text-[#6B7280] dark:text-gray-400">No tasks found</p>
                  <p className="text-xs text-[#9CA3AF] dark:text-gray-500 mt-0.5">Try a different search term</p>
                </div>
              )}

              {/* Footer hint */}
              <div className="px-3 py-2 border-t border-[#ECEDF0] dark:border-gray-800 flex items-center gap-3 text-[11px] text-[#9CA3AF] dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 text-[10px] bg-[#F5F7FA] dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 text-[10px] bg-[#F5F7FA] dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded">↵</kbd>
                  open
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[10px] bg-[#F5F7FA] dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded">esc</kbd>
                  close
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 sm:gap-2 w-auto sm:w-[220px] justify-end">
        {/* Notification Center */}
        <NotificationCenter />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-full text-[#9CA3AF] hover:bg-[#F5F7FA] dark:hover:bg-gray-800 hover:text-[#5C5C6D] dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-[#6E62E5]/30"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-5 w-5" strokeWidth={1.5} /> : <Moon className="h-5 w-5" strokeWidth={1.5} />}
        </button>

        {/* Keyboard Shortcuts */}
        <button
          onClick={() => setShowShortcutsHint(!showShortcutsHint)}
          className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full text-[#9CA3AF] hover:bg-[#F5F7FA] dark:hover:bg-gray-800 hover:text-[#5C5C6D] dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-[#6E62E5]/30"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (Shift + ?)"
        >
          <Keyboard className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {/* Help Button */}
        <button
          className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full text-[#9CA3AF] hover:bg-[#F5F7FA] dark:hover:bg-gray-800 hover:text-[#5C5C6D] dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-[#6E62E5]/30"
          aria-label="Help and support"
          title="Help & Support"
        >
          <HelpCircle className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {/* User Avatar with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              'flex items-center gap-1 sm:gap-1.5 p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#6E62E5]/30',
              isDropdownOpen ? 'bg-[#F5F7FA] dark:bg-gray-800' : 'hover:bg-[#F5F7FA] dark:hover:bg-gray-800'
            )}
            aria-label="User menu"
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
          >
            {/* Avatar */}
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div 
                className="flex items-center justify-center w-8 h-8 rounded-full text-white font-semibold text-sm"
                style={{ backgroundColor: avatarColor }}
              >
                {userInitials}
              </div>
            )}
            <ChevronDown className={cn(
              'h-3.5 w-3.5 text-[#9CA3AF] transition-transform duration-200',
              isDropdownOpen && 'rotate-180'
            )} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-[#ECEDF0] dark:border-gray-700 overflow-hidden z-50">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-[#ECEDF0] dark:border-gray-700">
                <p className="text-sm font-medium text-[#1A1A2E] dark:text-white truncate">{userName}</p>
                <p className="text-xs text-[#8C8C9A] dark:text-gray-400 truncate">{user?.email}</p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#5C5C6D] dark:text-gray-300 hover:bg-[#F5F7FA] dark:hover:bg-gray-800 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#5C5C6D] dark:text-gray-300 hover:bg-[#F5F7FA] dark:hover:bg-gray-800 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-[#ECEDF0] dark:border-gray-700 py-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;