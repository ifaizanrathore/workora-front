'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SkeletonDashboardPage } from '@/components/ui/skeleton';

export default function RootPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Loading Workora...');

  useEffect(() => {
    // Check for token in localStorage (runs only on client)
    const checkAuth = () => {
      try {
        // Check multiple possible token storage locations
        const token = 
          localStorage.getItem('token') || 
          localStorage.getItem('accessToken') ||
          localStorage.getItem('workora-token');
        
        if (token) {
          setMessage('Loading your workspace...');
          // Token exists - go to dashboard, let it verify
          router.replace('/home');
        } else {
          setMessage('Redirecting to login...');
          // No token - go to login
          router.replace('/login');
        }
      } catch (error) {
        // localStorage not available (SSR) or error
        router.replace('/login');
      }
    };

    // Small delay to ensure localStorage is accessible
    const timer = setTimeout(checkAuth, 50);
    return () => clearTimeout(timer);
  }, [router]);

  // Show skeleton with loading message
  return (
    <div className="relative">
      <SkeletonDashboardPage />
      
      {/* Loading Toast */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-full shadow-lg border border-gray-200">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-[#5B4FD1] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-[#5B4FD1] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-[#5B4FD1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm font-medium text-gray-600">{message}</span>
        </div>
      </div>
    </div>
  );
}