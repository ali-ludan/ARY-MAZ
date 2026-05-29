'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { THEMES } from '../lib/themes';

const ThemeContext = createContext({
  theme: THEMES['midnight-navy'],
  themeId: 'midnight-navy',
  setTheme: () => {},
});

// Maps theme object keys to CSS custom property names
const CSS_VAR_MAP = {
  bg: '--bg', cardBg: '--card-bg', cardInputBg: '--card-input-bg',
  border: '--border', headerText: '--header-text', textPrimary: '--text-primary',
  textMuted: '--text-muted', accent: '--accent', accentLight: '--accent-light',
  accentText: '--accent-text', btnPrimary: '--btn-primary', btnPrimaryText: '--btn-primary-text',
  btnOutlineBorder: '--btn-outline-border', sliderThumb: '--slider-thumb', danger: '--danger',
  dangerLight: '--danger-light', tabActive: '--tab-active', tabActiveText: '--tab-active-text',
  statHighlight: '--stat-highlight', statHighlightText: '--stat-highlight-text', divider: '--divider',
};

function applyTheme(t) {
  const r = document.documentElement;
  Object.entries(CSS_VAR_MAP).forEach(([key, cssVar]) => {
    // Bug #15 fix: warn on missing values instead of silently setting 'undefined'
    if (!t[key]) {
      console.warn(`[ThemeContext] Theme is missing value for CSS var: ${cssVar} (key: ${key})`);
    }
    r.style.setProperty(cssVar, t[key] ?? '');
  });
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
