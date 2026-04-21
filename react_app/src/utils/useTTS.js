import { useState, useEffect, useCallback, useRef } from 'react';

const TTS_ENABLED_KEY = 'intelliTA-tts-enabled';
const TTS_VOICE_KEY = 'intelliTA-tts-voice';
const TTS_RATE_KEY = 'intelliTA-tts-rate';
const TTS_PITCH_KEY = 'intelliTA-tts-pitch';

const isSupported = 'speechSynthesis' in window;

function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')       // remove code blocks
    .replace(/`([^`]+)`/g, '$1')          // inline code -> content
    .replace(/!\[.*?\]\(.*?\)/g, '')      // remove images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links -> text
    .replace(/#{1,6}\s+/g, '')            // headings
    .replace(/(\*\*|__)(.*?)\1/g, '$2')   // bold
    .replace(/(\*|_)(.*?)\1/g, '$2')      // italic
    .replace(/~~(.*?)~~/g, '$1')          // strikethrough
    .replace(/>\s+/g, '')                 // blockquotes
    .replace(/[-*+]\s+/g, '')             // unordered list markers
    .replace(/\d+\.\s+/g, '')             // ordered list markers
    .replace(/\n{2,}/g, '. ')             // paragraph breaks -> pause
    .replace(/\n/g, ' ')                  // newlines -> space
    .trim();
}

function getPreferences() {
  return {
    voice: localStorage.getItem(TTS_VOICE_KEY) || '',
    rate: parseFloat(localStorage.getItem(TTS_RATE_KEY)) || 1.0,
    pitch: parseFloat(localStorage.getItem(TTS_PITCH_KEY)) || 1.0,
  };
}

export default function useTTS(text) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(() => {
    if (!isSupported || !text) return;

    // Stop anything currently playing
    window.speechSynthesis.cancel();

    const plainText = stripMarkdown(text);
    if (!plainText) return;

    const prefs = getPreferences();
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = prefs.rate;
    utterance.pitch = prefs.pitch;

    // Set voice if one is saved
    if (prefs.voice) {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.name === prefs.voice);
      if (match) utterance.voice = match;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [text]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speak, stop, isSpeaking, isSupported };
}

export { TTS_ENABLED_KEY, TTS_VOICE_KEY, TTS_RATE_KEY, TTS_PITCH_KEY };
