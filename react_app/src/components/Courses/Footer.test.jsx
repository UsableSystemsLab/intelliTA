import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../__tests__/helpers/renderWithProviders';
import Footer from './Footer';

describe('Courses Footer', () => {
  test('renders the IntelliTA brand name (logo + copyright)', () => {
    renderWithProviders(<Footer />);
    expect(screen.getAllByText('IntelliTA')).toHaveLength(2);
  });

  test('renders the four nav links', () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText('about')).toBeInTheDocument();
    expect(screen.getByText('gitHub')).toBeInTheDocument();
    expect(screen.getByText('licensing')).toBeInTheDocument();
    expect(screen.getByText('contact')).toBeInTheDocument();
  });

  test('shows the Beta badge', () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  test('renders rights translation key', () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText(/rights/)).toBeInTheDocument();
  });
});
