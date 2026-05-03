import React from 'react';

// Minimal mock — renders children as plain text. Tests don't need real
// markdown parsing; they just need the component to be inert.
export default function ReactMarkdown({ children }) {
  return <div data-testid="markdown">{children}</div>;
}
