import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../__tests__/helpers/renderWithProviders';
import Sidebar from './Sidebar';

describe('Courses Sidebar', () => {
  test('renders all nav menu items', () => {
    renderWithProviders(<Sidebar />, { route: '/courses' });
    expect(screen.getByText('courses')).toBeInTheDocument();
    expect(screen.getByText('leaderboard')).toBeInTheDocument();
    expect(screen.getByText('calendar')).toBeInTheDocument();
    expect(screen.getByText('settings')).toBeInTheDocument();
    expect(screen.getByText('support')).toBeInTheDocument();
  });

  test('renders the back link at the bottom', () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getByText('back')).toBeInTheDocument();
  });

  test('marks /courses link as active when at /courses route', () => {
    renderWithProviders(<Sidebar />, { route: '/courses' });
    const coursesLink = screen.getByRole('link', { name: /courses/i });
    expect(coursesLink).toHaveClass('text-blue-500');
  });

  test('marks /settings link as active when at /settings route', () => {
    renderWithProviders(<Sidebar />, { route: '/settings' });
    const settingsLink = screen.getByRole('link', { name: /settings/i });
    expect(settingsLink).toHaveClass('text-blue-500');
  });

  test('does not mark items at "#" path as active', () => {
    renderWithProviders(<Sidebar />, { route: '/courses' });
    const leaderboardLink = screen.getByRole('link', { name: /leaderboard/i });
    expect(leaderboardLink).not.toHaveClass('text-blue-500');
  });
});
