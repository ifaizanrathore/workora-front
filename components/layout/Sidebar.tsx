'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  Building2,
  Clock,
  MessageCircle,
  Plus,
  Settings,
  ChevronDown,
  ChevronRight,
  List,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore, useUIStore } from '@/stores';
import { api } from '@/lib/api';

// Navigation items
const navItems = [
  { icon: Home, label: 'Home', href: '/dashboard/home' },
  { icon: FileText, label: 'PaySlips', href: '/dashboard/payslips' },
  { icon: Building2, label: 'Resources', href: '/dashboard/resources' },
  { icon: Clock, label: 'Time Tracking', href: '/dashboard/time-tracking' },
  { icon: MessageCircle, label: 'Manuals', href: '/dashboard/manuals' },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { sidebarOpen } = useUIStore();
  const {
    currentWorkspace,
    spaces,
    currentSpace,
    lists,
    currentList,
    setSpaces,
    setCurrentSpace,
    setLists,
    setCurrentList,
  } = useWorkspaceStore();

  const [expandedSpaces, setExpandedSpaces] = useState<string[]>([]);
  const [isSpacesOpen, setIsSpacesOpen] = useState(true);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);

  // Fetch spaces when workspace changes
  useEffect(() => {
    if (currentWorkspace?.id && spaces.length === 0) {
      fetchSpaces();
    }
  }, [currentWorkspace?.id]);

  const fetchSpaces = async () => {
    if (!currentWorkspace?.id) return;
    setIsLoadingSpaces(true);
    try {
      const fetchedSpaces = await api.getSpaces(currentWorkspace.id);
      setSpaces(fetchedSpaces);
      
      // Auto-expand first space
      if (fetchedSpaces.length > 0 && !currentSpace) {
        setExpandedSpaces([fetchedSpaces[0].id]);
        handleSpaceClick(fetchedSpaces[0]);
      }
    } catch (error) {
      console.error('Failed to fetch spaces:', error);
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  const handleSpaceClick = async (space: any) => {
    setCurrentSpace(space);
    
    // Toggle expansion
    setExpandedSpaces(prev => 
      prev.includes(space.id) 
        ? prev.filter(id => id !== space.id)
        : [...prev, space.id]
    );

    // Fetch lists for this space
    try {
      const spaceLists = await api.getFolderlessLists(space.id);
      setLists(spaceLists);
      
      // Auto-select first list
      if (spaceLists.length > 0 && !currentList) {
        setCurrentList(spaceLists[0]);
      }
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    }
  };

  const handleListClick = (list: any) => {
    setCurrentList(list);
  };

  if (!sidebarOpen) return null;

  return (
    <aside className="flex flex-col h-screen w-[240px] bg-white dark:bg-gray-900 border-r border-[#ECEDF0] dark:border-gray-800 flex-shrink-0 transition-colors">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-[60px] border-b border-[#ECEDF0] dark:border-gray-800">
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#6E62E5] to-[#8B7CF7] rounded-lg">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-semibold text-[15px] text-[#1A1A2E] dark:text-white">Workora</span>
          <span className="text-[10px] text-[#8C8C9A] dark:text-gray-500 font-medium">1.0V</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {/* Main Nav Items */}
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[#4F46E5] text-white shadow-sm'
                    : 'text-[#5C5C6D] dark:text-gray-400 hover:bg-[#F5F5F7] dark:hover:bg-gray-800 hover:text-[#1A1A2E] dark:hover:text-white'
                )}
              >
                <item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Spaces Section */}
        <div className="mt-6">
          {/* Section Header */}
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-semibold text-[#8C8C9A] dark:text-gray-500 uppercase tracking-wider">
              Spaces
            </span>
            <button
              className="p-1 rounded hover:bg-[#F5F5F7] dark:hover:bg-gray-800 text-[#8C8C9A] hover:text-[#5C5C6D] dark:hover:text-gray-300 transition-colors"
              title="Add Space"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Spaces Toggle Button */}
          <button
            onClick={() => setIsSpacesOpen(!isSpacesOpen)}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2.5 rounded-lg font-medium text-[13px] transition-all duration-150',
              isSpacesOpen
                ? 'bg-[#7C3AED] text-white'
                : 'bg-[#F5F5F7] dark:bg-gray-800 text-[#5C5C6D] dark:text-gray-400 hover:bg-[#ECEDF0] dark:hover:bg-gray-700'
            )}
          >
            <div className={cn(
              'flex items-center justify-center w-5 h-5 rounded',
              isSpacesOpen ? 'bg-white/20' : 'bg-[#E5E5E7] dark:bg-gray-700'
            )}>
              {isSpacesOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </div>
            <span>Spaces</span>
            <Plus className={cn(
              'h-4 w-4 ml-auto',
              isSpacesOpen ? 'text-white/70' : 'text-[#8C8C9A]'
            )} />
          </button>

          {/* Spaces List */}
          {isSpacesOpen && (
            <div className="mt-1 space-y-0.5">
              {isLoadingSpaces ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : spaces.length > 0 ? (
                spaces.map((space) => (
                  <div key={space.id}>
                    {/* Space Item */}
                    <button
                      onClick={() => handleSpaceClick(space)}
                      className={cn(
                        'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] transition-all duration-150 group',
                        currentSpace?.id === space.id
                          ? 'bg-[#F3F0FF] dark:bg-purple-900/30 text-[#7C3AED] dark:text-purple-400'
                          : 'text-[#5C5C6D] dark:text-gray-400 hover:bg-[#F5F5F7] dark:hover:bg-gray-800'
                      )}
                    >
                      <ChevronRight
                        className={cn(
                          'h-3.5 w-3.5 transition-transform duration-200',
                          expandedSpaces.includes(space.id) && 'rotate-90'
                        )}
                      />
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: space.color || '#7C3AED' }}
                      />
                      <span className="flex-1 text-left truncate font-medium">
                        {space.name}
                      </span>
                      <MoreHorizontal className="h-4 w-4 opacity-0 group-hover:opacity-100 text-[#8C8C9A]" />
                    </button>

                    {/* Lists under Space */}
                    {expandedSpaces.includes(space.id) && (
                      <div className="ml-4 mt-0.5 space-y-0.5">
                        {lists.map((list) => (
                          <button
                            key={list.id}
                            onClick={() => handleListClick(list)}
                            className={cn(
                              'flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-[12px] transition-all duration-150',
                              currentList?.id === list.id
                                ? 'bg-[#E8E6FA] dark:bg-purple-900/40 text-[#6E62E5] dark:text-purple-400 font-medium'
                                : 'text-[#5C5C6D] dark:text-gray-400 hover:bg-[#F5F5F7] dark:hover:bg-gray-800'
                            )}
                          >
                            <List className="h-3.5 w-3.5" />
                            <span className="truncate">{list.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-center">
                  <p className="text-[12px] text-[#8C8C9A] dark:text-gray-500">No spaces found</p>
                  <button className="mt-2 text-[12px] text-[#7C3AED] dark:text-purple-400 hover:underline">
                    Create a space
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Settings */}
      <div className="p-2 border-t border-[#ECEDF0] dark:border-gray-800">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
            pathname === '/dashboard/settings'
              ? 'bg-[#4F46E5] text-white'
              : 'text-[#5C5C6D] dark:text-gray-400 hover:bg-[#F5F5F7] dark:hover:bg-gray-800 hover:text-[#1A1A2E] dark:hover:text-white'
          )}
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.8} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;