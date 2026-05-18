import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('./ProfileSettings', () => {
  const M = () => <div data-testid="profile-settings" />;
  M.displayName = 'MockProfile';
  return M;
});
jest.mock('./SecuritySettings', () => {
  const M = () => <div data-testid="security-settings" />;
  M.displayName = 'MockSecurity';
  return M;
});
jest.mock('./AccessibilitySettings', () => {
  const M = () => <div data-testid="accessibility-settings" />;
  M.displayName = 'MockAccessibility';
  return M;
});
jest.mock('./AIIntegrationSettings', () => {
  const M = () => <div data-testid="ai-integration-settings" />;
  M.displayName = 'MockAI';
  return M;
});

import SettingsLayout from './SettingsLayout';

describe('SettingsLayout', () => {
  test('renders all tab buttons', () => {
    render(<SettingsLayout user={{}} setUser={jest.fn()} />);
    expect(screen.getByText('tabProfile')).toBeInTheDocument();
    expect(screen.getByText('tabSecurity')).toBeInTheDocument();
    expect(screen.getByText('tabAccessibility')).toBeInTheDocument();
    expect(screen.getByText('tabAIIntegration')).toBeInTheDocument();
  });

  test('shows ProfileSettings by default', () => {
    render(<SettingsLayout user={{}} setUser={jest.fn()} />);
    expect(screen.getByTestId('profile-settings')).toBeInTheDocument();
    expect(screen.queryByTestId('security-settings')).not.toBeInTheDocument();
  });

  test('clicking Security tab swaps to SecuritySettings', async () => {
    const user = userEvent.setup();
    render(<SettingsLayout user={{}} setUser={jest.fn()} />);

    await user.click(screen.getByText('tabSecurity'));

    expect(screen.getByTestId('security-settings')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-settings')).not.toBeInTheDocument();
  });

  test('clicking Accessibility tab swaps to AccessibilitySettings', async () => {
    const user = userEvent.setup();
    render(<SettingsLayout user={{}} setUser={jest.fn()} />);

    await user.click(screen.getByText('tabAccessibility'));

    expect(screen.getByTestId('accessibility-settings')).toBeInTheDocument();
  });

  test('clicking AI Integration tab swaps to AIIntegrationSettings', async () => {
    const user = userEvent.setup();
    render(<SettingsLayout user={{}} setUser={jest.fn()} />);

    await user.click(screen.getByText('tabAIIntegration'));

    expect(screen.getByTestId('ai-integration-settings')).toBeInTheDocument();
  });

  test('renders the settings title and subtitle', () => {
    render(<SettingsLayout user={{}} setUser={jest.fn()} />);
    expect(screen.getByText('settingsTitle')).toBeInTheDocument();
    expect(screen.getByText('settingsSubtitle')).toBeInTheDocument();
  });
});
