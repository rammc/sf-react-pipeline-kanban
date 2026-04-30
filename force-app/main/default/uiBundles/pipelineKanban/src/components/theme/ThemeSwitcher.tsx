import { useThemeStore, type Theme } from '@/store/themeStore';

const OPTIONS: { value: Theme; label: string; title: string }[] = [
  { value: 'light', label: 'Light', title: 'Light theme' },
  { value: 'dark', label: 'Dark', title: 'Dark theme' },
  { value: 'retro', label: 'Retro', title: 'Retro terminal theme' },
];

/**
 * Three-segment theme picker. Compact (~180 px), sits in the app
 * header. Reads from and writes to the zustand themeStore, which
 * persists the choice and flips the data-theme attribute on
 * <html>. Component code never touches localStorage or the DOM.
 */
export function ThemeSwitcher() {
  const theme = useThemeStore(s => s.theme);
  const setTheme = useThemeStore(s => s.setTheme);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center rounded-md border border-card-edge bg-surface-app p-0.5 text-[11px]"
    >
      {OPTIONS.map(opt => {
        const active = opt.value === theme;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.title}
            onClick={() => setTheme(opt.value)}
            className={`rounded px-2.5 py-1 font-medium transition-colors ${
              active
                ? 'bg-surface-card text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
