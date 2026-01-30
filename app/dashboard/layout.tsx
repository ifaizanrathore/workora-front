'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout';
import { useAuthStore } from '@/stores';
import { useProfile } from '@/hooks';
import { SkeletonDashboardPage } from '@/components/ui/skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const hasCheckedAuth = useRef(false);
  
  // First, check if token exists in localStorage
  useEffect(() => {
    const token = 
      localStorage.getItem('token') || 
      localStorage.getItem('accessToken') ||
      localStorage.getItem('workora-token');
    
    setHasToken(!!token);
    
    // If no token, redirect immediately
    if (!token) {
      setLoadingMessage('Redirecting to login...');
      router.replace('/login');
    } else {
      setLoadingMessage('Loading your workspace...');
    }
  }, [router]);

  // Only fetch profile if we have a token and no user yet
  const shouldFetchProfile = hasToken === true && !user && !hasCheckedAuth.current;
  
  const { data: profile, isLoading: profileLoading, error } = useProfile({
    enabled: shouldFetchProfile,
    retry: false,
  });

  // Set user when profile is fetched
  useEffect(() => {
    if (profile && !hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      setUser(profile);
    }
  }, [profile, setUser]);

  // Handle profile fetch error (invalid/expired token)
  useEffect(() => {
    if (error && !hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('workora-token');
      setLoadingMessage('Session expired, redirecting...');
      router.replace('/login');
    }
  }, [error, router]);

  // Still checking for token or loading profile
  if (hasToken === null || (profileLoading && !user) || hasToken === false) {
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
            <span className="text-sm font-medium text-gray-600">{loadingMessage}</span>
          </div>
        </div>
      </div>
    );
  }

  // Profile loaded or user exists - render layout
  if (user || profile) {
    return (
      <div className="animate-in fade-in duration-300">
        <Layout>{children}</Layout>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="relative">
      <SkeletonDashboardPage />
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-full shadow-lg border border-gray-200">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-[#5B4FD1] rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-[#5B4FD1] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-[#5B4FD1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm font-medium text-gray-600">Loading...</span>
        </div>
      </div>
    </div>
  );
}