'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, HelpCircle, ChevronDown, Settings, LogOut, User, Sun, Moon, Keyboard } from 'lucide-react';
import { cn, getUserInitials, getAvatarColor } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import { useTheme } from '@/contexts/ThemeContext';

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { toggleTheme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showShortcutsHint, setShowShortcutsHint] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        searchRef.current?.blur();
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
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
      {/* Left Spacer - Hidden on mobile */}
      <div className="hidden md:block w-[100px]" />

      {/* Center - Search Bar */}
      <div className="flex-1 flex justify-center max-w-[600px] mx-2 sm:mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={cn(
              'w-full pl-9 sm:pl-10 pr-4 sm:pr-20 py-2 sm:py-2.5 bg-[#F5F7FA] dark:bg-gray-800 rounded-lg sm:rounded-xl text-sm text-[#1A1A2E] dark:text-gray-100 placeholder-[#9CA3AF] dark:placeholder-gray-500 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[#6E62E5]/20 focus:bg-white dark:focus:bg-gray-800 focus:shadow-sm',
              isSearchFocused && 'bg-white dark:bg-gray-800 shadow-sm ring-2 ring-[#6E62E5]/20'
            )}
          />
          {/* Keyboard Shortcut Badge - Hidden on mobile */}
          <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1">
            <span className="px-1.5 py-0.5 bg-[#6E62E5] text-white text-[10px] font-semibold rounded">
              Ctrl
            </span>
            <span className="px-1.5 py-0.5 bg-[#6E62E5] text-white text-[10px] font-semibold rounded">
              K
            </span>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 sm:gap-2 w-auto sm:w-[180px] justify-end">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-full text-[#9CA3AF] hover:bg-[#F5F7FA] dark:hover:bg-gray-800 hover:text-[#5C5C6D] dark:hover:text-gray-300 transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-5 w-5" strokeWidth={1.5} /> : <Moon className="h-5 w-5" strokeWidth={1.5} />}
        </button>

        {/* Keyboard Shortcuts */}
        <button
          onClick={() => setShowShortcutsHint(!showShortcutsHint)}
          className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full text-[#9CA3AF] hover:bg-[#F5F7FA] dark:hover:bg-gray-800 hover:text-[#5C5C6D] dark:hover:text-gray-300 transition-colors"
          title="Keyboard shortcuts (Shift + ?)"
        >
          <Keyboard className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {/* Help Button */}
        <button
          className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full text-[#9CA3AF] hover:bg-[#F5F7FA] dark:hover:bg-gray-800 hover:text-[#5C5C6D] dark:hover:text-gray-300 transition-colors"
          title="Help & Support"
        >
          <HelpCircle className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {/* User Avatar with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              'flex items-center gap-1 sm:gap-1.5 p-1 rounded-full transition-colors',
              isDropdownOpen ? 'bg-[#F5F7FA] dark:bg-gray-800' : 'hover:bg-[#F5F7FA] dark:hover:bg-gray-800'
            )}
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