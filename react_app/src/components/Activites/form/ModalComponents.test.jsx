import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bot } from 'lucide-react';
import { ModalHeader, ErrorAlert, CloseButton, UrlInput } from './ModalComponents';

describe('ModalHeader', () => {
  test('renders title and subtitle with default Sparkles icon', () => {
    render(<ModalHeader title="Hello" subtitle="World" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('World')).toBeInTheDocument();
  });

  test('subtitle is omitted when not given', () => {
    render(<ModalHeader title="Only" />);
    expect(screen.getByText('Only')).toBeInTheDocument();
    // No paragraph for subtitle
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  test('accepts a custom icon', () => {
    const { container } = render(<ModalHeader icon={Bot} title="Bots" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('ErrorAlert', () => {
  test('renders the message when provided', () => {
    render(<ErrorAlert message="Something broke" />);
    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  test('renders nothing when message is empty / undefined', () => {
    const { container: c1 } = render(<ErrorAlert message="" />);
    expect(c1.firstChild).toBeNull();
    const { container: c2 } = render(<ErrorAlert />);
    expect(c2.firstChild).toBeNull();
  });
});

describe('CloseButton', () => {
  test('calls onClick when clicked', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    render(<CloseButton onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('absolute prop adds positioning classes by default', () => {
    render(<CloseButton onClick={jest.fn()} />);
    expect(screen.getByRole('button')).toHaveClass('absolute');
  });

  test('absolute=false drops the absolute class', () => {
    render(<CloseButton onClick={jest.fn()} absolute={false} />);
    expect(screen.getByRole('button')).not.toHaveClass('absolute');
  });
});

describe('UrlInput', () => {
  test('renders with default placeholder', () => {
    render(<UrlInput value="" onChange={jest.fn()} />);
    expect(screen.getByPlaceholderText('https://...')).toBeInTheDocument();
  });

  test('forwards value and calls onChange with the new string', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<UrlInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('https://...');
    await user.type(input, 'a');

    expect(onChange).toHaveBeenCalledWith('a');
  });

  test('accepts a custom placeholder', () => {
    render(<UrlInput value="" onChange={jest.fn()} placeholder="paste link" />);
    expect(screen.getByPlaceholderText('paste link')).toBeInTheDocument();
  });
});
