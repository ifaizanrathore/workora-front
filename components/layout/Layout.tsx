'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { TimeTracker } from '@/components/ui/TimeTracker';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen bg-[#F8F9FB] dark:bg-gray-950 overflow-hidden transition-colors">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#F8F9FB] dark:bg-gray-950 transition-colors">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Time Tracker Widget */}
      <TimeTracker />
    </div>
  );
};

export default Layout;