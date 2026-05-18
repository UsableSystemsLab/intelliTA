import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__tests__/helpers/renderWithProviders';

import ActivityResetModal from './ActivityResetModal';

describe('ActivityResetModal', () => {
  test('renders title, message, and confirm button', () => {
    renderWithProviders(
      <ActivityResetModal onAcknowledge={() => {}} isAcknowledging={false} />
    );
    expect(screen.getByText('activityUpdated')).toBeInTheDocument();
    expect(screen.getByText('activityUpdatedMessage')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gotIt/i })).toBeInTheDocument();
  });

  test('clicking the button calls onAcknowledge', async () => {
    const onAcknowledge = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ActivityResetModal onAcknowledge={onAcknowledge} isAcknowledging={false} />
    );
    await user.click(screen.getByRole('button', { name: /gotIt/i }));
    expect(onAcknowledge).toHaveBeenCalledTimes(1);
  });

  test('button is disabled while acknowledging', () => {
    renderWithProviders(
      <ActivityResetModal onAcknowledge={() => {}} isAcknowledging={true} />
    );
    expect(screen.getByRole('button', { name: /gotIt/i })).toBeDisabled();
  });

  test('disabled button does not fire onAcknowledge', async () => {
    const onAcknowledge = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ActivityResetModal onAcknowledge={onAcknowledge} isAcknowledging={true} />
    );
    await user.click(screen.getByRole('button', { name: /gotIt/i }));
    expect(onAcknowledge).not.toHaveBeenCalled();
  });
});
