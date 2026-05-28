'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { THEMES } from '../lib/themes';

const ThemeContext = createContext({
  theme: THEMES['midnight-navy'],
  themeId: 'midnight-navy',
  setTheme: () => {},
});

function applyTheme(t) {
  const r = document.documentElement;
  r.style.setProperty('--bg', t.bg);
  r.style.setProperty('--card-bg', t.cardBg);
  r.style.setProperty('--card-input-bg', t.cardInputBg);
  r.style.setProperty('--border', t.border);
  r.style.setProperty('--header-text', t.headerText);
  r.style.setProperty('--text-primary', t.textPrimary);
  r.style.setProperty('--text-muted', t.textMuted);
  r.style.setProperty('--accent', t.accent);
  r.style.setProperty('--accent-light', t.accentLight);
  r.style.setProperty('--accent-text', t.accentText);
  r.style.setProperty('--btn-primary', t.btnPrimary);
  r.style.setProperty('--btn-primary-text', t.btnPrimaryText);
  r.style.setProperty('--btn-outline-border', t.btnOutlineBorder);
  r.style.setProperty('--slider-thumb', t.sliderThumb);
  r.style.setProperty('--danger', t.danger);
  r.style.setProperty('--danger-light', t.dangerLight);
  r.style.setProperty('--tab-active', t.tabActive);
  r.style.setProperty('--tab-active-text', t.tabActiveText);
  r.style.setProperty('--stat-highlight', t.statHighlight);
  r.style.setProperty('--stat-highlight-text', t.statHighlightText);
  r.style.setProperty('--divider', t.divider);
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState('midnight-navy');

  useEffect(() => {
    const saved = localStorage.getItem('ary-maz-theme');
    if (saved && THEMES[saved]) {
      setThemeId(saved);
      applyTheme(THEMES[saved]);
    } else {
      applyTheme(THEMES['midnight-navy']);
    }
  }, []);

  const setTheme = (id) => {
    if (!THEMES[id]) return;
    setThemeId(id);
    localStorage.setItem('ary-maz-theme', id);
    applyTheme(THEMES[id]);
  };

  return (
    <ThemeContext.Provider value={{ theme: THEMES[themeId], themeId, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
