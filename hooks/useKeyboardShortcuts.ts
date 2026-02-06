'use client';

import { useEffect, useCallback, useRef } from 'react';

// ============================================================
// TYPES
// ============================================================

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description?: string;
  handler: (e: KeyboardEvent) => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  enableInInputs?: boolean;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

const isInputElement = (element: Element | null): boolean => {
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    (element as HTMLElement).isContentEditable
  );
};

const normalizeKey = (key: string): string => {
  const keyMap: Record<string, string> = {
    'escape': 'Escape',
    'esc': 'Escape',
    'enter': 'Enter',
    'return': 'Enter',
    'space': ' ',
    'spacebar': ' ',
    'up': 'ArrowUp',
    'down': 'ArrowDown',
    'left': 'ArrowLeft',
    'right': 'ArrowRight',
    'delete': 'Delete',
    'del': 'Delete',
    'backspace': 'Backspace',
    'tab': 'Tab',
  };
  return keyMap[key.toLowerCase()] || key;
};

const matchesShortcut = (e: KeyboardEvent, shortcut: ShortcutConfig): boolean => {
  const key = normalizeKey(shortcut.key);
  const eventKey = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const shortcutKey = key.length === 1 ? key.toLowerCase() : key;

  if (eventKey !== shortcutKey) return false;
  if (shortcut.ctrl && !e.ctrlKey) return false;
  if (shortcut.shift && !e.shiftKey) return false;
  if (shortcut.alt && !e.altKey) return false;
  if (shortcut.meta && !e.metaKey) return false;

  // Check that unwanted modifiers aren't pressed
  if (!shortcut.ctrl && e.ctrlKey && shortcut.key !== 'Control') return false;
  if (!shortcut.alt && e.altKey && shortcut.key !== 'Alt') return false;
  if (!shortcut.meta && e.metaKey && shortcut.key !== 'Meta') return false;

  return true;
};

// ============================================================
// HOOK: useKeyboardShortcuts
// ============================================================

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, enableInInputs = false } = options;
  const shortcutsRef = useRef(shortcuts);

  // Keep shortcuts ref up to date
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Skip if user is typing in an input (unless enabled)
      if (!enableInInputs && isInputElement(document.activeElement)) return;

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.enabled === false) continue;

        if (matchesShortcut(e, shortcut)) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
            e.stopPropagation();
          }
          shortcut.handler(e);
          return;
        }
      }
    },
    [enabled, enableInInputs]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// ============================================================
// HOOK: useGlobalShortcuts (for app-wide shortcuts)
// ============================================================

interface GlobalShortcutHandlers {
  onNewTask?: () => void;
  onSearch?: () => void;
  onToggleTheme?: () => void;
  onToggleSidebar?: () => void;
  onGoHome?: () => void;
  onGoSettings?: () => void;
  onShowHelp?: () => void;
  onEscape?: () => void;
}

export function useGlobalShortcuts(handlers: GlobalShortcutHandlers) {
  const shortcuts: ShortcutConfig[] = [];

  // Ctrl/Cmd + N - New task
  if (handlers.onNewTask) {
    shortcuts.push({
      key: 'n',
      ctrl: true,
      description: 'Create new task',
      handler: () => handlers.onNewTask?.(),
    });
  }

  // Ctrl/Cmd + K or / - Search
  if (handlers.onSearch) {
    shortcuts.push({
      key: 'k',
      ctrl: true,
      description: 'Open search',
      handler: () => handlers.onSearch?.(),
    });
    shortcuts.push({
      key: '/',
      description: 'Open search',
      handler: () => handlers.onSearch?.(),
    });
  }

  // Ctrl/Cmd + D - Toggle theme
  if (handlers.onToggleTheme) {
    shortcuts.push({
      key: 'd',
      ctrl: true,
      shift: true,
      description: 'Toggle dark mode',
      handler: () => handlers.onToggleTheme?.(),
    });
  }

  // Ctrl/Cmd + B - Toggle sidebar
  if (handlers.onToggleSidebar) {
    shortcuts.push({
      key: 'b',
      ctrl: true,
      description: 'Toggle sidebar',
      handler: () => handlers.onToggleSidebar?.(),
    });
  }

  // G then H - Go to home
  if (handlers.onGoHome) {
    shortcuts.push({
      key: 'h',
      alt: true,
      description: 'Go to home',
      handler: () => handlers.onGoHome?.(),
    });
  }

  // G then S - Go to settings
  if (handlers.onGoSettings) {
    shortcuts.push({
      key: 's',
      alt: true,
      shift: true,
      description: 'Go to settings',
      handler: () => handlers.onGoSettings?.(),
    });
  }

  // ? - Show keyboard shortcuts help
  if (handlers.onShowHelp) {
    shortcuts.push({
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      handler: () => handlers.onShowHelp?.(),
    });
  }

  // Escape - Close modal/panel
  if (handlers.onEscape) {
    shortcuts.push({
      key: 'Escape',
      description: 'Close modal',
      handler: () => handlers.onEscape?.(),
      enableInInputs: true,
    } as ShortcutConfig & { enableInInputs?: boolean });
  }

  useKeyboardShortcuts(shortcuts);
}

// ============================================================
// HOOK: useTaskShortcuts (for task-specific shortcuts)
// ============================================================

interface TaskShortcutHandlers {
  onComplete?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onSetPriority?: (level: 1 | 2 | 3 | 4) => void;
  enabled?: boolean;
}

export function useTaskShortcuts(handlers: TaskShortcutHandlers) {
  const shortcuts: ShortcutConfig[] = [];

  // C - Complete task
  if (handlers.onComplete) {
    shortcuts.push({
      key: 'c',
      description: 'Complete task',
      handler: () => handlers.onComplete?.(),
      enabled: handlers.enabled,
    });
  }

  // E - Edit task
  if (handlers.onEdit) {
    shortcuts.push({
      key: 'e',
      description: 'Edit task',
      handler: () => handlers.onEdit?.(),
      enabled: handlers.enabled,
    });
  }

  // D - Duplicate task
  if (handlers.onDuplicate) {
    shortcuts.push({
      key: 'd',
      description: 'Duplicate task',
      handler: () => handlers.onDuplicate?.(),
      enabled: handlers.enabled,
    });
  }

  // Delete/Backspace - Delete task
  if (handlers.onDelete) {
    shortcuts.push({
      key: 'Delete',
      description: 'Delete task',
      handler: () => handlers.onDelete?.(),
      enabled: handlers.enabled,
    });
    shortcuts.push({
      key: 'Backspace',
      description: 'Delete task',
      handler: () => handlers.onDelete?.(),
      enabled: handlers.enabled,
    });
  }

  // Arrow keys for navigation
  if (handlers.onMoveUp) {
    shortcuts.push({
      key: 'ArrowUp',
      description: 'Move to previous task',
      handler: () => handlers.onMoveUp?.(),
      enabled: handlers.enabled,
    });
    shortcuts.push({
      key: 'k',
      description: 'Move to previous task',
      handler: () => handlers.onMoveUp?.(),
      enabled: handlers.enabled,
    });
  }

  if (handlers.onMoveDown) {
    shortcuts.push({
      key: 'ArrowDown',
      description: 'Move to next task',
      handler: () => handlers.onMoveDown?.(),
      enabled: handlers.enabled,
    });
    shortcuts.push({
      key: 'j',
      description: 'Move to next task',
      handler: () => handlers.onMoveDown?.(),
      enabled: handlers.enabled,
    });
  }

  // 1-4 - Set priority
  if (handlers.onSetPriority) {
    [1, 2, 3, 4].forEach((level) => {
      shortcuts.push({
        key: String(level),
        description: `Set priority ${level}`,
        handler: () => handlers.onSetPriority?.(level as 1 | 2 | 3 | 4),
        enabled: handlers.enabled,
      });
    });
  }

  useKeyboardShortcuts(shortcuts);
}

// ============================================================
// KEYBOARD SHORTCUTS HELP DATA
// ============================================================

export const KEYBOARD_SHORTCUTS = [
  {
    category: 'General',
    shortcuts: [
      { keys: ['Ctrl', 'N'], description: 'Create new task' },
      { keys: ['Ctrl', 'K'], description: 'Open search' },
      { keys: ['/'], description: 'Open search' },
      { keys: ['Ctrl', 'Shift', 'D'], description: 'Toggle dark mode' },
      { keys: ['Ctrl', 'B'], description: 'Toggle sidebar' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close modal/panel' },
    ],
  },
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['Alt', 'H'], description: 'Go to home' },
      { keys: ['Alt', 'Shift', 'S'], description: 'Go to settings' },
    ],
  },
  {
    category: 'Task Actions',
    shortcuts: [
      { keys: ['C'], description: 'Complete selected task' },
      { keys: ['E'], description: 'Edit selected task' },
      { keys: ['D'], description: 'Duplicate selected task' },
      { keys: ['Delete'], description: 'Delete selected task' },
      { keys: ['1-4'], description: 'Set task priority' },
    ],
  },
  {
    category: 'Task Navigation',
    shortcuts: [
      { keys: ['J', '↓'], description: 'Move to next task' },
      { keys: ['K', '↑'], description: 'Move to previous task' },
    ],
  },
];

export default useKeyboardShortcuts;
