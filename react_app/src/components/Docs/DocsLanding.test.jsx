import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DocsLanding from './DocsLanding';

beforeEach(() => {
  // DocsLanding renders DocsTOC, which uses IntersectionObserver.
  global.IntersectionObserver = class {
    constructor() {}
    observe() {}
    disconnect() {}
  };
});

afterEach(() => {
  delete global.IntersectionObserver;
});

describe('DocsLanding', () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <DocsLanding />
      </MemoryRouter>
    );
  }

  test('renders the landing title and intro sections', () => {
    renderPage();
    // i18n mock returns the key; keys are present.
    expect(screen.getByRole('heading', { level: 1, name: /docs\.landing\.title/i })).toBeInTheDocument();
    expect(screen.getByText(/docs\.landing\.intro/i)).toBeInTheDocument();
  });

  test('renders category links pointing at the three docs routes', () => {
    const { container } = renderPage();
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/docs/labs', '/docs/tests', '/docs/github']));
  });

  test('renders all four quick-start anchored links', () => {
    const { container } = renderPage();
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining([
      '/docs/labs#creation',
      '/docs/tests#examples',
      '/docs/labs#checkpoints',
      '/docs/github#oauth',
    ]));
  });

  test('section landmarks exist for intro/categories/quickstart/support', () => {
    const { container } = renderPage();
    expect(container.querySelector('#intro')).not.toBeNull();
    expect(container.querySelector('#categories')).not.toBeNull();
    expect(container.querySelector('#quickstart')).not.toBeNull();
    expect(container.querySelector('#support')).not.toBeNull();
  });
});
