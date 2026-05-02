import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Breadcrumb from './Breadcrumb';

const renderBreadcrumb = (items) =>
  render(
    <MemoryRouter>
      <Breadcrumb items={items} />
    </MemoryRouter>
  );

describe('Breadcrumb', () => {
  test('renders nothing extra for an empty items array', () => {
    const { container } = renderBreadcrumb([]);
    expect(container.querySelector('nav')).toBeInTheDocument();
    expect(container.querySelectorAll('a, span.text-white')).toHaveLength(0);
  });

  test('renders linked items with hrefs', () => {
    renderBreadcrumb([
      { label: 'Home', href: '/' },
      { label: 'Courses', href: '/courses' },
    ]);

    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('href', '/');
    const courses = screen.getByRole('link', { name: 'Courses' });
    expect(courses).toHaveAttribute('href', '/courses');
  });

  test('renders the last item as plain text when href is omitted', () => {
    renderBreadcrumb([
      { label: 'Home', href: '/' },
      { label: 'Activity Title' },
    ]);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    // Final item has no link role
    expect(screen.queryByRole('link', { name: 'Activity Title' })).not.toBeInTheDocument();
    expect(screen.getByText('Activity Title')).toBeInTheDocument();
  });

  test('renders separators between items', () => {
    const { container } = renderBreadcrumb([
      { label: 'A', href: '/a' },
      { label: 'B', href: '/b' },
      { label: 'C' },
    ]);
    // Each separator is a ChevronRight svg with class w-3.5
    const chevrons = container.querySelectorAll('svg.w-3\\.5');
    // 2 separators for 3 items
    expect(chevrons.length).toBe(2);
  });
});
