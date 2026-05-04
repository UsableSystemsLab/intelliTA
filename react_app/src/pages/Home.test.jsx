import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/components/Landing-page/Nav', () => {
  const M = ({ user }) => <nav data-testid="nav" data-user={user?.uid || ''} />;
  M.displayName = 'MockNav';
  return M;
});
jest.mock('@/components/Landing-page/HomeMain', () => {
  const M = ({ user }) => <main data-testid="home-main" data-user={user?.uid || ''} />;
  M.displayName = 'MockHomeMain';
  return M;
});
jest.mock('@/components/Landing-page/HomeFooter', () => {
  const M = () => <footer data-testid="home-footer" />;
  M.displayName = 'MockHomeFooter';
  return M;
});

import Home from './Home';

describe('Home page', () => {
  test('renders Nav, HomeMain, and HomeFooter', () => {
    render(<Home user={{ uid: 'u1' }} />);
    expect(screen.getByTestId('nav')).toHaveAttribute('data-user', 'u1');
    expect(screen.getByTestId('home-main')).toHaveAttribute('data-user', 'u1');
    expect(screen.getByTestId('home-footer')).toBeInTheDocument();
  });
});
