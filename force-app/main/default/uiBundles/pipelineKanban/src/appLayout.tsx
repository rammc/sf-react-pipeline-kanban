import { Outlet, Link, useLocation } from 'react-router';
import { getAllRoutes } from './router-utils';
import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';

export default function AppLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const toggleMenu = () => setIsOpen(!isOpen);

  const navigationRoutes: { path: string; label: string }[] = getAllRoutes()
    .filter(
      route =>
        route.handle?.showInNavigation === true &&
        route.fullPath !== undefined &&
        route.handle?.label !== undefined
    )
    .map(
      route =>
        ({
          path: route.fullPath,
          label: route.handle?.label,
        }) as { path: string; label: string }
    );

  return (
    <>
      <nav className="border-b border-card-edge bg-surface-app">
        <div className="px-6">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="text-[18px] font-medium text-ink">
              Pipeline Kanban
            </Link>
            <button
              onClick={toggleMenu}
              className="p-2 text-ink hover:bg-card-edge/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1.5">
                <span
                  className={`block h-0.5 w-6 bg-current transition-all ${
                    isOpen ? 'rotate-45 translate-y-2' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 w-6 bg-current transition-all ${isOpen ? 'opacity-0' : ''}`}
                />
                <span
                  className={`block h-0.5 w-6 bg-current transition-all ${
                    isOpen ? '-rotate-45 -translate-y-2' : ''
                  }`}
                />
              </div>
            </button>
          </div>
          {isOpen && (
            <div className="pb-4">
              <div className="flex flex-col space-y-1">
                {navigationRoutes.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`px-3 py-2 text-[13px] font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-card-edge/60 text-ink'
                        : 'text-ink-muted hover:bg-card-edge/30 hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
      <Outlet />
      <Toaster />
    </>
  );
}
