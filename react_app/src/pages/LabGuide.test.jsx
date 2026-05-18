import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('@/components/LabGuide/Maincontent', () => ({
  __esModule: true,
  default: ({ user }) => <div data-testid="lab-content">{user ? user.uid : 'no-user'}</div>,
}));

jest.mock('@/components/Docs/DocsTOC', () => ({
  __esModule: true,
  default: ({ items }) => (
    <ul data-testid="toc">
      {items.map((i) => <li key={i.id}>{i.label}</li>)}
    </ul>
  ),
}));

import LabGuide from './LabGuide';

describe('LabGuide page', () => {
  const renderAt = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

  test('renders lab content and the TOC together', () => {
    const { getByTestId } = renderAt(<LabGuide user={{ uid: 'u1' }} />);
    expect(getByTestId('lab-content')).toHaveTextContent('u1');
    expect(getByTestId('toc')).toBeInTheDocument();
  });

  test('passes the expected TOC items', () => {
    const { getByTestId } = renderAt(<LabGuide user={null} />);
    const labels = Array.from(getByTestId('toc').querySelectorAll('li')).map(
      (li) => li.textContent,
    );
    expect(labels).toEqual([
      'What is a Lab?',
      'How It Works',
      'Creation Steps',
      'Checkpoint Types',
      'Writing Tests',
      'AI Hints',
      'Full Example',
    ]);
  });
});
