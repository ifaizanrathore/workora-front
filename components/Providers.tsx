'use client';

import React, { useState, createContext, useContext, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/contexts/ThemeContext';

// ============================================================
// LOADING CONTEXT
// ============================================================

interface LoadingContextType {
  isPageLoading: boolean;
  loadingMessage: string;
  setPageLoading: (loading: boolean, message?: string) => void;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

/**
 * Hook to access global loading state
 * @example
 * const { startLoading, stopLoading } = useLoading();
 * 
 * const handleSave = async () => {
 *   startLoading('Saving...');
 *   await api.save();
 *   stopLoading();
 * };
 */
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    // Return a safe default if used outside provider
    return {
      isPageLoading: false,
      loadingMessage: '',
      setPageLoading: () => {},
      startLoading: () => {},
      stopLoading: () => {},
    };
  }
  return context;
};

// ============================================================
// PROVIDERS COMPONENT
// ============================================================

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  // React Query Client
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Global Loading State
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const setPageLoading = useCallback((loading: boolean, message = 'Loading...') => {
    setIsPageLoading(loading);
    setLoadingMessage(message);
  }, []);

  const startLoading = useCallback((message = 'Loading...') => {
    setIsPageLoading(true);
    setLoadingMessage(message);
  }, []);

  const stopLoading = useCallback(() => {
    setIsPageLoading(false);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <LoadingContext.Provider
          value={{
            isPageLoading,
            loadingMessage,
            setPageLoading,
            startLoading,
            stopLoading,
          }}
        >
          {children}

          {/* Toast Notifications */}
          <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1E1F21',
              color: '#fff',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#12A594',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#FF4D4D',
                secondary: '#fff',
              },
            },
          }}
        />
        </LoadingContext.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// ============================================================
// UTILITY COMPONENTS
// ============================================================

/**
 * Page transition wrapper with optional skeleton support
 */
interface PageTransitionProps {
  children: React.ReactNode;
  isLoading?: boolean;
  skeleton?: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  isLoading = false,
  skeleton,
  className = '',
}) => {
  if (isLoading && skeleton) {
    return <div className="animate-in fade-in duration-200">{skeleton}</div>;
  }

  return (
    <div className={`animate-in fade-in duration-300 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Loading overlay toast that appears at bottom of screen
 */
interface LoadingOverlayProps {
  message?: string;
  show?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  show = true,
}) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-full shadow-lg border border-gray-200">
        <div className="flex gap-1">
          <div 
            className="w-2 h-2 bg-[#5B4FD1] rounded-full animate-bounce" 
            style={{ animationDelay: '0ms' }} 
          />
          <div 
            className="w-2 h-2 bg-[#5B4FD1] rounded-full animate-bounce" 
            style={{ animationDelay: '150ms' }} 
          />
          <div 
            className="w-2 h-2 bg-[#5B4FD1] rounded-full animate-bounce" 
            style={{ animationDelay: '300ms' }} 
          />
        </div>
        <span className="text-sm font-medium text-gray-600">{message}</span>
      </div>
    </div>
  );
};

/**
 * Full page loader with spinner
 */
interface FullPageLoaderProps {
  message?: string;
}

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FAFBFC]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full" />
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#5B4FD1] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-medium text-gray-600">{message}</p>
      </div>
    </div>
  );
};

/**
 * Loading wrapper that shows skeleton or children
 */
interface LoadingWrapperProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  isLoading,
  skeleton,
  children,
}) => {
  if (isLoading) {
    return <>{skeleton}</>;
  }
  return <>{children}</>;
};

export default Providers;