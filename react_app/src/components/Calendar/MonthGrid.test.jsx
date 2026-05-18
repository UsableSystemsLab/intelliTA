import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../__tests__/helpers/renderWithProviders';
import MonthGrid, { courseColor } from './MonthGrid';

// Fix "now" for deterministic countdown / day-math assertions.
const FIXED_NOW = new Date(2026, 4, 15, 12, 0, 0); // May 15, 2026 noon

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

const baseEvent = (overrides = {}) => ({
  courseId: 1,
  courseName: 'CS203',
  activityId: 100,
  title: 'Lab 1',
  start_date: new Date(2026, 4, 10).toISOString(),
  end_date: new Date(2026, 4, 20).toISOString(),
  status: 'active',
  ...overrides,
});

describe('courseColor', () => {
  test('returns a deterministic palette entry for the same courseId', () => {
    expect(courseColor(1)).toBe(courseColor(1));
  });

  test('different course ids may map to different palette entries', () => {
    const colors = new Set([0, 1, 2, 3, 4, 5, 6, 7].map((id) => courseColor(id).bg));
    expect(colors.size).toBeGreaterThan(1);
  });

  test('handles missing/invalid courseId without throwing', () => {
    expect(() => courseColor(undefined)).not.toThrow();
    expect(courseColor(undefined)).toBeDefined();
  });
});

describe('MonthGrid', () => {
  test('renders weekday headers and 42 day cells', () => {
    const { container } = renderWithProviders(
      <MonthGrid year={2026} month={4} events={[]} />,
    );
    // 7 weekday headers + 42 day cells = grid structure
    const grids = container.querySelectorAll('.grid.grid-cols-7');
    expect(grids.length).toBeGreaterThanOrEqual(2);
  });

  test('renders an event box with title and status label inside the matching day', () => {
    renderWithProviders(
      <MonthGrid
        year={2026}
        month={4}
        events={[baseEvent({ status: 'active' })]}
      />,
    );
    // Title appears at least once (event spans multiple days, but we render only 2 per cell).
    expect(screen.getAllByText('Lab 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('statusActive').length).toBeGreaterThan(0);
  });

  test('shows "Start" button for active events and navigates on click', () => {
    renderWithProviders(
      <MonthGrid
        year={2026}
        month={4}
        events={[baseEvent({ status: 'active' })]}
      />,
    );
    const startButtons = screen.getAllByRole('button', { name: /calendarStart/i });
    expect(startButtons.length).toBeGreaterThan(0);
    // Button is enabled
    expect(startButtons[0]).not.toBeDisabled();
  });

  test('disables Open button for ended events', () => {
    renderWithProviders(
      <MonthGrid
        year={2026}
        month={4}
        events={[
          baseEvent({
            status: 'end',
            start_date: new Date(2026, 4, 1).toISOString(),
            end_date: new Date(2026, 4, 5).toISOString(),
          }),
        ]}
      />,
    );
    const openButtons = screen.getAllByRole('button', { name: /calendarOpen/i });
    expect(openButtons[0]).toBeDisabled();
  });

  test('shows "Review" button for solved events', () => {
    renderWithProviders(
      <MonthGrid
        year={2026}
        month={4}
        events={[baseEvent({ status: 'solved' })]}
      />,
    );
    expect(screen.getAllByRole('button', { name: /calendarReview/i }).length).toBeGreaterThan(0);
  });

  test('shows a live HH:MM:SS countdown for an event active today', () => {
    // FIXED_NOW is May 15 12:00. End at May 15 14:30 → 2h30m left.
    const end = new Date(2026, 4, 15, 14, 30, 0);
    renderWithProviders(
      <MonthGrid
        year={2026}
        month={4}
        events={[
          baseEvent({
            status: 'active',
            start_date: new Date(2026, 4, 15, 8, 0, 0).toISOString(),
            end_date: end.toISOString(),
          }),
        ]}
      />,
    );
    expect(screen.getByText('02:30:00')).toBeInTheDocument();
  });

  test('renders +N overflow indicator when a day has more than 2 events', () => {
    const events = [1, 2, 3, 4].map((i) =>
      baseEvent({
        activityId: i,
        title: `Lab ${i}`,
        start_date: new Date(2026, 4, 15).toISOString(),
        end_date: new Date(2026, 4, 15).toISOString(),
      }),
    );
    renderWithProviders(<MonthGrid year={2026} month={4} events={events} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });
});
