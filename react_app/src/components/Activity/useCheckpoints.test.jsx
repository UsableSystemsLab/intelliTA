import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useCheckpoints } from './useCheckpoints';

function makeProps(overrides = {}) {
  const setFiles = jest.fn();
  const setActiveFile = jest.fn();
  const onFeedback = jest.fn();
  const onPlay = jest.fn();
  const onPause = jest.fn();
  const onSeek = jest.fn();
  const onAnswerRecorded = jest.fn();
  return {
    setFiles,
    setActiveFile,
    onFeedback,
    onPlay,
    onPause,
    onSeek,
    onAnswerRecorded,
    currentTime: 0,
    files: [{ name: 'index.js', content: 'a' }],
    videoRef: { current: null },
    activeFile: { name: 'index.js', content: 'a' },
    INITIAL_FILES: [{ name: 'index.js', content: 'a' }],
    quizQuestions: [],
    answeredQuestions: [],
    ...overrides,
  };
}

describe('useCheckpoints', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  test('builds checkpoints from quiz questions sorted by time', () => {
    const props = makeProps({
      quizQuestions: [
        { id: 2, type: 'mcq', time: 60, question: 'Q2', options: ['a', 'b'], correctAnswer: 0 },
        { id: 1, type: 'true_false', time: 10, question: 'Q1', correctAnswer: true },
      ],
    });
    const { result } = renderHook(() => useCheckpoints(props));
    expect(result.current.checkpoints).toHaveLength(2);
    expect(result.current.checkpoints[0].id).toBe('quiz_1');
    expect(result.current.checkpoints[1].id).toBe('quiz_2');
  });

  test('marks pre-answered correct questions as verified', () => {
    const props = makeProps({
      quizQuestions: [{ id: 1, type: 'mcq', time: 10, correctAnswer: 0, options: ['a'] }],
      answeredQuestions: [{ question_id: 1, is_correct: true }],
    });
    const { result } = renderHook(() => useCheckpoints(props));
    expect(result.current.checkpoints[0].status).toBe('verified');
  });

  test('submitQuizAnswer marks verified on correct mcq answer', () => {
    const props = makeProps({
      currentTime: 10,
      quizQuestions: [{ id: 1, type: 'mcq', time: 10, correctAnswer: 1, options: ['a', 'b'] }],
    });
    const { result, rerender } = renderHook((p) => useCheckpoints(p), { initialProps: props });
    // currentTime hits the checkpoint, hook auto-activates it via effect
    rerender({ ...props, currentTime: 10 });
    expect(props.onPause).toHaveBeenCalled();
    expect(result.current.activeCheckpoint?.id).toBe('quiz_1');

    act(() => {
      result.current.submitQuizAnswer(1);
    });
    expect(props.onAnswerRecorded).toHaveBeenCalledWith({
      question_id: 1,
      answer: 1,
      is_correct: true,
    });
    expect(props.onFeedback).toHaveBeenCalledWith({ type: 'success', message: expect.any(String) });
  });

  test('submitQuizAnswer records is_correct=false on wrong answer', () => {
    const props = makeProps({
      currentTime: 5,
      quizQuestions: [{ id: 1, type: 'mcq', time: 5, correctAnswer: 0, options: ['a', 'b'] }],
    });
    const { result, rerender } = renderHook((p) => useCheckpoints(p), { initialProps: props });
    rerender({ ...props, currentTime: 5 });
    act(() => {
      result.current.submitQuizAnswer(1);
    });
    expect(props.onAnswerRecorded).toHaveBeenCalledWith({
      question_id: 1,
      answer: 1,
      is_correct: false,
    });
  });

  test('fill_blank answers are compared case-insensitively and trimmed', () => {
    const props = makeProps({
      currentTime: 5,
      quizQuestions: [{ id: 1, type: 'fill_blank', time: 5, correctAnswer: 'Hello' }],
    });
    const { result, rerender } = renderHook((p) => useCheckpoints(p), { initialProps: props });
    rerender({ ...props, currentTime: 5 });
    act(() => {
      result.current.submitQuizAnswer('  hello  ');
    });
    expect(props.onAnswerRecorded).toHaveBeenCalledWith(
      expect.objectContaining({ is_correct: true }),
    );
  });

  test('skipCheckpoint marks active checkpoint skipped and resumes playback', () => {
    const props = makeProps({
      currentTime: 5,
      quizQuestions: [{ id: 1, type: 'mcq', time: 5, correctAnswer: 0, options: ['a', 'b'] }],
    });
    const { result, rerender } = renderHook((p) => useCheckpoints(p), { initialProps: props });
    rerender({ ...props, currentTime: 5 });
    act(() => {
      result.current.skipCheckpoint();
    });
    expect(result.current.activeCheckpoint).toBeNull();
    expect(result.current.checkpoints[0].status).toBe('skipped');
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(props.onPlay).toHaveBeenCalled();
  });

  test('retryCheckpoint resets status to pending and seeks to its time', () => {
    const props = makeProps({
      currentTime: 30,
      quizQuestions: [{ id: 1, type: 'mcq', time: 5, correctAnswer: 0, options: ['a', 'b'] }],
      answeredQuestions: [{ question_id: 1, is_correct: true }],
    });
    const { result } = renderHook(() => useCheckpoints(props));
    act(() => {
      result.current.retryCheckpoint('quiz_1');
    });
    expect(result.current.checkpoints[0].status).toBe('pending');
    expect(props.onSeek).toHaveBeenCalledWith(5);
  });
});
