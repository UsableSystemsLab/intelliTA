import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  document.documentElement.style.fontSize = '';
});

describe('AccessibilitySettings', () => {
  test('renders the four font-size buttons', () => {
    const AccessibilitySettings = require('./AccessibilitySettings').default;
    render(<AccessibilitySettings />);
    expect(screen.getByText('sizeSmall')).toBeInTheDocument();
    expect(screen.getByText('sizeMedium')).toBeInTheDocument();
    expect(screen.getByText('sizeLarge')).toBeInTheDocument();
    expect(screen.getByText('sizeExtraLarge')).toBeInTheDocument();
  });

  test('clicking a font-size button writes to localStorage and applies CSS', async () => {
    const AccessibilitySettings = require('./AccessibilitySettings').default;
    const user = userEvent.setup();
    render(<AccessibilitySettings />);

    await user.click(screen.getByText('sizeLarge'));

    expect(localStorage.getItem('intelliTA-font-size')).toBe('lg');
    expect(document.documentElement.style.fontSize).toBe('18px');
  });

  test('renders both theme buttons (Dark + Light)', () => {
    const AccessibilitySettings = require('./AccessibilitySettings').default;
    render(<AccessibilitySettings />);
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  test('clicking Light theme adds light-theme class and saves to localStorage', async () => {
    const AccessibilitySettings = require('./AccessibilitySettings').default;
    const user = userEvent.setup();
    render(<AccessibilitySettings />);

    await user.click(screen.getByText('Light'));

    expect(localStorage.getItem('intelliTA-theme')).toBe('light');
    expect(document.documentElement.classList.contains('light-theme')).toBe(true);
  });

  test('clicking Dark after Light removes light-theme class', async () => {
    localStorage.setItem('intelliTA-theme', 'light');
    document.documentElement.classList.add('light-theme');
    const AccessibilitySettings = require('./AccessibilitySettings').default;
    const user = userEvent.setup();
    render(<AccessibilitySettings />);

    await user.click(screen.getByText('Dark'));

    expect(localStorage.getItem('intelliTA-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('light-theme')).toBe(false);
  });

  test('high-contrast toggle adds high-contrast class and persists', async () => {
    const AccessibilitySettings = require('./AccessibilitySettings').default;
    const user = userEvent.setup();
    render(<AccessibilitySettings />);

    expect(screen.getByText('highContrastMode')).toBeInTheDocument();

    // The toggle is the high contrast button — find by parent label
    const label = screen.getByText('highContrastMode');
    const section = label.closest('div').parentElement;
    const toggleBtn = section.querySelector('button[class*="rounded-full"]');
    await user.click(toggleBtn);

    expect(localStorage.getItem('intelliTA-high-contrast')).toBe('true');
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    expect(screen.getByText('enabled')).toBeInTheDocument();
  });

  test('reads previously saved font size from localStorage on mount', () => {
    localStorage.setItem('intelliTA-font-size', 'xl');
    const AccessibilitySettings = require('./AccessibilitySettings').default;
    render(<AccessibilitySettings />);

    // The active button shows the active dot (w-1.5 h-1.5)
    const xlBtn = screen.getByText('sizeExtraLarge').closest('button');
    expect(xlBtn).toHaveClass('text-blue-400');
  });

  test('TTS section is hidden when speechSynthesis is not available', () => {
    // jsdom does not provide window.speechSynthesis by default
    const AccessibilitySettings = require('./AccessibilitySettings').default;
    render(<AccessibilitySettings />);
    expect(screen.queryByText('Text-to-Speech')).not.toBeInTheDocument();
  });

  test('exports applySize, applyHighContrast, applyTheme helpers and key constants', () => {
    const mod = require('./AccessibilitySettings');
    expect(typeof mod.applySize).toBe('function');
    expect(typeof mod.applyHighContrast).toBe('function');
    expect(typeof mod.applyTheme).toBe('function');
    expect(mod.FONT_SIZE_KEY).toBe('intelliTA-font-size');
    expect(mod.HIGH_CONTRAST_KEY).toBe('intelliTA-high-contrast');
    expect(mod.THEME_KEY).toBe('intelliTA-theme');
  });

  test('applySize writes to documentElement and localStorage directly', () => {
    const { applySize } = require('./AccessibilitySettings');
    applySize('sm');
    expect(document.documentElement.style.fontSize).toBe('14px');
    expect(localStorage.getItem('intelliTA-font-size')).toBe('sm');
  });

  test('applyHighContrast(false) removes the class', () => {
    document.documentElement.classList.add('high-contrast');
    const { applyHighContrast } = require('./AccessibilitySettings');
    applyHighContrast(false);
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
    expect(localStorage.getItem('intelliTA-high-contrast')).toBe('false');
  });
});
