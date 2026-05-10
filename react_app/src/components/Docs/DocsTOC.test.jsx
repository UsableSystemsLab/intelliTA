import React from 'react';
import { render, screen, act } from '@testing-library/react';
import DocsTOC from './DocsTOC';

// Capture the IntersectionObserver callback so tests can drive it.
let observerCallback = null;
let observed = [];
let disconnectMock = jest.fn();

beforeEach(() => {
  observerCallback = null;
  observed = [];
  disconnectMock = jest.fn();
  class MockIO {
    constructor(cb) { observerCallback = cb; }
    observe(el) { observed.push(el); }
    disconnect() { disconnectMock(); }
  }
  global.IntersectionObserver = MockIO;
});

afterEach(() => {
  delete global.IntersectionObserver;
});

const items = [
  { id: 'one', label: 'Section One' },
  { id: 'two', label: 'Section Two' },
  { id: 'three', label: 'Section Three' },
];

describe('DocsTOC', () => {
  test('renders nothing when items is empty', () => {
    const { container } = render(<DocsTOC items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when items prop is omitted', () => {
    const { container } = render(<DocsTOC />);
    expect(container.firstChild).toBeNull();
  });

  test('renders each item label and href', () => {
    // Add elements with matching ids so the observer code path runs.
    items.forEach((i) => {
      const el = document.createElement('div');
      el.id = i.id;
      document.body.appendChild(el);
    });

    render(<DocsTOC items={items} />);
    items.forEach((i) => {
      const link = screen.getByRole('link', { name: i.label });
      expect(link).toHaveAttribute('href', `#${i.id}`);
    });

    // Cleanup
    items.forEach((i) => document.getElementById(i.id)?.remove());
  });

  test('updates active id when an entry becomes visible (active gets accent bar)', () => {
    items.forEach((i) => {
      const el = document.createElement('div');
      el.id = i.id;
      document.body.appendChild(el);
    });

    const { container } = render(<DocsTOC items={items} />);

    // Initially the first item is active (the active link gets a span bar inside).
    expect(observerCallback).toBeInstanceOf(Function);

    // Drive the callback: only "two" intersecting.
    act(() => {
      observerCallback([
        {
          isIntersecting: true,
          target: { id: 'two' },
          boundingClientRect: { top: 50 },
        },
      ]);
    });

    const activeBar = container.querySelector('a[href="#two"] span');
    expect(activeBar).not.toBeNull();

    items.forEach((i) => document.getElementById(i.id)?.remove());
  });

  test('returns early when no matching DOM elements exist (still renders nav)', () => {
    // No DOM nodes added — observer setup short-circuits and disconnect isn't called.
    const { unmount } = render(<DocsTOC items={items} />);
    expect(observerCallback).toBeNull();
    unmount();
  });

  test('disconnects observer on unmount', () => {
    items.forEach((i) => {
      const el = document.createElement('div');
      el.id = i.id;
      document.body.appendChild(el);
    });

    const { unmount } = render(<DocsTOC items={items} />);
    unmount();
    expect(disconnectMock).toHaveBeenCalled();

    items.forEach((i) => document.getElementById(i.id)?.remove());
  });
});
