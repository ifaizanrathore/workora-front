'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Save token first
      localStorage.setItem('token', token);
      
      // Small delay to ensure token is saved before redirect
      setTimeout(() => {
        router.replace('/dashboard');
      }, 100);
    } else {
      router.replace('/login');
    }
  }, [searchParams, router]);

  return null;
}

export default function CallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Authenticating...</p>
      </div>
      <Suspense fallback={null}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}