import React from 'react';
import { render, screen } from '@testing-library/react';
import SubmitButton from './SubmitButton';

describe('SubmitButton', () => {
  test('renders default label and is enabled', () => {
    render(<SubmitButton />);
    const btn = screen.getByRole('button', { name: /Submit/i });
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveAttribute('type', 'submit');
  });

  test('renders custom label', () => {
    render(<SubmitButton label="Save" />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  test('loading state disables button and shows loadingLabel', () => {
    const { container } = render(<SubmitButton loading loadingLabel="Saving..." />);
    const btn = screen.getByRole('button', { name: /Saving.../i });
    expect(btn).toBeDisabled();
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
  });
});
