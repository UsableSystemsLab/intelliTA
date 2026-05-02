import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToggleButtonGroup from './ToggleButtonGroup';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

describe('ToggleButtonGroup', () => {
  test('renders all options', () => {
    render(<ToggleButtonGroup options={options} activeValue="a" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gamma' })).toBeInTheDocument();
  });

  test('highlights only the active option', () => {
    render(<ToggleButtonGroup options={options} activeValue="b" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Beta' }).className).toMatch(/border-blue-500/);
    expect(screen.getByRole('button', { name: 'Alpha' }).className).not.toMatch(/border-blue-500/);
  });

  test('clicking a button invokes onChange with that value', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<ToggleButtonGroup options={options} activeValue="a" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Gamma' }));
    expect(onChange).toHaveBeenCalledWith('c');
  });
});
