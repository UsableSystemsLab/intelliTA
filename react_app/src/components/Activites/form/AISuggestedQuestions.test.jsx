import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import AISuggestedQuestions from './AISuggestedQuestions';
import { auth } from '@/utils/firebase';

describe('AISuggestedQuestions', () => {
  const originalFetch = global.fetch;

  beforeAll(() => {
    auth.currentUser = { getIdToken: jest.fn(() => Promise.resolve('test-token')) };
  });
  afterAll(() => {
    auth.currentUser = null;
  });

  function mockFetchTranscript(status) {
    global.fetch = jest.fn((url) => {
      if (typeof url === 'string' && url.includes('/transcripts/activities/')) {
        if (status === 404) {
          return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ status, transcript_id: 'tx-1' }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  }

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('renders header label', async () => {
    mockFetchTranscript('completed');
    await act(async () => {
      render(
        <AISuggestedQuestions
          activityId="a1"
          videoUrl="https://v/x.mp4"
          videoDuration={300}
          onInjectQuestions={() => {}}
        />,
      );
    });
    expect(screen.getByText('aiSuggestedQuestions')).toBeInTheDocument();
  });

  test('shows transcript prompt when activity has no transcript (404)', async () => {
    mockFetchTranscript(404);
    await act(async () => {
      render(
        <AISuggestedQuestions
          activityId="a1"
          videoUrl="https://v/x.mp4"
          videoDuration={120}
          onInjectQuestions={() => {}}
        />,
      );
    });
    await waitFor(() =>
      expect(screen.getByText('transcriptNotProcessed')).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /processVideo/i })).toBeInTheDocument();
  });

  test('shows generate button when transcript is completed', async () => {
    mockFetchTranscript('completed');
    await act(async () => {
      render(
        <AISuggestedQuestions
          activityId="a1"
          videoUrl="https://v/x.mp4"
          videoDuration={300}
          onInjectQuestions={() => {}}
        />,
      );
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /generateQuestions/i })).toBeInTheDocument(),
    );
  });

  test('shows failed banner with retry button when transcript failed', async () => {
    mockFetchTranscript('failed');
    await act(async () => {
      render(
        <AISuggestedQuestions
          activityId="a1"
          videoUrl="https://v/x.mp4"
          videoDuration={120}
          onInjectQuestions={() => {}}
        />,
      );
    });
    await waitFor(() =>
      expect(screen.getByText('transcriptionFailed')).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  test('does nothing when no activityId is provided', async () => {
    global.fetch = jest.fn();
    await act(async () => {
      render(
        <AISuggestedQuestions
          activityId={null}
          videoUrl=""
          videoDuration={0}
          onInjectQuestions={() => {}}
        />,
      );
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
