import React from 'react';
import { render } from '@testing-library/react';
import LoadingScreen from './LoadingScreen';

describe('LoadingScreen', () => {
  test('renders an animated spinner', () => {
    const { container } = render(<LoadingScreen />);
    const spinner = container.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
