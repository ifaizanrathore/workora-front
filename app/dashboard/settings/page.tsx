'use client';

import React, { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Palette,
  Clock,
  Link,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, useUIStore } from '@/stores';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

// Settings sections
const settingsSections = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'appearance', icon: Palette, label: 'Appearance' },
  { id: 'integrations', icon: Link, label: 'Integrations' },
  { id: 'accountability', icon: Clock, label: 'Accountability' },
  { id: 'privacy', icon: Shield, label: 'Privacy & Security' },
];

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [activeSection, setActiveSection] = useState('profile');

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-border p-4">
        <h1 className="text-xl font-bold text-text-primary mb-6">Settings</h1>

        <nav className="space-y-1">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-background-hover hover:text-text-primary'
                )}
              >
                <Icon className="h-5 w-5" />
                {section.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-error hover:bg-red-50 hover:text-error"
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeSection === 'profile' && <ProfileSection user={user} />}
        {activeSection === 'notifications' && <NotificationsSection />}
        {activeSection === 'appearance' && <AppearanceSection theme={theme} setTheme={setTheme} />}
        {activeSection === 'integrations' && <IntegrationsSection />}
        {activeSection === 'accountability' && <AccountabilitySection />}
        {activeSection === 'privacy' && <PrivacySection />}
      </div>
    </div>
  );
}

// Profile Section
const ProfileSection: React.FC<{ user: any }> = ({ user }) => {
  const [name, setName] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Profile</h2>

      {/* Avatar */}
      <div className="flex items-center gap-6 mb-8">
        <Avatar
          src={user?.profilePicture}
          name={user?.username || 'User'}
          size="xl"
        />
        <div>
          <Button variant="secondary" size="sm">
            Change Photo
          </Button>
          <p className="text-xs text-text-tertiary mt-2">
            JPG, GIF or PNG. Max size 2MB
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Display Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Email Address
          </label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled
          />
          <p className="text-xs text-text-tertiary mt-1">
            Email is synced from ClickUp and cannot be changed
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Timezone
          </label>
          <select className="w-full h-9 px-3 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            <option>America/New_York (UTC-5)</option>
            <option>America/Los_Angeles (UTC-8)</option>
            <option>Europe/London (UTC+0)</option>
            <option>Asia/Tokyo (UTC+9)</option>
          </select>
        </div>

        <Button>Save Changes</Button>
      </div>
    </div>
  );
};

// Notifications Section
const NotificationsSection: React.FC = () => {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [etaReminders, setEtaReminders] = useState(true);
  const [commentMentions, setCommentMentions] = useState(true);

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Notifications</h2>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-border p-6">
          <h3 className="font-semibold text-text-primary mb-4">Notification Channels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">Email Notifications</p>
                <p className="text-sm text-text-secondary">Receive notifications via email</p>
              </div>
              <Checkbox checked={emailNotifs} onCheckedChange={(c) => setEmailNotifs(!!c)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">Push Notifications</p>
                <p className="text-sm text-text-secondary">Browser push notifications</p>
              </div>
              <Checkbox checked={pushNotifs} onCheckedChange={(c) => setPushNotifs(!!c)} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border p-6">
          <h3 className="font-semibold text-text-primary mb-4">Notification Types</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">ETA Reminders</p>
                <p className="text-sm text-text-secondary">Notify before deadlines</p>
              </div>
              <Checkbox checked={etaReminders} onCheckedChange={(c) => setEtaReminders(!!c)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">Comment Mentions</p>
                <p className="text-sm text-text-secondary">When someone @mentions you</p>
              </div>
              <Checkbox checked={commentMentions} onCheckedChange={(c) => setCommentMentions(!!c)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Appearance Section
const AppearanceSection: React.FC<{ theme: string; setTheme: (t: 'light' | 'dark' | 'system') => void }> = ({
  theme,
  setTheme,
}) => {
  const themes = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Appearance</h2>

      <div className="bg-white rounded-lg border border-border p-6">
        <h3 className="font-semibold text-text-primary mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.id;

            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as 'light' | 'dark' | 'system')}
                className={cn(
                  'flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-colors',
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Icon className={cn('h-8 w-8', isActive ? 'text-primary' : 'text-text-tertiary')} />
                <span className={cn('text-sm font-medium', isActive ? 'text-primary' : 'text-text-secondary')}>
                  {t.label}
                </span>
                {isActive && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-6 mt-6">
        <h3 className="font-semibold text-text-primary mb-4">Sidebar</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-text-primary">Compact Mode</p>
            <p className="text-sm text-text-secondary">Reduce sidebar width for more space</p>
          </div>
          <Checkbox />
        </div>
      </div>
    </div>
  );
};

// Integrations Section
const IntegrationsSection: React.FC = () => {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Integrations</h2>

      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4.5 15.5L12 8L19.5 15.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">ClickUp</h3>
            <p className="text-sm text-text-secondary">Your workspace is connected</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-sm text-success font-medium">Connected</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-text-secondary mb-2">Workspace ID</p>
          <code className="text-sm text-text-primary bg-background px-2 py-1 rounded">
            workspace_xxxxx
          </code>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-6 mt-6 opacity-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
            <span className="text-2xl">📧</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">Email Integration</h3>
            <p className="text-sm text-text-secondary">Coming soon</p>
          </div>
          <Button variant="secondary" size="sm" disabled>
            Connect
          </Button>
        </div>
      </div>
    </div>
  );
};

// Accountability Section
const AccountabilitySection: React.FC = () => {
  const [maxStrikes, setMaxStrikes] = useState(3);
  const [graceHours, setGraceHours] = useState(24);

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Accountability</h2>

      <div className="bg-white rounded-lg border border-border p-6">
        <h3 className="font-semibold text-text-primary mb-4">Strike System</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Maximum Strikes
            </label>
            <select
              value={maxStrikes}
              onChange={(e) => setMaxStrikes(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value={2}>2 strikes</option>
              <option value={3}>3 strikes</option>
              <option value={4}>4 strikes</option>
              <option value={5}>5 strikes</option>
            </select>
            <p className="text-xs text-text-tertiary mt-1">
              Number of extensions before RED status
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Default Grace Period
            </label>
            <select
              value={graceHours}
              onChange={(e) => setGraceHours(Number(e.target.value))}
              className="w-full h-9 px-3 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
              <option value={72}>72 hours</option>
            </select>
            <p className="text-xs text-text-tertiary mt-1">
              Additional time before strike is applied
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-6 mt-6">
        <h3 className="font-semibold text-text-primary mb-4">Status Colors</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-sm text-text-primary">GREEN - 0 strikes</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-amber-500" />
            <span className="text-sm text-text-primary">ORANGE - 1-2 strikes</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-sm text-text-primary">RED - 3+ strikes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Privacy Section
const PrivacySection: React.FC = () => {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Privacy & Security</h2>

      <div className="bg-white rounded-lg border border-border p-6">
        <h3 className="font-semibold text-text-primary mb-4">Data & Privacy</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Task Visibility</p>
              <p className="text-sm text-text-secondary">Control who can see your tasks</p>
            </div>
            <ChevronRight className="h-5 w-5 text-text-tertiary" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Activity Sharing</p>
              <p className="text-sm text-text-secondary">Share progress with team</p>
            </div>
            <Checkbox defaultChecked />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-6 mt-6">
        <h3 className="font-semibold text-text-primary mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">Export Data</p>
              <p className="text-sm text-text-secondary">Download all your data</p>
            </div>
            <Button variant="secondary" size="sm">
              Export
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-error">Delete Account</p>
              <p className="text-sm text-text-secondary">Permanently delete your account</p>
            </div>
            <Button variant="danger" size="sm">
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
