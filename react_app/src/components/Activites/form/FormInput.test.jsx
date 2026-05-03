import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormInput from './FormInput';

describe('FormInput', () => {
  test('renders label and input', () => {
    render(<FormInput label="Email" value="" onChange={() => {}} />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('passes type, placeholder, and required to the input', () => {
    render(
      <FormInput
        label="Pwd"
        type="password"
        placeholder="enter pwd"
        required
        value=""
        onChange={() => {}}
      />
    );
    const input = document.querySelector('input');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('placeholder', 'enter pwd');
    expect(input).toBeRequired();
  });

  test('calls onChange with the new value', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<FormInput label="Name" value="" onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  test('applies date color-scheme class for datetime-local', () => {
    render(<FormInput label="When" type="datetime-local" value="" onChange={() => {}} />);
    const input = document.querySelector('input');
    expect(input.className).toMatch(/color-scheme:dark/);
  });

  test('forwards min attribute when provided', () => {
    render(<FormInput label="N" type="number" value="" onChange={() => {}} min={5} />);
    const input = document.querySelector('input');
    expect(input).toHaveAttribute('min', '5');
  });
});
