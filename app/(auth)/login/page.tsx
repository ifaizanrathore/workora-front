'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, Sparkles, Shield, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';

// Workora Logo Component
const WorkoraLogo = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 27 29" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.9909 10.4419C23.4776 10.4419 23.876 10.0466 23.835 9.56162C23.6281 7.11472 22.5635 4.80805 20.8138 3.05837C18.8555 1.10013 16.1996 2.09082e-07 13.4302 0C10.6608 -2.09082e-07 8.0049 1.10013 6.04666 3.05837C4.29698 4.80805 3.23236 7.11472 3.02543 9.56162C2.98441 10.0466 3.38284 10.4419 3.86956 10.4419H8.2535C8.74022 10.4419 9.12569 10.0433 9.22486 9.56679C9.39406 8.75384 9.79684 8.00066 10.3929 7.40461C11.1984 6.59906 12.291 6.1465 13.4302 6.1465C14.5694 6.1465 15.662 6.59906 16.4676 7.40461C17.0636 8.00066 17.4664 8.75384 17.6356 9.56679C17.7348 10.0433 18.1202 10.4419 18.6069 10.4419H22.9909Z" fill="#6E62E5"/>
    <path d="M25.1045 12.5957C25.8623 12.1053 26.862 12.6492 26.8623 13.5518V18.6748C26.8623 19.0583 26.6691 19.4163 26.3486 19.627L13.6182 27.9941L13.4326 28.1182L13.4307 28.1172V28.1182L13.2451 27.9951L0.513672 19.627C0.193182 19.4163 0 19.0583 0 18.6748L0 13.5518C0.000305045 12.6493 1.00004 12.1056 1.75781 12.5957L13.4307 20.1504L25.1045 12.5957Z" fill="#6E62E5"/>
    <path d="M19.5078 24.0898L13.4316 28.123L13.2402 27.998L7.35547 24.0898L13.4316 20.1572L19.5078 24.0898Z" fill="#6E62E5"/>
  </svg>
);

// ClickUp Logo Component
const ClickUpLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 15.5L12 8L19.5 15.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10">
    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary dark:text-primary-light">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h3 className="font-semibold text-text-primary dark:text-white">{title}</h3>
      <p className="text-sm text-text-secondary dark:text-gray-400 mt-0.5">{description}</p>
    </div>
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Handle OAuth callback error
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const handleClickUpLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const authUrl = await api.getClickUpAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to initiate login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-hover to-purple-700 dark:from-[#2D2573] dark:via-[#3B2F8A] dark:to-[#1E1650] p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <WorkoraLogo size={56} />
            <div>
              <h1 className="text-2xl font-bold text-white">Workora</h1>
              <p className="text-white/70 text-sm">Task Management & Accountability</p>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Supercharge your productivity with accountability
            </h2>
            <p className="text-lg text-white/80">
              Connect your ClickUp workspace and transform how you manage tasks with ETA tracking, 
              smart reminders, and team accountability.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-white/90">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span>Seamless ClickUp Integration</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              <Clock className="w-4 h-4" />
            </div>
            <span>Real-time ETA & Deadline Tracking</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              <Shield className="w-4 h-4" />
            </div>
            <span>Accountability Strike System</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              <Users className="w-4 h-4" />
            </div>
            <span>Team Collaboration & Discussion</span>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-white/50 text-sm">
          © 2024 Workora. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <WorkoraLogo size={48} />
            <div>
              <h1 className="text-xl font-bold text-text-primary dark:text-white">Workora</h1>
              <p className="text-text-secondary dark:text-gray-400 text-sm">1.0V</p>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-text-primary dark:text-white">Welcome back</h2>
            <p className="text-text-secondary dark:text-gray-400 mt-2">
              Sign in to access your workspace and tasks
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Login Button */}
          <div className="space-y-4">
            <Button
              onClick={handleClickUpLogin}
              isLoading={isLoading}
              className="w-full h-12 text-base gap-3 !bg-[#6E62E5] hover:!bg-[#5B4FD1] !text-white"
              size="lg"
            >
              {!isLoading && <ClickUpLogo />}
              Continue with ClickUp
              {!isLoading && <ArrowRight className="w-4 h-4 ml-auto" />}
            </Button>

            <p className="text-center text-sm text-text-tertiary dark:text-gray-500">
              By signing in, you agree to our{' '}
              <a href="#" className="text-primary dark:text-primary-light hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary dark:text-primary-light hover:underline">Privacy Policy</a>
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-background text-text-tertiary dark:text-gray-500">
                Powered by ClickUp OAuth
              </span>
            </div>
          </div>

          {/* Feature Cards (Mobile) */}
          <div className="lg:hidden space-y-3">
            <FeatureCard
              icon={Sparkles}
              title="AI-Powered"
              description="Smart task extraction and insights"
            />
            <FeatureCard
              icon={Clock}
              title="ETA Tracking"
              description="Never miss a deadline again"
            />
            <FeatureCard
              icon={Shield}
              title="Accountability"
              description="Stay on track with strike system"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
