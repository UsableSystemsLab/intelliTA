import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NewFileModal from './NewFileModal';
import { FILE_LANGUAGES } from './fileLanguages';

describe('NewFileModal', () => {
  test('renders nothing when isOpen is false', () => {
    const { container } = render(<NewFileModal isOpen={false} onClose={() => {}} onConfirm={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders title, language selector, and filename input when open', () => {
    render(<NewFileModal isOpen={true} onClose={() => {}} onConfirm={() => {}} title="Make a file" />);
    expect(screen.getByText('Make a file')).toBeInTheDocument();
    expect(screen.getByText('File type')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('main')).toBeInTheDocument();
  });

  test('shows error when confirming with empty filename', () => {
    const onConfirm = jest.fn();
    render(<NewFileModal isOpen={true} onClose={() => {}} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    expect(screen.getByText(/filename is required/i)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('shows duplicate-name error when filename already exists', () => {
    const lang = FILE_LANGUAGES[0];
    const existing = `dup.${lang.extension}`;
    const onConfirm = jest.fn();
    render(
      <NewFileModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={onConfirm}
        existingNames={[existing]}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('main'), { target: { value: 'dup' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    expect(screen.getByText(new RegExp(`A file named "${existing}" already exists`))).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('confirm calls onConfirm with built filename and language id', () => {
    const lang = FILE_LANGUAGES[0];
    const onConfirm = jest.fn();
    render(<NewFileModal isOpen={true} onClose={() => {}} onConfirm={onConfirm} />);
    fireEvent.change(screen.getByPlaceholderText('main'), { target: { value: 'app' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    expect(onConfirm).toHaveBeenCalledWith({
      filename: `app.${lang.extension}`,
      languageId: lang.id,
    });
  });

  test('Enter key in filename input triggers confirm', () => {
    const onConfirm = jest.fn();
    render(<NewFileModal isOpen={true} onClose={() => {}} onConfirm={onConfirm} />);
    const input = screen.getByPlaceholderText('main');
    fireEvent.change(input, { target: { value: 'kbd' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onConfirm).toHaveBeenCalled();
  });

  test('cancel button calls onClose', () => {
    const onClose = jest.fn();
    render(<NewFileModal isOpen={true} onClose={onClose} onConfirm={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  test('lockedLanguageId hides selector and shows locked notice', () => {
    const locked = FILE_LANGUAGES[0].id;
    render(
      <NewFileModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        lockedLanguageId={locked}
      />
    );
    expect(screen.queryByText('File type')).not.toBeInTheDocument();
    expect(screen.getByText(/locked to/i)).toBeInTheDocument();
  });

  test('changing language dropdown updates the extension shown', () => {
    if (FILE_LANGUAGES.length < 2) return;
    const second = FILE_LANGUAGES[1];
    render(<NewFileModal isOpen={true} onClose={() => {}} onConfirm={() => {}} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: second.id } });
    expect(screen.getAllByText(`.${second.extension}`).length).toBeGreaterThan(0);
  });

  test('initial values prefill basename and language when renaming', () => {
    const lang = FILE_LANGUAGES[0];
    render(
      <NewFileModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        initial={{ basename: 'preset', languageId: lang.id }}
      />
    );
    expect(screen.getByDisplayValue('preset')).toBeInTheDocument();
  });
});
