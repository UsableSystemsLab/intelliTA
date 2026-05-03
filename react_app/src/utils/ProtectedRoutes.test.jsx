import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoutes from './ProtectedRoutes';

const renderWithRouter = (user, initialEntries = ['/protected']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route element={<ProtectedRoutes user={user} />}>
          <Route path="/protected" element={<div>protected content</div>} />
        </Route>
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoutes', () => {
  test('renders the child route when user is truthy', () => {
    renderWithRouter({ uid: 'abc' });
    expect(screen.getByText('protected content')).toBeInTheDocument();
  });

  test('redirects to /login when user is null', () => {
    renderWithRouter(null);
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  test('redirects to /login when user is undefined', () => {
    renderWithRouter(undefined);
    expect(screen.getByText('login page')).toBeInTheDocument();
  });
});
