import { useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('dr_theme', next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  }

  return (
    <button className="icon-btn" onClick={toggle} title="Toggle theme" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}