import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VideoSection from './VideoSection';

function renderUI(overrides = {}) {
  const props = {
    activity: { video_url: 'https://example.com/x.mp4', title: 'Lesson' },
    videoRef: { current: null },
    isPlaying: false,
    currentTime: 0,
    duration: 120,
    checkpoints: [],
    activeCheckpoint: null,
    chapters: [],
    onTimeUpdate: jest.fn(),
    onDurationChange: jest.fn(),
    onPlay: jest.fn(),
    onPause: jest.fn(),
    onSeek: jest.fn(),
    onNext: jest.fn(),
    onPrev: jest.fn(),
    onRetryCheckpoint: jest.fn(),
    CheckpointOverlay: () => null,
    captionSegments: [],
    hasArabicCaptions: false,
    captionsEnabled: false,
    onToggleCaptions: jest.fn(),
    captionLang: 'en',
    onToggleCaptionLang: jest.fn(),
    ...overrides,
  };
  return { props, ...render(<VideoSection {...props} />) };
}

describe('VideoSection', () => {
  test('renders an HTML <video> element for non-youtube urls', () => {
    const { container } = renderUI();
    expect(container.querySelector('video')).toBeInTheDocument();
    expect(container.querySelector('iframe')).not.toBeInTheDocument();
  });

  test('renders an embed iframe for YouTube urls', () => {
    const { container } = renderUI({
      activity: { video_url: 'https://www.youtube.com/watch?v=abc123' },
    });
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe.getAttribute('src')).toMatch(/youtube\.com\/embed\/abc123/);
  });

  test('shows a large play overlay when paused and triggers onPlay', () => {
    const { props } = renderUI({ isPlaying: false });
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(props.onPlay).toHaveBeenCalled();
  });

  test('seek-to-start button calls onSeek(0)', () => {
    const { props, container } = renderUI();
    const restartBtn = container.querySelector('button[title*="restart" i], button[aria-label*="restart" i]')
      || Array.from(container.querySelectorAll('button')).find((b) => b.querySelector('svg.lucide-rotate-ccw'));
    fireEvent.click(restartBtn);
    expect(props.onSeek).toHaveBeenCalledWith(0);
  });

  test('caption toggle button calls onToggleCaptions', () => {
    const { props, container } = renderUI({ captionSegments: [{ start: 0, end: 1, text: 'a' }] });
    const ccBtn = container.querySelector('button[title^="Captions"]');
    expect(ccBtn).toBeTruthy();
    fireEvent.click(ccBtn);
    expect(props.onToggleCaptions).toHaveBeenCalled();
  });

  test('does not render YouTube iframe for direct video activity', () => {
    const { container } = renderUI();
    expect(container.querySelector('iframe[title="Activity Video"]')).not.toBeInTheDocument();
  });
});
