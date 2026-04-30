import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'pipeline-kanban-theme';

// jsdom under our config doesn't always wire localStorage methods —
// install a plain in-memory shim so the store's optional-chained
// calls land somewhere predictable.
const memoryStore = new Map<string, string>();
const fakeLocalStorage: Storage = {
  get length() {
    return memoryStore.size;
  },
  clear: () => memoryStore.clear(),
  getItem: (key: string) => memoryStore.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memoryStore.set(key, value);
  },
  removeItem: (key: string) => {
    memoryStore.delete(key);
  },
  key: (index: number) => Array.from(memoryStore.keys())[index] ?? null,
};

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: fakeLocalStorage,
    configurable: true,
  });
});

describe('themeStore', () => {
  beforeEach(() => {
    memoryStore.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.resetModules();
  });

  afterEach(() => {
    memoryStore.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to light when localStorage is empty', async () => {
    const { useThemeStore } = await import('../themeStore');
    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('hydrates from localStorage on module load', async () => {
    memoryStore.set(STORAGE_KEY, 'retro');
    const { useThemeStore } = await import('../themeStore');
    expect(useThemeStore.getState().theme).toBe('retro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('retro');
  });

  it('ignores unknown values in localStorage', async () => {
    memoryStore.set(STORAGE_KEY, 'sepia');
    const { useThemeStore } = await import('../themeStore');
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('setTheme persists the choice and flips the data-theme attribute', async () => {
    const { useThemeStore } = await import('../themeStore');
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(memoryStore.get(STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('cycles through all three themes without losing state', async () => {
    const { useThemeStore } = await import('../themeStore');
    useThemeStore.getState().setTheme('dark');
    useThemeStore.getState().setTheme('retro');
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(memoryStore.get(STORAGE_KEY)).toBe('light');
  });
});
