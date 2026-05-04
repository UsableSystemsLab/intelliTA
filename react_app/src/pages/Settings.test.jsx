import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/Courses/Nav', () => {
  const M = ({ user }) => <nav data-testid="nav" data-user={user?.uid || ''} />;
  M.displayName = 'MockNav';
  return M;
});
jest.mock('@/components/Settings/SettingsLayout', () => {
  const M = ({ user, setUser }) => (
    <div
      data-testid="settings-layout"
      data-user={user?.uid || ''}
      data-has-set-user={typeof setUser === 'function' ? '1' : '0'}
    />
  );
  M.displayName = 'MockSettingsLayout';
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

import Settings from './Settings';

describe('Settings page', () => {
  test('renders Nav, Sidebar, SettingsLayout, Footer and forwards user + setUser', () => {
    const setUser = jest.fn();
    render(<Settings user={{ uid: 'u-99' }} setUser={setUser} />);

    expect(screen.getByTestId('nav')).toHaveAttribute('data-user', 'u-99');
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();

    const layout = screen.getByTestId('settings-layout');
    expect(layout).toHaveAttribute('data-user', 'u-99');
    expect(layout).toHaveAttribute('data-has-set-user', '1');
  });
});
