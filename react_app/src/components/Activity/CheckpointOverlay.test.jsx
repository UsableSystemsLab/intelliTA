import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckpointOverlay from './CheckpointOverlay';

const baseProps = {
  activeCheckpoint: null,
  feedback: null,
  onCheckSolution: jest.fn(),
  onSubmitQuizAnswer: jest.fn(),
  onSkip: jest.fn(),
  onHint: jest.fn(),
  hintText: '',
  isLoadingHint: false,
};

beforeEach(() => {
  baseProps.onCheckSolution.mockClear();
  baseProps.onSubmitQuizAnswer.mockClear();
  baseProps.onSkip.mockClear();
  baseProps.onHint.mockClear();
});

describe('CheckpointOverlay', () => {
  test('renders nothing when activeCheckpoint is null', () => {
    const { container } = render(<CheckpointOverlay {...baseProps} />);
    expect(container.firstChild).toBeNull();
  });

  describe('challenge type', () => {
    const cp = { id: 1, type: 'challenge', title: 'Reverse a string', instruction: 'Write a function...' };

    test('renders title and verify button; verify calls onCheckSolution', async () => {
      const user = userEvent.setup();
      render(<CheckpointOverlay {...baseProps} activeCheckpoint={cp} />);
      expect(screen.getByText('Reverse a string')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /verifySolution/i }));
      expect(baseProps.onCheckSolution).toHaveBeenCalledTimes(1);
    });

    test('shows the hint button (challenges always offer a hint)', () => {
      render(<CheckpointOverlay {...baseProps} activeCheckpoint={cp} />);
      expect(screen.getByRole('button', { name: /hint/i })).toBeInTheDocument();
    });
  });

  describe('mcq type', () => {
    const cp = {
      id: 2,
      type: 'mcq',
      question: 'What is 2+2?',
      options: ['3', '4', '5', '22'],
    };

    test('submit button is disabled until an option is selected', () => {
      render(<CheckpointOverlay {...baseProps} activeCheckpoint={cp} />);
      expect(screen.getByRole('button', { name: /submitAnswer/i })).toBeDisabled();
    });

    test('selecting an option then submitting calls onSubmitQuizAnswer with the index', async () => {
      const user = userEvent.setup();
      render(<CheckpointOverlay {...baseProps} activeCheckpoint={cp} />);
      // Pick option B (index 1 — "4")
      await user.click(screen.getByText('4'));
      const submitBtn = screen.getByRole('button', { name: /submitAnswer/i });
      expect(submitBtn).not.toBeDisabled();
      await user.click(submitBtn);
      expect(baseProps.onSubmitQuizAnswer).toHaveBeenCalledWith(1);
    });
  });

  describe('true_false type', () => {
    const cp = { id: 3, type: 'true_false', question: 'The sky is blue.' };

    test('clicking trueLabel submits true', async () => {
      const user = userEvent.setup();
      render(<CheckpointOverlay {...baseProps} activeCheckpoint={cp} />);
      await user.click(screen.getByRole('button', { name: /trueLabel/i }));
      expect(baseProps.onSubmitQuizAnswer).toHaveBeenCalledWith(true);
    });

    test('clicking falseLabel submits false', async () => {
      const user = userEvent.setup();
      render(<CheckpointOverlay {...baseProps} activeCheckpoint={cp} />);
      await user.click(screen.getByRole('button', { name: /falseLabel/i }));
      expect(baseProps.onSubmitQuizAnswer).toHaveBeenCalledWith(false);
    });
  });

  describe('fill_blank type', () => {
    const cp = { id: 4, type: 'fill_blank', question: 'Capital of France?' };

    test('submit disabled until input has non-whitespace content', async () => {
      const user = userEvent.setup();
      render(<CheckpointOverlay {...baseProps} activeCheckpoint={cp} />);
      const submitBtn = screen.getByRole('button', { name: /submitAnswer/i });
      expect(submitBtn).toBeDisabled();
      await user.type(screen.getByPlaceholderText('Type your answer...'), '   ');
      expect(submitBtn).toBeDisabled();
      await user.type(screen.getByPlaceholderText('Type your answer...'), 'Paris');
      expect(submitBtn).not.toBeDisabled();
    });

    test('typing then submitting passes the answer', async () => {
      const user = userEvent.setup();
      render(<CheckpointOverlay {...baseProps} activeCheckpoint={cp} />);
      const input = screen.getByPlaceholderText('Type your answer...');
      await user.type(input, 'Paris');
      await user.click(screen.getByRole('button', { name: /submitAnswer/i }));
      expect(baseProps.onSubmitQuizAnswer).toHaveBeenCalledWith('Paris');
    });

    test('Enter key submits the answer when non-empty', () => {
      render(<CheckpointOverlay {...baseProps} activeCheckpoint={cp} />);
      const input = screen.getByPlaceholderText('Type your answer...');
      fireEvent.change(input, { target: { value: 'Paris' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      expect(baseProps.onSubmitQuizAnswer).toHaveBeenCalledWith('Paris');
    });
  });

  describe('shared buttons', () => {
    const cp = { id: 5, type: 'challenge', title: 'X', instruction: '' };

    test('skip button calls onSkip', async () => {
      const user = userEvent.setup();
      render(<CheckpointOverlay {...baseProps} activeCheckpoint={cp} />);
      await user.click(screen.getByRole('button', { name: /skip/i }));
      expect(baseProps.onSkip).toHaveBeenCalledTimes(1);
    });

    test('hint button calls onHint', async () => {
      const user = userEvent.setup();
      render(<CheckpointOverlay {...baseProps} activeCheckpoint={cp} />);
      await user.click(screen.getByRole('button', { name: /^hint$/i }));
      expect(baseProps.onHint).toHaveBeenCalledTimes(1);
    });

    test('isLoadingHint disables the hint button and shows the loader', () => {
      const { container } = render(
        <CheckpointOverlay {...baseProps} activeCheckpoint={cp} isLoadingHint />
      );
      // The hint button now reads "Generating Hint..."
      const btn = screen.getByRole('button', { name: /Generating Hint/i });
      expect(btn).toBeDisabled();
      expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
    });

    test('hintText renders inside the overlay', () => {
      render(
        <CheckpointOverlay {...baseProps} activeCheckpoint={cp} hintText="Try recursion." />
      );
      expect(screen.getByText('Try recursion.')).toBeInTheDocument();
    });

    test('success feedback renders with success styling', () => {
      const { container } = render(
        <CheckpointOverlay
          {...baseProps}
          activeCheckpoint={cp}
          feedback={{ type: 'success', message: 'Nice work!' }}
        />
      );
      expect(screen.getByText('Nice work!')).toBeInTheDocument();
      expect(container.querySelector('.text-emerald-400, .bg-emerald-500\\/10')).toBeInTheDocument();
    });

    test('error feedback renders with error styling', () => {
      const { container } = render(
        <CheckpointOverlay
          {...baseProps}
          activeCheckpoint={cp}
          feedback={{ type: 'error', message: 'Wrong answer.' }}
        />
      );
      expect(screen.getByText('Wrong answer.')).toBeInTheDocument();
      expect(container.querySelector('.text-red-400, .bg-red-500\\/10')).toBeInTheDocument();
    });
  });
});
