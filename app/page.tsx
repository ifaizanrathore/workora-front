'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Initializing...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);

    // Check for token in localStorage (runs only on client)
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');

        if (token) {
          setMessage('Loading your workspace...');
          setProgress(100);
          // Token exists - go to dashboard home
          router.replace('/dashboard/home');
        } else {
          setMessage('Redirecting to login...');
          setProgress(100);
          // No token - go to login
          router.replace('/login');
        }
      } catch (error) {
        // localStorage not available (SSR) or error
        router.replace('/login');
      }
    };

    // Check auth immediately - no artificial delay
    checkAuth();

    return () => {
      clearInterval(progressInterval);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F7FF] via-white to-[#F3F0FF] flex flex-col items-center justify-center">
      {/* Logo and Brand */}
      <div className="flex flex-col items-center mb-8">
        {/* Animated Logo */}
        <div className="relative mb-6">
          {/* Outer glow ring */}
          <div className="absolute inset-0 w-20 h-20 bg-[#5B4FD1]/20 rounded-2xl blur-xl animate-pulse" />

          {/* Logo container */}
          <img
            src="/favicon.ico"
            alt="Workora"
            className="relative w-20 h-20 rounded-2xl shadow-lg object-contain"
          />

          {/* Spinning ring */}
          <div className="absolute -inset-2 border-2 border-[#5B4FD1]/20 rounded-3xl animate-spin" style={{ animationDuration: '3s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#5B4FD1] rounded-full" />
          </div>
        </div>

        {/* Brand name */}
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#5B4FD1] to-[#7C3AED] bg-clip-text text-transparent">
          Workora
        </h1>
        <p className="text-sm text-gray-500 mt-1">Task Management Reimagined</p>
      </div>

      {/* Progress bar */}
      <div className="w-64 mb-4">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#5B4FD1] to-[#7C3AED] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Loading message */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <div
            className="w-1.5 h-1.5 bg-[#5B4FD1] rounded-full animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '0.6s' }}
          />
          <div
            className="w-1.5 h-1.5 bg-[#5B4FD1] rounded-full animate-bounce"
            style={{ animationDelay: '150ms', animationDuration: '0.6s' }}
          />
          <div
            className="w-1.5 h-1.5 bg-[#5B4FD1] rounded-full animate-bounce"
            style={{ animationDelay: '300ms', animationDuration: '0.6s' }}
          />
        </div>
        <span className="text-sm text-gray-500">{message}</span>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-xs text-gray-400">
        © {new Date().getFullYear()} Workora. All rights reserved.
      </div>
    </div>
  );
}
