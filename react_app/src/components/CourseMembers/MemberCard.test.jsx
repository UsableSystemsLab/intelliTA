import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MemberCard from './MemberCard';

const baseMember = {
  first_name: 'Alice',
  last_name: 'Walker',
  email: 'alice@stu.kau.edu.sa',
  enrollment_date: '2025-01-15',
  status: 'active',
  photo_url: null,
};

describe('MemberCard', () => {
  test('renders name, email, and formatted enrollment date', () => {
    render(<MemberCard member={baseMember} onKick={() => {}} />);
    expect(screen.getByText('Alice Walker')).toBeInTheDocument();
    expect(screen.getByText('alice@stu.kau.edu.sa')).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2025/)).toBeInTheDocument();
  });

  test('renders initials when photo_url is missing', () => {
    render(<MemberCard member={baseMember} onKick={() => {}} />);
    expect(screen.getByText('AW')).toBeInTheDocument();
  });

  test('renders an avatar img when photo_url is provided', () => {
    render(
      <MemberCard
        member={{ ...baseMember, photo_url: 'https://x/y.png' }}
        onKick={() => {}}
      />
    );
    const img = screen.getByAltText('Alice Walker');
    expect(img).toHaveAttribute('src', 'https://x/y.png');
  });

  test('shows the active status badge by default', () => {
    render(<MemberCard member={baseMember} onKick={() => {}} />);
    expect(screen.getByText('statusActive')).toBeInTheDocument();
  });

  test('shows completed status badge', () => {
    render(<MemberCard member={{ ...baseMember, status: 'completed' }} onKick={() => {}} />);
    expect(screen.getByText('statusCompleted')).toBeInTheDocument();
  });

  test('shows dropped status badge', () => {
    render(<MemberCard member={{ ...baseMember, status: 'dropped' }} onKick={() => {}} />);
    expect(screen.getByText('statusDropped')).toBeInTheDocument();
  });

  test('clicking trash invokes onKick with the member', async () => {
    const onKick = jest.fn();
    const user = userEvent.setup();
    render(<MemberCard member={baseMember} onKick={onKick} />);
    await user.click(screen.getByTitle('removeFromCourse'));
    expect(onKick).toHaveBeenCalledWith(baseMember);
  });
});
