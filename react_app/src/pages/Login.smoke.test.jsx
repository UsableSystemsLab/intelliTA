import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../__tests__/helpers/renderWithProviders';
import Login from './Login';

describe('Login (smoke)', () => {
  test('renders email input', () => {
    renderWithProviders(<Login />);
    expect(screen.getByLabelText('email')).toBeInTheDocument();
  });

  test('renders password input', () => {
    renderWithProviders(<Login />);
    expect(screen.getByLabelText('password')).toBeInTheDocument();
  });

  test('renders a login submit button', () => {
    renderWithProviders(<Login />);
    const buttons = screen.getAllByRole('button', { name: 'login' });
    expect(buttons.length).toBeGreaterThan(0);
  });
});
