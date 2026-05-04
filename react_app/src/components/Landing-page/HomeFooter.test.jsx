import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeFooter from './HomeFooter';

describe('Landing-page HomeFooter', () => {
  test('renders the IntelliTA brand name (logo + copyright)', () => {
    render(<HomeFooter />);
    // Brand appears twice: in the logo block and in the copyright line
    expect(screen.getAllByText('IntelliTA')).toHaveLength(2);
  });

  test('renders the copyright with current year', () => {
    render(<HomeFooter />);
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${year}`))).toBeInTheDocument();
  });

  test('renders the four nav links', () => {
    render(<HomeFooter />);
    expect(screen.getByText('about')).toBeInTheDocument();
    expect(screen.getByText('gitHub')).toBeInTheDocument();
    expect(screen.getByText('licensing')).toBeInTheDocument();
    expect(screen.getByText('contact')).toBeInTheDocument();
  });

  test('renders Twitter and GitHub social labels', () => {
    render(<HomeFooter />);
    expect(screen.getByText('twitter')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });
});
