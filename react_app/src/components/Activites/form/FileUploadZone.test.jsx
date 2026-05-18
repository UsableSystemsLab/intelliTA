import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FileUploadZone from './FileUploadZone';

describe('FileUploadZone', () => {
  test('renders default upload label when no file', () => {
    render(<FileUploadZone id="upload" onFileChange={() => {}} />);
    expect(screen.getByText(/Click to upload file/i)).toBeInTheDocument();
  });

  test('renders custom label when no file', () => {
    render(<FileUploadZone id="upload" label="Choose video" onFileChange={() => {}} />);
    expect(screen.getByText('Choose video')).toBeInTheDocument();
  });

  test('shows file name when a file is selected', () => {
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    render(<FileUploadZone id="upload" file={file} onFileChange={() => {}} />);
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
  });

  test('uses activeLabel over file name when provided', () => {
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    render(
      <FileUploadZone
        id="upload"
        file={file}
        activeLabel="File ready"
        onFileChange={() => {}}
      />,
    );
    expect(screen.getByText('File ready')).toBeInTheDocument();
    expect(screen.queryByText('notes.txt')).not.toBeInTheDocument();
  });

  test('invokes onFileChange with the chosen file', () => {
    const onFileChange = jest.fn();
    const { container } = render(
      <FileUploadZone id="upload" onFileChange={onFileChange} />,
    );
    const input = container.querySelector('input[type="file"]');
    const file = new File(['x'], 'test.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFileChange).toHaveBeenCalledTimes(1);
    expect(onFileChange.mock.calls[0][0].name).toBe('test.png');
  });

  test('passes accept attribute to input', () => {
    const { container } = render(
      <FileUploadZone id="upload" accept="image/*" onFileChange={() => {}} />,
    );
    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(input).toHaveAttribute('id', 'upload');
  });
});
