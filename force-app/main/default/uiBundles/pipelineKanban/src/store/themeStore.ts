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
  document.documentElement.setAttribute('data-theme', theme);
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
