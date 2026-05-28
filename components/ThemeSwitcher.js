'use client';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { THEMES, THEME_ORDER } from '../lib/themes';

export default function ThemeSwitcher() {
  const { themeId, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999 }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(p => !p)}
        title="Change theme"
        style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--border)', color: 'var(--header-text)',
          border: '1.5px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          transition: 'transform 0.15s', fontSize: '1rem',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        🎨
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9997 }}
        />
      )}

      {/* Panel */}
      {open && (
        <div style={{
          position: 'absolute', top: '3rem', right: 0, zIndex: 9998,
          width: 270, padding: '1rem',
          borderRadius: '1.25rem',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
          animation: 'fadeUp 0.2s ease',
        }}>
          {/* Header */}
          <div style={{
            background: 'var(--border)', borderRadius: '0.75rem',
            padding: '0.5rem 1rem', marginBottom: '0.75rem',
          }}>
            <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, color: 'var(--accent)' }}>
              Choose Theme
            </div>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {THEME_ORDER.map(id => {
              const t = THEMES[id];
              const isActive = themeId === id;
              return (
                <button
                  key={id}
                  onClick={() => { setTheme(id); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    width: '100%', borderRadius: '0.9rem', padding: '0.6rem 0.75rem',
                    textAlign: 'left', cursor: 'pointer',
                    background: isActive ? `${t.accent}22` : 'transparent',
                    border: `1.5px solid ${isActive ? t.accent : t.border}`,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--card-input-bg)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Split swatch */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    border: `2px solid ${t.accent}`, display: 'flex',
                  }}>
                    <div style={{ width: '50%', height: '100%', background: t.swatch }} />
                    <div style={{ width: '50%', height: '100%', background: t.swatchSecondary }} />
                  </div>
                  {/* Labels */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isActive ? t.accent : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
                      {t.description}
                    </div>
                  </div>
                  {/* Checkmark */}
                  {isActive && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth="3" style={{ flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '0.55rem', textAlign: 'center', marginTop: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Saved automatically
          </div>
        </div>
      )}
    </div>
  );
}
