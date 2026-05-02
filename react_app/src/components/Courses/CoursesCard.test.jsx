import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CoursesCard from './CoursesCard';

const renderCard = (props) =>
  render(
    <MemoryRouter>
      <CoursesCard {...props} />
    </MemoryRouter>
  );

describe('CoursesCard', () => {
  test('renders code, title, description', () => {
    renderCard({
      id: 7,
      code: 'CS101',
      title: 'Intro to CS',
      description: 'Variables, loops, etc.',
      status: true,
    });
    expect(screen.getByText('CS101')).toBeInTheDocument();
    expect(screen.getByText('Intro to CS')).toBeInTheDocument();
    expect(screen.getByText('Variables, loops, etc.')).toBeInTheDocument();
  });

  test('Go-to-activities link points at /courses/:id', () => {
    renderCard({ id: 42, code: 'X', title: 'Y', description: 'Z', status: false });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/courses/42');
  });

  test('passes status to StatusBadge', () => {
    renderCard({ id: 1, code: 'A', title: 'B', description: 'C', status: true });
    expect(screen.getByText('started')).toBeInTheDocument();
  });
});
