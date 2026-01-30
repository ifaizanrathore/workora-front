'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, ArrowRight, Sparkles, Shield, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { cn } from '@/lib/utils';

// Workora Logo Component
const WorkoraLogo = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="#6E62E5"/>
    <path d="M12 18L24 30L36 18" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="24" cy="14" r="4" fill="white"/>
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
  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h3 className="font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary mt-0.5">{description}</p>
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
      router.replace('/home');
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
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-hover to-purple-700 p-12 flex-col justify-between relative overflow-hidden">
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
              <h1 className="text-xl font-bold text-text-primary">Workora</h1>
              <p className="text-text-secondary text-sm">1.0V</p>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-text-primary">Welcome back</h2>
            <p className="text-text-secondary mt-2">
              Sign in to access your workspace and tasks
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Login Button */}
          <div className="space-y-4">
            <Button
              onClick={handleClickUpLogin}
              isLoading={isLoading}
              className="w-full h-12 text-base gap-3"
              size="lg"
            >
              {!isLoading && <ClickUpLogo />}
              Continue with ClickUp
              {!isLoading && <ArrowRight className="w-4 h-4 ml-auto" />}
            </Button>

            <p className="text-center text-sm text-text-tertiary">
              By signing in, you agree to our{' '}
              <a href="#" className="text-primary hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-background text-text-tertiary">
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
