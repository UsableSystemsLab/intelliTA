// Set up window.speechSynthesis BEFORE importing the hook —
// useTTS evaluates `'speechSynthesis' in window` at module-load time.
const speakMock = jest.fn();
const cancelMock = jest.fn();
const getVoicesMock = jest.fn(() => []);

window.speechSynthesis = {
  speak: speakMock,
  cancel: cancelMock,
  getVoices: getVoicesMock,
};

global.SpeechSynthesisUtterance = jest.fn(function (text) {
  this.text = text;
  this.rate = 1;
  this.pitch = 1;
  this.voice = null;
  this.onstart = null;
  this.onend = null;
  this.onerror = null;
});

const { renderHook, act } = require('@testing-library/react');
const useTTS = require('./useTTS').default;

describe('useTTS', () => {
  beforeEach(() => {
    speakMock.mockReset();
    cancelMock.mockReset();
    getVoicesMock.mockReset();
    getVoicesMock.mockReturnValue([]);
    speakMock.mockImplementation((utterance) => {
      // Simulate async start
      setTimeout(() => utterance.onstart && utterance.onstart(), 0);
    });
    localStorage.clear();
  });

  afterEach(() => {
    if (jest.isMockFunction(setTimeout)) {
      jest.useRealTimers();
    }
  });

  test('reports isSupported true when speechSynthesis exists', () => {
    const { result } = renderHook(() => useTTS('hello'));
    expect(result.current.isSupported).toBe(true);
  });

  test('initial isSpeaking is false', () => {
    const { result } = renderHook(() => useTTS('hello'));
    expect(result.current.isSpeaking).toBe(false);
  });

  test('speak() calls speechSynthesis.speak with stripped markdown', () => {
    const { result } = renderHook(() => useTTS('# Heading\n**bold** text'));
    act(() => {
      result.current.speak();
    });
    expect(speakMock).toHaveBeenCalledTimes(1);
    const utterance = speakMock.mock.calls[0][0];
    expect(utterance.text).toBe('Heading bold text');
  });

  test('speak() does not call speak when text is empty', () => {
    const { result } = renderHook(() => useTTS(''));
    act(() => {
      result.current.speak();
    });
    expect(speakMock).not.toHaveBeenCalled();
  });

  test('speak() cancels any ongoing speech first', () => {
    const { result } = renderHook(() => useTTS('hi'));
    act(() => {
      result.current.speak();
    });
    expect(cancelMock).toHaveBeenCalled();
  });

  test('speak() applies saved rate and pitch from localStorage', () => {
    localStorage.setItem('intelliTA-tts-rate', '1.5');
    localStorage.setItem('intelliTA-tts-pitch', '0.8');
    const { result } = renderHook(() => useTTS('hello'));
    act(() => {
      result.current.speak();
    });
    const utterance = speakMock.mock.calls[0][0];
    expect(utterance.rate).toBe(1.5);
    expect(utterance.pitch).toBe(0.8);
  });

  test('speak() applies saved voice when match exists', () => {
    const voiceObj = { name: 'TestVoice' };
    getVoicesMock.mockReturnValue([voiceObj]);
    localStorage.setItem('intelliTA-tts-voice', 'TestVoice');
    const { result } = renderHook(() => useTTS('hello'));
    act(() => {
      result.current.speak();
    });
    expect(speakMock.mock.calls[0][0].voice).toBe(voiceObj);
  });

  test('isSpeaking flips to true on utterance.onstart', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useTTS('hello'));
    act(() => {
      result.current.speak();
    });
    act(() => {
      jest.runAllTimers();
    });
    expect(result.current.isSpeaking).toBe(true);
    jest.useRealTimers();
  });

  test('stop() cancels and resets isSpeaking', () => {
    const { result } = renderHook(() => useTTS('hello'));
    act(() => {
      result.current.stop();
    });
    expect(cancelMock).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });

  test('unmount cancels any in-progress speech', () => {
    const { unmount } = renderHook(() => useTTS('hello'));
    cancelMock.mockClear();
    unmount();
    expect(cancelMock).toHaveBeenCalled();
  });
});
