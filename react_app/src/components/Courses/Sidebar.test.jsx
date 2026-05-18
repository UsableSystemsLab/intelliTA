import React from 'react';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../../__tests__/helpers/renderWithProviders';
import Sidebar from './Sidebar';

// Sidebar renders the same nav twice (mobile drawer + desktop). jsdom doesn't
// apply Tailwind responsive classes, so both copies are in the DOM. Scope each
// query to a single nav to avoid multi-match errors.
const getDesktopNav = () => screen.getAllByRole('navigation')[1];

describe('Courses Sidebar', () => {
  test('renders all nav menu items', () => {
    renderWithProviders(<Sidebar />, { route: '/courses' });
    const nav = getDesktopNav();
    expect(within(nav).getByText('courses')).toBeInTheDocument();
    expect(within(nav).getByText('leaderboard')).toBeInTheDocument();
    expect(within(nav).getByText('calendar')).toBeInTheDocument();
    expect(within(nav).getByText('settings')).toBeInTheDocument();
  });

  test('renders the back link at the bottom', () => {
    renderWithProviders(<Sidebar />);
    expect(within(getDesktopNav()).getByText('back')).toBeInTheDocument();
  });

  test('marks /courses link as active when at /courses route', () => {
    renderWithProviders(<Sidebar />, { route: '/courses' });
    const coursesLink = within(getDesktopNav()).getByRole('link', { name: /courses/i });
    expect(coursesLink).toHaveClass('text-blue-500');
  });

  test('marks /settings link as active when at /settings route', () => {
    renderWithProviders(<Sidebar />, { route: '/settings' });
    const settingsLink = within(getDesktopNav()).getByRole('link', { name: /settings/i });
    expect(settingsLink).toHaveClass('text-blue-500');
  });

  test('does not mark items at "#" path as active', () => {
    renderWithProviders(<Sidebar />, { route: '/courses' });
    const leaderboardLink = within(getDesktopNav()).getByRole('link', { name: /leaderboard/i });
    expect(leaderboardLink).not.toHaveClass('text-blue-500');
  });
});
