import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('./AISuggestedQuestions', () => ({
  __esModule: true,
  default: () => <div data-testid="ai-suggested" />,
}));

import QuizEditor from './QuizEditor';

describe('QuizEditor', () => {
  test('shows empty-state prompt when no questions', () => {
    render(<QuizEditor questions={[]} onQuestionsChange={() => {}} />);
    expect(screen.getByText('clickToAddQuiz')).toBeInTheDocument();
  });

  test('summarizes existing questions in the trigger', () => {
    const questions = [
      { id: 1, type: 'mcq', time: 30 },
      { id: 2, type: 'true_false', time: 90 },
    ];
    render(<QuizEditor questions={questions} onQuestionsChange={() => {}} />);
    expect(screen.getByText(/2 questions/)).toBeInTheDocument();
    expect(screen.getByText(/Multiple Choice/)).toBeInTheDocument();
    expect(screen.getByText(/True \/ False/)).toBeInTheDocument();
  });

  test('opens modal when trigger is clicked', () => {
    render(<QuizEditor questions={[]} onQuestionsChange={() => {}} />);
    fireEvent.click(screen.getByText('clickToAddQuiz'));
    expect(screen.getByText('noQuestionsYet')).toBeInTheDocument();
  });

  test('addQuestion appends a new question via onQuestionsChange', () => {
    const onQuestionsChange = jest.fn();
    render(<QuizEditor questions={[]} onQuestionsChange={onQuestionsChange} />);
    fireEvent.click(screen.getByText('clickToAddQuiz'));
    const addBtns = screen.getAllByRole('button', { name: /addQuestion/i });
    fireEvent.click(addBtns[addBtns.length - 1]);
    expect(onQuestionsChange).toHaveBeenCalledTimes(1);
    const next = onQuestionsChange.mock.calls[0][0];
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ type: 'mcq', time: 0 });
  });

  test('AI suggest button only shows when activityId provided', () => {
    const { rerender } = render(
      <QuizEditor questions={[]} onQuestionsChange={() => {}} />,
    );
    fireEvent.click(screen.getByText('clickToAddQuiz'));
    expect(screen.queryByRole('button', { name: /suggestWithAI/i })).not.toBeInTheDocument();

    rerender(
      <QuizEditor questions={[]} onQuestionsChange={() => {}} activityId="a1" />,
    );
    fireEvent.click(screen.getByText('clickToAddQuiz'));
    expect(screen.getByRole('button', { name: /suggestWithAI/i })).toBeInTheDocument();
  });

  test('Done button closes the modal', () => {
    render(<QuizEditor questions={[]} onQuestionsChange={() => {}} />);
    fireEvent.click(screen.getByText('clickToAddQuiz'));
    expect(screen.getByText('noQuestionsYet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^done$/i }));
    expect(screen.queryByText('noQuestionsYet')).not.toBeInTheDocument();
  });
});
