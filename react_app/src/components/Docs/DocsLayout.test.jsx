import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Stub out the heavy landing-page Nav and DocsSidebar so this test stays
// focused on DocsLayout's own structural responsibilities.
jest.mock('@/components/Landing-page/Nav', () => ({
  __esModule: true,
  default: ({ user }) => <nav data-testid="layout-nav">{user?.email ?? 'no-user'}</nav>,
}));
jest.mock('./DocsSidebar', () => ({
  __esModule: true,
  default: () => <aside data-testid="layout-sidebar" />,
}));

import DocsLayout from './DocsLayout';

describe('DocsLayout', () => {
  test('renders nav, sidebar, and the routed Outlet content', () => {
    const user = { email: 'someone@example.com' };
    render(
      <MemoryRouter initialEntries={['/docs/x']}>
        <Routes>
          <Route element={<DocsLayout user={user} />}>
            <Route path="/docs/x" element={<div data-testid="outlet-target">child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('layout-nav')).toHaveTextContent('someone@example.com');
    expect(screen.getByTestId('layout-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('outlet-target')).toBeInTheDocument();
  });

  test('handles missing user without crashing', () => {
    render(
      <MemoryRouter initialEntries={['/docs/x']}>
        <Routes>
          <Route element={<DocsLayout />}>
            <Route path="/docs/x" element={<div>ok</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('layout-nav')).toHaveTextContent('no-user');
  });
});
