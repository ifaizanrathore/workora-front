'use client';

import { useEffect, useState } from 'react';

export default function RootPage() {
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

    // Check for token and redirect with hard navigation (reliable on first load)
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');

        if (token) {
          setMessage('Loading your workspace...');
          setProgress(100);
          window.location.replace('/dashboard');
        } else {
          setMessage('Redirecting to login...');
          setProgress(100);
          window.location.replace('/login');
        }
      } catch {
        window.location.replace('/login');
      }
    };

    // Small delay so splash screen is visible briefly
    const redirectTimeout = setTimeout(checkAuth, 400);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(redirectTimeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F7FF] via-white to-[#F3F0FF] flex flex-col items-center justify-center">
      {/* Logo and Brand */}
      <div className="flex flex-col items-center mb-8">
        {/* Animated Logo */}
        <div className="relative mb-6">
          {/* Outer glow ring */}
          <div className="absolute inset-0 w-20 h-20 bg-[#5B4FD1]/20 rounded-2xl blur-xl animate-pulse" />

          {/* Logo */}
          <svg className="relative w-20 h-20" viewBox="0 0 27 29" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.9909 10.4419C23.4776 10.4419 23.876 10.0466 23.835 9.56162C23.6281 7.11472 22.5635 4.80805 20.8138 3.05837C18.8555 1.10013 16.1996 2.09082e-07 13.4302 0C10.6608 -2.09082e-07 8.0049 1.10013 6.04666 3.05837C4.29698 4.80805 3.23236 7.11472 3.02543 9.56162C2.98441 10.0466 3.38284 10.4419 3.86956 10.4419H8.2535C8.74022 10.4419 9.12569 10.0433 9.22486 9.56679C9.39406 8.75384 9.79684 8.00066 10.3929 7.40461C11.1984 6.59906 12.291 6.1465 13.4302 6.1465C14.5694 6.1465 15.662 6.59906 16.4676 7.40461C17.0636 8.00066 17.4664 8.75384 17.6356 9.56679C17.7348 10.0433 18.1202 10.4419 18.6069 10.4419H22.9909Z" fill="#6E62E5"/>
            <path d="M25.1045 12.5957C25.8623 12.1053 26.862 12.6492 26.8623 13.5518V18.6748C26.8623 19.0583 26.6691 19.4163 26.3486 19.627L13.6182 27.9941L13.4326 28.1182L13.4307 28.1172V28.1182L13.2451 27.9951L0.513672 19.627C0.193182 19.4163 0 19.0583 0 18.6748L0 13.5518C0.000305045 12.6493 1.00004 12.1056 1.75781 12.5957L13.4307 20.1504L25.1045 12.5957Z" fill="#6E62E5"/>
            <path d="M19.5078 24.0898L13.4316 28.123L13.2402 27.998L7.35547 24.0898L13.4316 20.1572L19.5078 24.0898Z" fill="#6E62E5"/>
          </svg>

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
