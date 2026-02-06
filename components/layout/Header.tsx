'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HelpCircle, ChevronDown, Settings, LogOut, User, Sun, Moon, Keyboard } from 'lucide-react';
import { cn, getUserInitials, getAvatarColor } from '@/lib/utils';
import { useAuthStore, useWorkspaceStore } from '@/stores';
import { useTheme } from '@/contexts/ThemeContext';

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { toggleTheme, isDark } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showShortcutsHint, setShowShortcutsHint] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle Escape to close dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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

      {/* Center - Workspace Name */}
      <div className="flex-1 flex justify-center mx-2 sm:mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#1A1A2E] dark:text-white truncate">
            {currentWorkspace?.name || 'Workora'}
          </span>
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-[#F5F7FA] dark:bg-gray-800 rounded-md">
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-[#9CA3AF] dark:text-gray-500 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm">Ctrl</kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-[#9CA3AF] dark:text-gray-500 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm">K</kbd>
            <span className="text-[10px] text-[#9CA3AF] dark:text-gray-500 ml-1">to search</span>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 sm:gap-2 w-auto sm:w-[180px] justify-end">
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