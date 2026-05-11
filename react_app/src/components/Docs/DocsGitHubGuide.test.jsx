import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DocsGitHubGuide from './DocsGitHubGuide';

beforeEach(() => {
  global.IntersectionObserver = class {
    constructor() {}
    observe() {}
    disconnect() {}
  };
  Object.defineProperty(global.navigator, 'clipboard', {
    value: { writeText: jest.fn(() => Promise.resolve()) },
    configurable: true,
  });
});

afterEach(() => {
  delete global.IntersectionObserver;
  jest.useRealTimers();
});

describe('DocsGitHubGuide', () => {
  function renderGuide() {
    return render(
      <MemoryRouter>
        <DocsGitHubGuide />
      </MemoryRouter>
    );
  }

  test('renders title and intro section', () => {
    renderGuide();
    expect(
      screen.getByRole('heading', { level: 1, name: /docs\.github\.title/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/docs\.github\.intro/i)).toBeInTheDocument();
  });

  test('renders all six numbered step sections', () => {
    const { container } = renderGuide();
    const ids = ['org', 'classroom', 'oauth', 'connect', 'link-classroom', 'per-activity'];
    for (const id of ids) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
  });

  test('renders breadcrumb link back to /docs and next-steps link to /docs/labs', () => {
    const { container } = renderGuide();
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/docs', '/docs/labs']));
  });

  test('renders external GitHub links with target=_blank', () => {
    const { container } = renderGuide();
    const extLinks = Array.from(container.querySelectorAll('a[target="_blank"]'));
    expect(extLinks.length).toBeGreaterThan(0);
    expect(extLinks[0].getAttribute('rel')).toMatch(/noopener/);
  });

  test('clicking the copy button copies the callback URL and toggles label', () => {
    jest.useFakeTimers();
    renderGuide();
    const copyBtn = screen.getByRole('button', { name: /docs\.copy$/i });
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /docs\.copied/i })).toBeInTheDocument();
  });

});
