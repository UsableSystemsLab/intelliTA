import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
// Used for any test that renders routed components
export function renderWithProviders(ui, { route = '/', ...options } = {}) {
  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
  );
  return render(ui, { wrapper, ...options });
}

export default renderWithProviders;
