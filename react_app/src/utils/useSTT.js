import { useState, useEffect, useCallback, useRef } from 'react';

const STT_ENABLED_KEY = 'intelliTA-stt-enabled';
const STT_LANG_KEY = 'intelliTA-stt-lang';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;
const isSupported = !!SpeechRecognition;

export default function useSTT(lang = 'en-US') {
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try { recognition.stop(); } catch { /* already stopped */ }
    }
    setInterim('');
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    if (!isSupported || isListening) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    let finalText = '';

    recognition.onresult = (event) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      if (finalText) setTranscript(finalText);
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // silent recovery
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('permission-denied');
      } else if (event.error === 'network') {
        setError('network');
      } else {
        setError(event.error);
      }
      setInterim('');
      setIsListening(false);
    };

    recognition.onend = () => {
      setInterim('');
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setTranscript('');
    setInterim('');
    setError(null);
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }, [lang, isListening]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      if (recognition) {
        try { recognition.abort(); } catch { /* noop */ }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    interim,
    transcript,
    error,
    start,
    stop,
    clearError,
  };
}

export { STT_ENABLED_KEY, STT_LANG_KEY };
