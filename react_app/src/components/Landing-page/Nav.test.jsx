import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('@/components/lib/Shuffle', () => ({
  __esModule: true,
  default: ({ text }) => <span>{text}</span>,
}));

import Nav from './Nav';
import { signOut } from 'firebase/auth';

const renderAt = (ui, route = '/') =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);

describe('Nav', () => {
  test('shows Login link when no user', () => {
    renderAt(<Nav user={null} />);
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
  });

  test('renders nav links', () => {
    renderAt(<Nav user={null} />);
    expect(screen.getByRole('link', { name: /courses/i })).toBeInTheDocument();
    expect(screen.getByText('about')).toBeInTheDocument();
  });

  test('language toggle button shows "عربي" when language is English', () => {
    renderAt(<Nav user={null} />);
    expect(screen.getByRole('button', { name: 'عربي' })).toBeInTheDocument();
  });

  test('shows user avatar and dropdown when user is provided', () => {
    const user = { displayName: 'Jane Doe', photoURL: null };
    renderAt(<Nav user={user} />);
    const avatarBtn = screen.getByText('J');
    fireEvent.click(avatarBtn);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'logout' })).toBeInTheDocument();
  });

  test('renders user photo when photoURL provided', () => {
    const user = { displayName: 'Sam Smith', photoURL: 'https://x/p.jpg' };
    renderAt(<Nav user={user} />);
    const img = screen.getByAltText('User profile');
    expect(img).toHaveAttribute('src', 'https://x/p.jpg');
  });

  test('logout calls firebase signOut', async () => {
    signOut.mockClear();
    const user = { displayName: 'Jane', photoURL: null };
    renderAt(<Nav user={user} />);
    fireEvent.click(screen.getByText('J'));
    fireEvent.click(screen.getByRole('button', { name: 'logout' }));
    expect(signOut).toHaveBeenCalled();
  });

  test('omits spacer on landing route', () => {
    const { container } = renderAt(<Nav user={null} />, '/');
    expect(container.querySelector('div.h-16')).toBeNull();
  });

  test('includes spacer on non-landing route', () => {
    const { container } = renderAt(<Nav user={null} />, '/courses');
    expect(container.querySelector('div.h-16')).not.toBeNull();
  });
});
