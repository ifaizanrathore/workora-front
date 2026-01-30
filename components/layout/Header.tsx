'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, HelpCircle, ChevronDown, Settings, LogOut, User } from 'lucide-react';
import { cn, getUserInitials, getAvatarColor } from '@/lib/utils';
import { useAuthStore } from '@/stores';

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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
    <header className="sticky top-0 z-40 flex items-center justify-between h-[60px] px-6 bg-white border-b border-[#ECEDF0]">
      {/* Left Spacer */}
      <div className="w-[100px]" />

      {/* Center - Search Bar */}
      <div className="flex-1 flex justify-center max-w-[600px] mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={cn(
              'w-full pl-10 pr-20 py-2.5 bg-[#F5F7FA] rounded-xl text-sm text-[#1A1A2E] placeholder-[#9CA3AF] transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[#6E62E5]/20 focus:bg-white focus:shadow-sm',
              isSearchFocused && 'bg-white shadow-sm ring-2 ring-[#6E62E5]/20'
            )}
          />
          {/* Keyboard Shortcut Badge */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
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
      <div className="flex items-center gap-2 w-[100px] justify-end">
        {/* Help Button */}
        <button
          className="flex items-center justify-center w-9 h-9 rounded-full text-[#9CA3AF] hover:bg-[#F5F7FA] hover:text-[#5C5C6D] transition-colors"
          title="Help & Support"
        >
          <HelpCircle className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {/* User Avatar with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              'flex items-center gap-1.5 p-1 rounded-full transition-colors',
              isDropdownOpen ? 'bg-[#F5F7FA]' : 'hover:bg-[#F5F7FA]'
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
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-[#ECEDF0] overflow-hidden z-50">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-[#ECEDF0]">
                <p className="text-sm font-medium text-[#1A1A2E] truncate">{userName}</p>
                <p className="text-xs text-[#8C8C9A] truncate">{user?.email}</p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#5C5C6D] hover:bg-[#F5F7FA] transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#5C5C6D] hover:bg-[#F5F7FA] transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-[#ECEDF0] py-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 w-full transition-colors"
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