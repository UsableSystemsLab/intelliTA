import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/Activity/Maincontent', () => {
  const M = ({ user }) => <main data-testid="activity-main" data-user={user?.uid || ''} />;
  M.displayName = 'MockActivityMain';
  return M;
});

// Activity.jsx imports Nav but doesn't use it
jest.mock('@/components/Landing-page/Nav', () => {
  const M = () => <nav data-testid="nav" />;
  M.displayName = 'MockNav';
  return M;
});

import Activity from './Activity';

describe('Activity page', () => {
  test('renders the activity Maincontent with user prop', () => {
    render(<Activity user={{ uid: 'student-7' }} />);
    expect(screen.getByTestId('activity-main')).toHaveAttribute('data-user', 'student-7');
  });
});
