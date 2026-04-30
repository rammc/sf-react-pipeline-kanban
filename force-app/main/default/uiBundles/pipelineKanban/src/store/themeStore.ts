import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'retro';

const STORAGE_KEY = 'pipeline-kanban-theme';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function readInitial(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage?.getItem?.(STORAGE_KEY);
    if (stored === 'dark' || stored === 'retro') return stored;
  } catch {
    /* ignore — sandboxed contexts may shape the API wrong */
  }
  return 'light';
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);
  // Shadcn primitives (Popover, Sonner toast, etc.) read their own
  // dark palette under the `.dark` class. Mirror our theme onto that
  // class so primitive surfaces follow when the user picks dark or
  // retro. Our [data-theme] blocks already redefine --background,
  // --card, etc. to our tokens — toggling .dark just makes shadcn's
  // own .dark block stop fighting our values.
  if (theme === 'dark' || theme === 'retro') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}

// Synchronous side effect at module load: set the data-theme
// attribute on <html> before React's first render, so there's no
// flash of light theme when the user has stored 'dark' or 'retro'.
const INITIAL = readInitial();
applyTheme(INITIAL);

export const useThemeStore = create<ThemeStore>(set => ({
  theme: INITIAL,
  setTheme: theme => {
    try {
      window.localStorage?.setItem?.(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
    applyTheme(theme);
    set({ theme });
  },
}));
