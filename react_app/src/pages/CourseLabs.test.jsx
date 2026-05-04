import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/Courses/Nav', () => {
  const M = ({ user }) => <nav data-testid="nav" data-user={user?.uid || ''} />;
  M.displayName = 'MockNav';
  return M;
});
jest.mock('@/components/Activites/MainContent', () => {
  const M = ({ user }) => <main data-testid="labs-main" data-user={user?.uid || ''} />;
  M.displayName = 'MockLabsMain';
  return M;
});
jest.mock('@/components/Courses/Footer', () => {
  const M = () => <footer data-testid="footer" />;
  M.displayName = 'MockFooter';
  return M;
});
jest.mock('@/components/Courses/Sidebar', () => {
  const M = () => <aside data-testid="sidebar" />;
  M.displayName = 'MockSidebar';
  return M;
});

import CourseLabs from './CourseLabs';

describe('CourseLabs page', () => {
  test('renders Nav, Sidebar, Activites MainContent, and Footer', () => {
    render(<CourseLabs user={{ uid: 'instr-2' }} />);
    expect(screen.getByTestId('nav')).toHaveAttribute('data-user', 'instr-2');
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('labs-main')).toHaveAttribute('data-user', 'instr-2');
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
