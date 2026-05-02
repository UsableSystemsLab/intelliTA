import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorScreen from './ErrorScreen';

describe('ErrorScreen', () => {
  test('renders the not-found heading and a custom message', () => {
    render(<ErrorScreen message="Activity 42 not found" onBack={() => {}} />);
    expect(screen.getByText('activityNotFound')).toBeInTheDocument();
    expect(screen.getByText('Activity 42 not found')).toBeInTheDocument();
  });

  test('falls back to default message when message prop is omitted', () => {
    render(<ErrorScreen onBack={() => {}} />);
    expect(screen.getByText('Could not load activity data.')).toBeInTheDocument();
  });

  test('clicking the back button invokes onBack', async () => {
    const onBack = jest.fn();
    const user = userEvent.setup();
    render(<ErrorScreen message="x" onBack={onBack} />);
    await user.click(screen.getByRole('button', { name: 'backToCourse' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
