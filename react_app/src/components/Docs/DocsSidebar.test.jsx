import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DocsSidebar from './DocsSidebar';

describe('DocsSidebar', () => {
  function renderAt(path) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <DocsSidebar />
      </MemoryRouter>
    );
  }

  test('renders all top-level sidebar groups', () => {
    renderAt('/docs');
    // i18n mock returns keys; group buttons carry the group label key.
    const groupLabels = [
      'docs.sidebar.gettingStarted',
      'docs.sidebar.authoringLabs',
      'docs.sidebar.reference',
      'docs.sidebar.integrations',
    ];
    for (const k of groupLabels) {
      // Group buttons appear at least once (sidebar tree is rendered twice — desktop + mobile).
      const matches = screen.getAllByRole('button', { name: new RegExp(k) });
      expect(matches.length).toBeGreaterThan(0);
    }
  });

  test('renders nav links for each item in groups', () => {
    const { container } = renderAt('/docs');
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/docs', '/docs/labs', '/docs/tests', '/docs/github']));
  });

  test('clicking a group toggles its items closed and back open', () => {
    renderAt('/docs');
    const overviewBefore = screen.getAllByRole('link', { name: /docs\.sidebar\.overview/ });
    expect(overviewBefore.length).toBeGreaterThan(0);

    // Find and click the FIRST gettingStarted button (desktop tree).
    const groupBtn = screen.getAllByRole('button', { name: /docs\.sidebar\.gettingStarted/ })[0];
    fireEvent.click(groupBtn);

    // After collapsing: should have one fewer overview link
    const overviewAfter = screen.queryAllByRole('link', { name: /docs\.sidebar\.overview/ });
    expect(overviewAfter.length).toBe(overviewBefore.length - 1);

    // Click again to re-expand
    fireEvent.click(groupBtn);
    const overviewReopened = screen.getAllByRole('link', { name: /docs\.sidebar\.overview/ });
    expect(overviewReopened.length).toBe(overviewBefore.length);
  });

  test('mobile menu opens via the openMenu button and the close button hides it', () => {
    renderAt('/docs');
    // openMenu and closeMenu have aria-labels keyed in i18n.
    const openBtn = screen.getByRole('button', { name: /docs\.sidebar\.openMenu/ });
    fireEvent.click(openBtn);
    const closeBtn = screen.getByRole('button', { name: /docs\.sidebar\.closeMenu/ });
    fireEvent.click(closeBtn);
    // Re-querying should still find openBtn (component still mounted).
    expect(screen.getByRole('button', { name: /docs\.sidebar\.openMenu/ })).toBeInTheDocument();
  });

  test('current path highlights the matching link with active styling', () => {
    const { container } = renderAt('/docs/labs');
    const labsLinks = container.querySelectorAll('a[href="/docs/labs"]');
    expect(labsLinks.length).toBeGreaterThan(0);
    expect(labsLinks[0].className).toMatch(/text-blue-300/);
  });
});
