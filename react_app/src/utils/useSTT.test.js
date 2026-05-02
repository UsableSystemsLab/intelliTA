// Set up window.SpeechRecognition BEFORE importing the hook —
// useSTT evaluates the global at module-load time.
let mockRecognitionInstance;
const MockSpeechRecognition = jest.fn(() => mockRecognitionInstance);

window.SpeechRecognition = MockSpeechRecognition;

const { renderHook, act } = require('@testing-library/react');
const useSTT = require('./useSTT').default;

beforeEach(() => {
  mockRecognitionInstance = {
    continuous: false,
    interimResults: false,
    lang: '',
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
    onresult: null,
    onerror: null,
    onend: null,
  };
  MockSpeechRecognition.mockClear();
  MockSpeechRecognition.mockImplementation(() => mockRecognitionInstance);
});

describe('useSTT', () => {
  test('isSupported true when SpeechRecognition exists', () => {
    const { result } = renderHook(() => useSTT());
    expect(result.current.isSupported).toBe(true);
  });

  test('initial state is idle', () => {
    const { result } = renderHook(() => useSTT());
    expect(result.current.isListening).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.interim).toBe('');
    expect(result.current.error).toBe(null);
  });

  test('start() configures recognition and calls .start()', () => {
    const { result } = renderHook(() => useSTT('en-US'));
    act(() => {
      result.current.start();
    });
    expect(MockSpeechRecognition).toHaveBeenCalled();
    expect(mockRecognitionInstance.continuous).toBe(true);
    expect(mockRecognitionInstance.interimResults).toBe(true);
    expect(mockRecognitionInstance.lang).toBe('en-US');
    expect(mockRecognitionInstance.start).toHaveBeenCalled();
    expect(result.current.isListening).toBe(true);
  });

  test('start() respects custom lang argument', () => {
    const { result } = renderHook(() => useSTT('ar-SA'));
    act(() => {
      result.current.start();
    });
    expect(mockRecognitionInstance.lang).toBe('ar-SA');
  });

  test('onresult populates transcript with final result', () => {
    const { result } = renderHook(() => useSTT());
    act(() => {
      result.current.start();
    });
    act(() => {
      mockRecognitionInstance.onresult({
        resultIndex: 0,
        results: [
          { isFinal: true, 0: { transcript: 'hello world' }, length: 1 },
        ],
      });
    });
    expect(result.current.transcript).toBe('hello world');
    expect(result.current.interim).toBe('');
  });

  test('onresult populates interim for non-final results', () => {
    const { result } = renderHook(() => useSTT());
    act(() => {
      result.current.start();
    });
    act(() => {
      mockRecognitionInstance.onresult({
        resultIndex: 0,
        results: [
          { isFinal: false, 0: { transcript: 'partial' }, length: 1 },
        ],
      });
    });
    expect(result.current.interim).toBe('partial');
    expect(result.current.transcript).toBe('');
  });

  test('onerror with not-allowed sets permission-denied error', () => {
    const { result } = renderHook(() => useSTT());
    act(() => {
      result.current.start();
    });
    act(() => {
      mockRecognitionInstance.onerror({ error: 'not-allowed' });
    });
    expect(result.current.error).toBe('permission-denied');
    expect(result.current.isListening).toBe(false);
  });

  test('onerror with network sets network error', () => {
    const { result } = renderHook(() => useSTT());
    act(() => {
      result.current.start();
    });
    act(() => {
      mockRecognitionInstance.onerror({ error: 'network' });
    });
    expect(result.current.error).toBe('network');
  });

  test('onerror with no-speech is silent (no error set)', () => {
    const { result } = renderHook(() => useSTT());
    act(() => {
      result.current.start();
    });
    act(() => {
      mockRecognitionInstance.onerror({ error: 'no-speech' });
    });
    expect(result.current.error).toBe(null);
    expect(result.current.isListening).toBe(false);
  });

  test('stop() calls recognition.stop and clears listening state', () => {
    const { result } = renderHook(() => useSTT());
    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.stop();
    });
    expect(mockRecognitionInstance.stop).toHaveBeenCalled();
    expect(result.current.isListening).toBe(false);
    expect(result.current.interim).toBe('');
  });

  test('onend resets interim and isListening', () => {
    const { result } = renderHook(() => useSTT());
    act(() => {
      result.current.start();
    });
    act(() => {
      mockRecognitionInstance.onend();
    });
    expect(result.current.isListening).toBe(false);
    expect(result.current.interim).toBe('');
  });

  test('clearError() resets error to null', () => {
    const { result } = renderHook(() => useSTT());
    act(() => {
      result.current.start();
    });
    act(() => {
      mockRecognitionInstance.onerror({ error: 'not-allowed' });
    });
    expect(result.current.error).toBe('permission-denied');
    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBe(null);
  });

  test('start() is a no-op when already listening', () => {
    const { result } = renderHook(() => useSTT());
    act(() => {
      result.current.start();
    });
    MockSpeechRecognition.mockClear();
    act(() => {
      result.current.start();
    });
    expect(MockSpeechRecognition).not.toHaveBeenCalled();
  });

  test('unmount aborts recognition', () => {
    const { result, unmount } = renderHook(() => useSTT());
    act(() => {
      result.current.start();
    });
    unmount();
    expect(mockRecognitionInstance.abort).toHaveBeenCalled();
  });
});
