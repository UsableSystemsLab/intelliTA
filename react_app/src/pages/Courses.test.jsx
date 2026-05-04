import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/Courses/Nav', () => {
  const M = ({ user }) => <nav data-testid="nav" data-user={user?.uid || ''} />;
  M.displayName = 'MockNav';
  return M;
});
jest.mock('@/components/Courses/Maincontent', () => {
  const M = ({ user }) => <main data-testid="main-content" data-user={user?.uid || ''} />;
  M.displayName = 'MockMain';
  return M;
});
jest.mock('@/components/shared/Footer', () => {
  const M = () => <footer data-testid="footer" />;
  M.displayName = 'MockFooter';
  return M;
});
jest.mock('@/components/Courses/Sidebar', () => {
  const M = () => <aside data-testid="sidebar" />;
  M.displayName = 'MockSidebar';
  return M;
});

import Courses from './Courses';

describe('Courses page', () => {
  test('renders Nav, Sidebar, Maincontent, Footer with user', () => {
    render(<Courses user={{ uid: 'u-1' }} />);
    expect(screen.getByTestId('nav')).toHaveAttribute('data-user', 'u-1');
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toHaveAttribute('data-user', 'u-1');
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
