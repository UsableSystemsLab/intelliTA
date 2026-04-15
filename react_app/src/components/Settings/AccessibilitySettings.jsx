import React, { useState } from 'react';
import { ALargeSmall, Contrast, Sun, Moon } from 'lucide-react';

const FONT_SIZE_KEY = 'intelliTA-font-size';
const HIGH_CONTRAST_KEY = 'intelliTA-high-contrast';
const THEME_KEY = 'intelliTA-theme';

const sizes = [
  { id: 'sm',  label: 'Small',       px: 14, preview: 'text-xs' },
  { id: 'md',  label: 'Medium',      px: 16, preview: 'text-sm' },
  { id: 'lg',  label: 'Large',       px: 18, preview: 'text-base' },
  { id: 'xl',  label: 'Extra Large', px: 20, preview: 'text-lg' },
];

function getSavedSize() {
  return localStorage.getItem(FONT_SIZE_KEY) || 'md';
}

function applySize(id) {
  const size = sizes.find(s => s.id === id) || sizes[1];
  document.documentElement.style.fontSize = `${size.px}px`;
  localStorage.setItem(FONT_SIZE_KEY, id);
}

function getHighContrast() {
  return localStorage.getItem(HIGH_CONTRAST_KEY) === 'true';
}

function applyHighContrast(enabled) {
  if (enabled) {
    document.documentElement.classList.add('high-contrast');
  } else {
    document.documentElement.classList.remove('high-contrast');
  }
  localStorage.setItem(HIGH_CONTRAST_KEY, String(enabled));
}

function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.classList.add('light-theme');
  } else {
    document.documentElement.classList.remove('light-theme');
  }
  localStorage.setItem(THEME_KEY, theme);
}

const AccessibilitySettings = () => {
  const [selected, setSelected] = useState(getSavedSize);
  const [highContrast, setHighContrast] = useState(getHighContrast);
  const [theme, setTheme] = useState(getTheme);

  const handleSelect = (id) => {
    setSelected(id);
    applySize(id);
  };

  const handleThemeSelect = (t) => {
    setTheme(t);
    applyTheme(t);
  };

  const handleContrastToggle = () => {
    const next = !highContrast;
    setHighContrast(next);
    applyHighContrast(next);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Theme Toggle */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
          {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          Theme
        </label>
        <p className="text-xs text-gray-500">
          Switch between light and dark appearance.
        </p>

        <div className="grid grid-cols-2 gap-3 max-w-xs">
          {[
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'light', label: 'Light', icon: Sun },
          ].map(({ id, label, icon: Icon }) => {
            const isActive = theme === id;
            return (
              <button
                key={id}
                onClick={() => handleThemeSelect(id)}
                className={`flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border transition-all duration-200
                  ${isActive
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-900/20'
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200 hover:border-gray-600'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* High Contrast Toggle */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <Contrast className="w-4 h-4" />
          High Contrast Mode
        </label>
        <p className="text-xs text-gray-500">
          Increases color contrast across the interface for better visibility.
        </p>

        <button
          onClick={handleContrastToggle}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200
            ${highContrast
              ? 'bg-blue-600'
              : 'bg-gray-600'
            }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white transition-transform duration-200
              ${highContrast ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>

        {highContrast && (
          <div className="mt-2 p-3 rounded-xl bg-gray-800/30 border border-gray-700/50">
            <p className="text-gray-300 text-sm">
              High contrast mode is <span className="font-semibold text-blue-400">enabled</span>. Colors have been adjusted for better readability.
            </p>
          </div>
        )}
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <ALargeSmall className="w-4 h-4" />
          Font Size
        </label>
        <p className="text-xs text-gray-500">
          Adjusts the base text size across the entire application.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {sizes.map((size) => {
          const isActive = selected === size.id;
          return (
            <button
              key={size.id}
              onClick={() => handleSelect(size.id)}
              className={`flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border transition-all duration-200
                ${isActive
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-900/20'
                  : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200 hover:border-gray-600'
                }`}
            >
              <span
                className="font-semibold leading-none text-current"
                style={{ fontSize: `${size.px}px` }}
              >
                Aa
              </span>
              <span className="text-xs font-medium">{size.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
        <p className="text-gray-300 text-sm font-medium mb-1">Preview</p>
        <p className="text-gray-400">
          This is how body text will look across the site. Headings and labels scale with it.
        </p>
      </div>
    </div>
  );
};

export { applySize, FONT_SIZE_KEY, applyHighContrast, HIGH_CONTRAST_KEY, applyTheme, THEME_KEY };
export default AccessibilitySettings;
