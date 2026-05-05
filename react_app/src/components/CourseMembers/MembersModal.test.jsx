import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('./MembersList', () => {
  const MockList = ({ courseId, user }) => (
    <div
      data-testid="members-list"
      data-course-id={courseId}
      data-user-uid={user?.uid}
    />
  );
  MockList.displayName = 'MockMembersList';
  return MockList;
});

import MembersModal from './MembersModal';

const baseProps = {
  courseId: 'c1',
  user: { uid: 'u1' },
};

describe('MembersModal', () => {
  test('renders the courseMembers title', () => {
    render(<MembersModal {...baseProps} onClose={jest.fn()} />);
    expect(screen.getByText('courseMembers')).toBeInTheDocument();
  });

  test('renders MembersList with the right props', () => {
    render(<MembersModal {...baseProps} onClose={jest.fn()} />);
    const list = screen.getByTestId('members-list');
    expect(list).toBeInTheDocument();
    expect(list).toHaveAttribute('data-course-id', 'c1');
    expect(list).toHaveAttribute('data-user-uid', 'u1');
  });

  test('clicking the close button calls onClose once', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<MembersModal {...baseProps} onClose={onClose} />);

    await user.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
