import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GitHubSetupInstructions from './GitHubSetupInstructions';

describe('GitHubSetupInstructions', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn(() => Promise.resolve()) },
    });
  });

  test('renders title and all six numbered steps', () => {
    render(<GitHubSetupInstructions callbackUrl="https://cb.example/x" onClose={() => {}} />);
    expect(screen.getByText('setupGuideTitle')).toBeInTheDocument();
    for (let i = 1; i <= 6; i++) {
      expect(screen.getByText(`setupStep${i}Title`)).toBeInTheDocument();
    }
  });

  test('renders the provided callback URL as a code block', () => {
    render(
      <GitHubSetupInstructions
        callbackUrl="https://example.org/cb"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('https://example.org/cb')).toBeInTheDocument();
  });

  test('clicking copy writes the callback URL to clipboard', () => {
    render(<GitHubSetupInstructions callbackUrl="https://x/cb" onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'copy' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://x/cb');
  });

  test('clicking "Got it" calls onClose', () => {
    const onClose = jest.fn();
    render(<GitHubSetupInstructions callbackUrl="https://x/cb" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'gotIt' }));
    expect(onClose).toHaveBeenCalled();
  });

  test('renders external links with proper rel/target', () => {
    render(<GitHubSetupInstructions callbackUrl="https://x/cb" onClose={() => {}} />);
    const orgLink = screen.getByText('github.com/account/organizations/new').closest('a');
    expect(orgLink).toHaveAttribute('target', '_blank');
    expect(orgLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
