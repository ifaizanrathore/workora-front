'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Bell,
  Palette,
  Link2,
  Clock,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Check,
  ExternalLink,
  Globe,
  Mail,
  Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, useWorkspaceStore, useUIStore } from '@/stores';
import { useTheme } from '@/contexts/ThemeContext';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

// localStorage keys
const STORAGE_KEYS = {
  timezone: 'workora-timezone',
  notifications: 'workora-notifications',
  accountability: 'workora-accountability',
  compactRows: 'workora-compact-rows',
} as const;

// Toggle switch component
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
  checked,
  onChange,
  disabled,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#6E62E5]/30',
      checked ? 'bg-[#6E62E5]' : 'bg-gray-300 dark:bg-gray-600',
      disabled && 'opacity-50 cursor-not-allowed'
    )}
  >
    <span
      className={cn(
        'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
        checked ? 'translate-x-6' : 'translate-x-1'
      )}
    />
  </button>
);

// Setting row component
const SettingRow: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <div className="flex items-center justify-between py-4">
    <div className="flex-1 min-w-0 mr-4">
      <p className="text-sm font-medium text-[#1A1A2E] dark:text-white">{title}</p>
      <p className="text-xs text-[#8C8C9A] dark:text-gray-400 mt-0.5">{description}</p>
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

// Settings sections
const settingsSections = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'appearance', icon: Palette, label: 'Appearance' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'accountability', icon: Clock, label: 'Accountability' },
  { id: 'integrations', icon: Link2, label: 'Integrations' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const [activeSection, setActiveSection] = useState('profile');

  const handleLogout = () => {
    localStorage.removeItem('token');
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-full bg-[#F8F9FB] dark:bg-gray-950">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-900 border-r border-[#ECEDF0] dark:border-gray-800 flex flex-col">
        <div className="p-5">
          <h1 className="text-lg font-bold text-[#1A1A2E] dark:text-white">Settings</h1>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#F3F0FF] dark:bg-purple-900/30 text-[#6E62E5] dark:text-purple-300'
                    : 'text-[#5C5C6D] dark:text-gray-400 hover:bg-[#F5F7FA] dark:hover:bg-gray-800 hover:text-[#1A1A2E] dark:hover:text-white'
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                {section.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#ECEDF0] dark:border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">
          {activeSection === 'profile' && <ProfileSection user={user} workspace={currentWorkspace} />}
          {activeSection === 'appearance' && <AppearanceSection />}
          {activeSection === 'notifications' && <NotificationsSection />}
          {activeSection === 'accountability' && <AccountabilitySection />}
          {activeSection === 'integrations' && <IntegrationsSection workspace={currentWorkspace} />}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Profile Section
// ──────────────────────────────────────────
const ProfileSection: React.FC<{ user: any; workspace: any }> = ({ user, workspace }) => {
  const { setUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.username || '');
  const [timezone, setTimezone] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.timezone) || Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  });
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = () => {
    setSaving(true);
    // Update auth store with new display name
    if (user) {
      setUser({ ...user, username: displayName });
    }
    // Persist timezone
    localStorage.setItem(STORAGE_KEYS.timezone, timezone);
    setTimeout(() => {
      setSaving(false);
      toast.success('Profile saved successfully');
    }, 300);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1A1A2E] dark:text-white mb-1">Profile</h2>
      <p className="text-sm text-[#8C8C9A] dark:text-gray-400 mb-6">Your personal information synced from ClickUp</p>

      {/* Avatar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#ECEDF0] dark:border-gray-800 p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar
              src={user?.profilePicture}
              name={displayName || user?.username || 'User'}
              size="xl"
            />
            <button
              onClick={() => toast('Profile photos are managed in ClickUp', { icon: '📷' })}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#6E62E5] rounded-full flex items-center justify-center text-white shadow-md hover:bg-[#5B4FD1] transition-colors"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <p className="text-base font-semibold text-[#1A1A2E] dark:text-white">
              {displayName || user?.username || 'User'}
            </p>
            <p className="text-sm text-[#8C8C9A] dark:text-gray-400">{user?.email || 'No email'}</p>
            <p className="text-xs text-[#B0B0C0] dark:text-gray-500 mt-1">
              Workspace: {workspace?.name || 'Not connected'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#ECEDF0] dark:border-gray-800 p-6">
        <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white mb-4">Account Details</h3>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-[#8C8C9A] dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Display Name
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8C8C9A] dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Email Address
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={user?.email || ''}
                disabled
                className="flex-1"
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </div>
            <p className="text-xs text-[#B0B0C0] dark:text-gray-500 mt-1.5">
              Email is synced from ClickUp and cannot be changed here
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8C8C9A] dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Timezone
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] dark:text-gray-500" />
              <select
                className="w-full h-9 pl-10 pr-3 rounded-md border border-[#ECEDF0] dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-[#1A1A2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6E62E5]/20 focus:border-[#6E62E5] appearance-none cursor-pointer"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="America/New_York">America/New York (EST)</option>
                <option value="America/Chicago">America/Chicago (CST)</option>
                <option value="America/Denver">America/Denver (MST)</option>
                <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="!bg-[#6E62E5] hover:!bg-[#5B4FD1] !text-white"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────
// Appearance Section
// ──────────────────────────────────────────
const AppearanceSection: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const [compactRows, setCompactRows] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.compactRows) === 'true';
    }
    return false;
  });

  const themes = [
    { id: 'light' as const, icon: Sun, label: 'Light', description: 'Clean white interface' },
    { id: 'dark' as const, icon: Moon, label: 'Dark', description: 'Easy on the eyes' },
    { id: 'system' as const, icon: Monitor, label: 'System', description: 'Match your OS' },
  ];

  const handleCompactSidebar = (value: boolean) => {
    setSidebarOpen(!value);
    toast.success(value ? 'Sidebar collapsed' : 'Sidebar expanded');
  };

  const handleCompactRows = (value: boolean) => {
    setCompactRows(value);
    localStorage.setItem(STORAGE_KEYS.compactRows, String(value));
    toast.success(value ? 'Compact rows enabled' : 'Compact rows disabled');
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1A1A2E] dark:text-white mb-1">Appearance</h2>
      <p className="text-sm text-[#8C8C9A] dark:text-gray-400 mb-6">Customize how Workora looks on your device</p>

      {/* Theme Selector */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#ECEDF0] dark:border-gray-800 p-6 mb-6">
        <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.id;

            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  'flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all',
                  isActive
                    ? 'border-[#6E62E5] bg-[#F3F0FF] dark:bg-purple-900/20'
                    : 'border-[#ECEDF0] dark:border-gray-700 hover:border-[#6E62E5]/40'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  isActive
                    ? 'bg-[#6E62E5] text-white'
                    : 'bg-[#F5F7FA] dark:bg-gray-800 text-[#9CA3AF] dark:text-gray-500'
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <span className={cn(
                    'text-sm font-medium block',
                    isActive ? 'text-[#6E62E5]' : 'text-[#1A1A2E] dark:text-white'
                  )}>
                    {t.label}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF] dark:text-gray-500">{t.description}</span>
                </div>
                {isActive && (
                  <div className="w-5 h-5 bg-[#6E62E5] rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Density */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#ECEDF0] dark:border-gray-800 p-6">
        <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white mb-2">Layout</h3>
        <div className="divide-y divide-[#ECEDF0] dark:divide-gray-800">
          <SettingRow title="Compact sidebar" description="Collapse sidebar to icons only by default">
            <Toggle checked={!sidebarOpen} onChange={handleCompactSidebar} />
          </SettingRow>
          <SettingRow title="Compact task rows" description="Reduce vertical spacing in task list">
            <Toggle checked={compactRows} onChange={handleCompactRows} />
          </SettingRow>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────
// Notifications Section
// ──────────────────────────────────────────
const defaultNotifications = {
  etaReminders: true,
  overdueAlerts: true,
  commentMentions: true,
  statusChanges: false,
};

const NotificationsSection: React.FC = () => {
  const [notifications, setNotifications] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.notifications);
        if (saved) return { ...defaultNotifications, ...JSON.parse(saved) };
      } catch { /* ignore */ }
    }
    return defaultNotifications;
  });

  const updateNotification = (key: keyof typeof defaultNotifications, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(updated));
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1A1A2E] dark:text-white mb-1">Notifications</h2>
      <p className="text-sm text-[#8C8C9A] dark:text-gray-400 mb-6">Control which notifications you receive</p>

      {/* Task Notifications */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#ECEDF0] dark:border-gray-800 p-6 mb-6">
        <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white mb-2">Task Alerts</h3>
        <div className="divide-y divide-[#ECEDF0] dark:divide-gray-800">
          <SettingRow title="ETA reminders" description="Notify before task deadlines are due">
            <Toggle checked={notifications.etaReminders} onChange={(v) => updateNotification('etaReminders', v)} />
          </SettingRow>
          <SettingRow title="Overdue alerts" description="Alert when tasks go past their deadline">
            <Toggle checked={notifications.overdueAlerts} onChange={(v) => updateNotification('overdueAlerts', v)} />
          </SettingRow>
          <SettingRow title="Status changes" description="Notify when task status is updated">
            <Toggle checked={notifications.statusChanges} onChange={(v) => updateNotification('statusChanges', v)} />
          </SettingRow>
        </div>
      </div>

      {/* Social Notifications */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#ECEDF0] dark:border-gray-800 p-6">
        <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white mb-2">Activity</h3>
        <div className="divide-y divide-[#ECEDF0] dark:divide-gray-800">
          <SettingRow title="Comment mentions" description="When someone @mentions you in a comment">
            <Toggle checked={notifications.commentMentions} onChange={(v) => updateNotification('commentMentions', v)} />
          </SettingRow>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────
// Accountability Section
// ──────────────────────────────────────────
const defaultAccountability = { maxStrikes: 3, graceHours: 24 };

const AccountabilitySection: React.FC = () => {
  const [settings, setSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.accountability);
        if (saved) return { ...defaultAccountability, ...JSON.parse(saved) };
      } catch { /* ignore */ }
    }
    return defaultAccountability;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem(STORAGE_KEYS.accountability, JSON.stringify(settings));
    setTimeout(() => {
      setSaving(false);
      toast.success('Accountability settings saved');
    }, 300);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1A1A2E] dark:text-white mb-1">Accountability</h2>
      <p className="text-sm text-[#8C8C9A] dark:text-gray-400 mb-6">Configure the strike system and ETA rules</p>

      {/* Strike Config */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#ECEDF0] dark:border-gray-800 p-6 mb-6">
        <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white mb-4">Strike System</h3>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-[#8C8C9A] dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Maximum Strikes
            </label>
            <select
              value={settings.maxStrikes}
              onChange={(e) => setSettings((s: typeof defaultAccountability) => ({ ...s, maxStrikes: Number(e.target.value) }))}
              className="w-full h-9 px-3 rounded-md border border-[#ECEDF0] dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-[#1A1A2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6E62E5]/20 focus:border-[#6E62E5] appearance-none cursor-pointer"
            >
              <option value={2}>2 strikes</option>
              <option value={3}>3 strikes (default)</option>
              <option value={4}>4 strikes</option>
              <option value={5}>5 strikes</option>
            </select>
            <p className="text-xs text-[#B0B0C0] dark:text-gray-500 mt-1">
              Number of ETA extensions allowed before RED status
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8C8C9A] dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Grace Period
            </label>
            <select
              value={settings.graceHours}
              onChange={(e) => setSettings((s: typeof defaultAccountability) => ({ ...s, graceHours: Number(e.target.value) }))}
              className="w-full h-9 px-3 rounded-md border border-[#ECEDF0] dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-[#1A1A2E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6E62E5]/20 focus:border-[#6E62E5] appearance-none cursor-pointer"
            >
              <option value={12}>12 hours</option>
              <option value={24}>24 hours (default)</option>
              <option value={48}>48 hours</option>
              <option value={72}>72 hours</option>
            </select>
            <p className="text-xs text-[#B0B0C0] dark:text-gray-500 mt-1">
              Additional time before a strike is applied after missing an ETA
            </p>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="!bg-[#6E62E5] hover:!bg-[#5B4FD1] !text-white"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#ECEDF0] dark:border-gray-800 p-6">
        <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white mb-4">Status Legend</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div>
              <span className="text-sm font-medium text-[#1A1A2E] dark:text-white">Green</span>
              <span className="text-xs text-[#8C8C9A] dark:text-gray-400 ml-2">0 strikes — On track</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div>
              <span className="text-sm font-medium text-[#1A1A2E] dark:text-white">Orange</span>
              <span className="text-xs text-[#8C8C9A] dark:text-gray-400 ml-2">1–2 strikes — At risk</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div>
              <span className="text-sm font-medium text-[#1A1A2E] dark:text-white">Red</span>
              <span className="text-xs text-[#8C8C9A] dark:text-gray-400 ml-2">3+ strikes — Critical</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────
// Integrations Section
// ──────────────────────────────────────────
const IntegrationsSection: React.FC<{ workspace: any }> = ({ workspace }) => {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1A1A2E] dark:text-white mb-1">Integrations</h2>
      <p className="text-sm text-[#8C8C9A] dark:text-gray-400 mb-6">Manage your connected services</p>

      {/* ClickUp */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#ECEDF0] dark:border-gray-800 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4.5 15.5L12 8L19.5 15.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#1A1A2E] dark:text-white">ClickUp</h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Connected
              </span>
            </div>
            <p className="text-xs text-[#8C8C9A] dark:text-gray-400 mt-0.5">
              Syncing tasks, comments, and accountability data
            </p>
          </div>
        </div>

        {/* Workspace details */}
        <div className="mt-5 pt-5 border-t border-[#ECEDF0] dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8C8C9A] dark:text-gray-400">Workspace</span>
            <span className="text-xs font-medium text-[#1A1A2E] dark:text-white">
              {workspace?.name || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8C8C9A] dark:text-gray-400">Workspace ID</span>
            <code className="text-xs font-mono text-[#1A1A2E] dark:text-gray-300 bg-[#F5F7FA] dark:bg-gray-800 px-2 py-0.5 rounded">
              {workspace?.id || '—'}
            </code>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-[#ECEDF0] dark:border-gray-800 flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (workspace?.id) {
                window.open(`https://app.clickup.com/${workspace.id}`, '_blank');
              }
            }}
            className="dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Open in ClickUp
          </Button>
        </div>
      </div>
    </div>
  );
};
