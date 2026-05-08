import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-simple-typewriter', () => ({
  Typewriter: ({ words }) => <span data-testid="typewriter">{words?.[0] || ''}</span>,
}));

import CodeFrame from './CodeFrame';

describe('CodeFrame', () => {
  test('renders the typewriter inside a code block', () => {
    render(<CodeFrame />);
    expect(screen.getByTestId('typewriter')).toBeInTheDocument();
    // first word is the Java snippet
    expect(screen.getByTestId('typewriter').textContent).toMatch(/public class Main/);
  });
});
