import { createBrowserRouter, RouterProvider } from 'react-router';
import { routes } from '@/routes';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
import './styles/global.css';

// Normalize basename: strip trailing slash so it matches URLs like /lwr/application/ai/c-app
const rawBasePath = (globalThis as any).SFDC_ENV?.basePath;
const basename =
  typeof rawBasePath === 'string' ? rawBasePath.replace(/\/+$/, '') : undefined;
const router = createBrowserRouter(routes, { basename });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>
);
