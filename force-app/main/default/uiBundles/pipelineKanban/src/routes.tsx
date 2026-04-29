import type { RouteObject } from 'react-router';
import AppLayout from '@/appLayout';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import NotFound from './pages/NotFound';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <KanbanBoard />,
        handle: { showInNavigation: true, label: 'Pipeline' },
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];
