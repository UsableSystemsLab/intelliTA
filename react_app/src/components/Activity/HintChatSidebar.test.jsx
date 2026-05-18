import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

jest.mock('@/utils/useSTT.js', () => ({
  __esModule: true,
  default: () => ({
    isSupported: false,
    isListening: false,
    interim: '',
    transcript: '',
    error: null,
    start: jest.fn(),
    stop: jest.fn(),
    clearError: jest.fn(),
  }),
  STT_ENABLED_KEY: 'stt_enabled',
  STT_LANG_KEY: 'stt_lang',
}));

jest.mock('@/utils/useTTS.js', () => ({
  __esModule: true,
  default: () => ({
    isSpeaking: false,
    isSupported: false,
    voices: [],
    speak: jest.fn(),
    cancel: jest.fn(),
  }),
  TTS_ENABLED_KEY: 'tts_enabled',
  TTS_VOICE_KEY: 'tts_voice',
  TTS_RATE_KEY: 'tts_rate',
  TTS_PITCH_KEY: 'tts_pitch',
}));

import HintChatSidebar from './HintChatSidebar';
import { auth } from '@/utils/firebase';

describe('HintChatSidebar', () => {
  const originalFetch = global.fetch;
  beforeAll(() => {
    auth.currentUser = { getIdToken: jest.fn(() => Promise.resolve('tkn')) };
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = function () {};
    } else {
      Element.prototype.scrollIntoView = jest.fn();
    }
  });
  afterAll(() => {
    auth.currentUser = null;
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('renders the welcome message when open', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
    );
    render(
      <HintChatSidebar
        isOpen={true}
        onClose={() => {}}
        user={{ uid: 'u1' }}
        activityId={42}
      />,
    );
    // Markdown is mocked; the welcome bubble appears after history fetch settles.
    await waitFor(() => {
      const bubbles = screen.getAllByTestId('markdown');
      expect(bubbles.length).toBeGreaterThan(0);
      expect(bubbles[0].textContent).toMatch(/IntelliTA/);
    });
  });

  test('close button calls onClose', () => {
    const onClose = jest.fn();
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
    );
    const { container } = render(
      <HintChatSidebar
        isOpen={true}
        onClose={onClose}
        user={{ uid: 'u1' }}
        activityId={42}
      />,
    );
    const closeBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.querySelector('svg.lucide-x'),
    );
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  test('typing into the textarea updates input value', () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
    );
    render(
      <HintChatSidebar
        isOpen={true}
        onClose={() => {}}
        user={{ uid: 'u1' }}
        activityId={42}
      />,
    );
    const ta = screen.getByPlaceholderText(/Ask for a hint/i);
    fireEvent.change(ta, { target: { value: 'help me' } });
    expect(ta).toHaveValue('help me');
  });

  test('sending without user/activityId shows login prompt message', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
    );
    render(
      <HintChatSidebar isOpen={true} onClose={() => {}} user={null} activityId={null} />,
    );
    const ta = screen.getByPlaceholderText(/Ask for a hint/i);
    fireEvent.change(ta, { target: { value: 'hello' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    await waitFor(() =>
      expect(screen.getByText(/Please log in to use the AI assistant/i)).toBeInTheDocument(),
    );
  });

  test('loads chat history on open and renders past assistant message', async () => {
    global.fetch = jest.fn((url) => {
      if (typeof url === 'string' && url.includes('/hint/history')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { role: 'user', content: 'previous Q' },
              { role: 'assistant', content: 'previous A' },
            ]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
    await act(async () => {
      render(
        <HintChatSidebar
          isOpen={true}
          onClose={() => {}}
          user={{ uid: 'u1' }}
          activityId={42}
        />,
      );
    });
    await waitFor(() => expect(screen.getByText('previous Q')).toBeInTheDocument());
    expect(screen.getByText('previous A')).toBeInTheDocument();
  });
});
