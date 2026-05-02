import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivityHeader from './ActivityHeader';

const baseProps = {
  activityTitle: 'Lab 3 — Recursion',
  onBack: jest.fn(),
  onSubmit: jest.fn(),
  isSubmitting: false,
  isEnded: false,
  isUpcoming: false,
  onHintClick: jest.fn(),
  isHintOpen: false,
};

beforeEach(() => {
  baseProps.onBack.mockClear();
  baseProps.onSubmit.mockClear();
  baseProps.onHintClick.mockClear();
});

describe('ActivityHeader', () => {
  test('renders the activity title', () => {
    render(<ActivityHeader {...baseProps} />);
    expect(screen.getByText('Lab 3 — Recursion')).toBeInTheDocument();
  });

  test('clicking the back button invokes onBack', async () => {
    const user = userEvent.setup();
    render(<ActivityHeader {...baseProps} />);
    await user.click(screen.getByTitle('Back'));
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });

  test('clicking the hint button invokes onHintClick', async () => {
    const user = userEvent.setup();
    render(<ActivityHeader {...baseProps} />);
    await user.click(screen.getByRole('button', { name: /hint/i }));
    expect(baseProps.onHintClick).toHaveBeenCalledTimes(1);
  });

  test('hint button uses active styling when isHintOpen is true', () => {
    render(<ActivityHeader {...baseProps} isHintOpen />);
    const hintBtn = screen.getByRole('button', { name: /hint/i });
    expect(hintBtn.className).toMatch(/bg-amber-500/);
  });

  test('clicking submit when enabled invokes onSubmit', async () => {
    const user = userEvent.setup();
    render(<ActivityHeader {...baseProps} />);
    await user.click(screen.getByRole('button', { name: /submitBtn/i }));
    expect(baseProps.onSubmit).toHaveBeenCalledTimes(1);
  });

  test('isSubmitting renders the loader and disables the submit button', () => {
    const { container } = render(<ActivityHeader {...baseProps} isSubmitting />);
    const submitBtn = screen.getByRole('button', { name: /submitBtn/i });
    expect(submitBtn).toBeDisabled();
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
  });

  test('isEnded shows the ended label and disables submit', () => {
    render(<ActivityHeader {...baseProps} isEnded />);
    const btn = screen.getByRole('button', { name: /statusEnded/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('title', 'This activity has ended');
  });

  test('isUpcoming shows the upcoming label and disables submit', () => {
    render(<ActivityHeader {...baseProps} isUpcoming />);
    const btn = screen.getByRole('button', { name: /statusUpcoming/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('title', 'This activity has not started yet');
  });
});
