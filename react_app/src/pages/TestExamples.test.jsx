import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('@/components/TestExamples/Maincontent', () => ({
  __esModule: true,
  default: ({ user }) => <div data-testid="te-content">{user ? user.uid : 'no-user'}</div>,
}));

jest.mock('@/components/Docs/DocsTOC', () => ({
  __esModule: true,
  default: ({ items }) => (
    <ul data-testid="toc">
      {items.map((i) => <li key={i.id}>{i.label}</li>)}
    </ul>
  ),
}));

import TestExamples from './TestExamples';

describe('TestExamples page', () => {
  const renderAt = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

  test('renders content and TOC', () => {
    const { getByTestId } = renderAt(<TestExamples user={{ uid: 'abc' }} />);
    expect(getByTestId('te-content')).toHaveTextContent('abc');
    expect(getByTestId('toc')).toBeInTheDocument();
  });

  test('TOC contains the expected section labels', () => {
    const { getByTestId } = renderAt(<TestExamples user={null} />);
    const labels = Array.from(getByTestId('toc').querySelectorAll('li')).map(
      (li) => li.textContent,
    );
    expect(labels).toContain('How Tests Work');
    expect(labels).toContain('Bound Tests');
    expect(labels).toContain('Common Mistakes');
    expect(labels).toHaveLength(7);
  });
});
