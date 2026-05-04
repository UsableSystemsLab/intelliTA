import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/Courses/Nav', () => {
  const M = ({ user }) => <nav data-testid="nav" data-user={user?.uid || ''} />;
  M.displayName = 'MockNav';
  return M;
});
jest.mock('@/components/Courses/Sidebar', () => {
  const M = () => <aside data-testid="sidebar" />;
  M.displayName = 'MockSidebar';
  return M;
});
jest.mock('@/components/Courses/Footer', () => {
  const M = () => <footer data-testid="footer" />;
  M.displayName = 'MockFooter';
  return M;
});
jest.mock('@/components/CreateCourse/Maincontent', () => {
  const M = ({ user }) => <main data-testid="create-main" data-user={user?.uid || ''} />;
  M.displayName = 'MockCreateMain';
  return M;
});

import CreateCourse from './CreateCourse';

describe('CreateCourse page', () => {
  test('renders Nav, Sidebar, CreateCourseMain, Footer with user', () => {
    render(<CreateCourse user={{ uid: 'instructor-1' }} />);
    expect(screen.getByTestId('nav')).toHaveAttribute('data-user', 'instructor-1');
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('create-main')).toHaveAttribute('data-user', 'instructor-1');
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
