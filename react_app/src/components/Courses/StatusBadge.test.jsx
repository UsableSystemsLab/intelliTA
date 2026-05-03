import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  test('renders started label when status is truthy', () => {
    render(<StatusBadge status={true} />);
    expect(screen.getByText('started')).toBeInTheDocument();
  });

  test('renders notStarted label when status is falsy', () => {
    render(<StatusBadge status={false} />);
    expect(screen.getByText('notStarted')).toBeInTheDocument();
  });

  test('green color class on started, gray on notStarted', () => {
    const { rerender, container } = render(<StatusBadge status={true} />);
    expect(container.querySelector('.text-green-400')).toBeInTheDocument();
    rerender(<StatusBadge status={false} />);
    expect(container.querySelector('.text-gray-300')).toBeInTheDocument();
  });
});
