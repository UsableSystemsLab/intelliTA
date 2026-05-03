import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KickConfirmModal from './KickConfirmModal';

const member = { first_name: 'Alice', last_name: 'Walker' };

describe('KickConfirmModal', () => {
  test('renders title and confirm/cancel buttons', () => {
    render(<KickConfirmModal member={member} onConfirm={() => {}} onClose={() => {}} />);
    expect(screen.getByText('removeStudent')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'remove' })).toBeInTheDocument();
  });

  test('confirm button calls onConfirm', async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();
    render(<KickConfirmModal member={member} onConfirm={onConfirm} onClose={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'remove' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('cancel button calls onClose', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<KickConfirmModal member={member} onConfirm={() => {}} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('loading shows the removing label and disables buttons', () => {
    render(
      <KickConfirmModal member={member} onConfirm={() => {}} onClose={() => {}} loading />
    );
    expect(screen.getByRole('button', { name: 'removing' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'cancel' })).toBeDisabled();
  });
});
