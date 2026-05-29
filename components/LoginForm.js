'use client';
import { useState } from 'react';

export default function LoginForm({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Invalid credentials. Please try again.');
      }

      const data = await res.json();
      onLoginSuccess(data.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1a2333 0%, #0d1117 100%)',
      padding: '1.5rem',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        background: 'rgba(22, 27, 38, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(201, 168, 76, 0.15)',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        animation: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Gold Top Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #c9a84c 0%, #e8c47a 100%)'
        }} />

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.2rem' }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.5px',
            marginBottom: '0.4rem'
          }}>
            ARY &amp; <span style={{ color: '#c9a84c' }}>MAZ</span>
          </div>
          <div style={{
            fontSize: '0.62rem',
            color: '#c9a84c',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            fontWeight: 700
          }}>
            Developments · Dubai
          </div>
          <div style={{
            fontSize: '0.78rem',
            color: '#8892a4',
            marginTop: '0.8rem'
          }}>
            Smart Calculator Engine Gate
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '0.75rem',
            padding: '0.85rem 1rem',
            color: '#ef4444',
            fontSize: '0.78rem',
            marginBottom: '1.5rem',
            lineHeight: '1.4',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor="username" style={{
              display: 'block',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#8892a4',
              marginBottom: '0.5rem'
            }}>
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              style={{
                width: '100%',
                background: '#1e2638',
                border: '1.5px solid rgba(201, 168, 76, 0.1)',
                borderRadius: '0.8rem',
                padding: '0.8rem 1rem',
                fontSize: '0.85rem',
                color: '#ffffff',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#c9a84c';
                e.target.style.boxShadow = '0 0 0 3px rgba(201, 168, 76, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(201, 168, 76, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#8892a4',
              marginBottom: '0.5rem'
            }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                background: '#1e2638',
                border: '1.5px solid rgba(201, 168, 76, 0.1)',
                borderRadius: '0.8rem',
                padding: '0.8rem 1rem',
                fontSize: '0.85rem',
                color: '#ffffff',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#c9a84c';
                e.target.style.boxShadow = '0 0 0 3px rgba(201, 168, 76, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(201, 168, 76, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #c9a84c 0%, #e8c47a 100%)',
              color: '#0d1117',
              border: 'none',
              borderRadius: '0.8rem',
              padding: '0.85rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(201, 168, 76, 0.2)',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 16px rgba(201, 168, 76, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'none';
              e.target.style.boxShadow = '0 4px 12px rgba(201, 168, 76, 0.2)';
            }}
          >
            {loading ? (
              <span className="loading-spinner" style={{ width: '16px', height: '16px', margin: 0 }} />
            ) : (
              'Enter Calculator'
            )}
          </button>
        </form>

        {/* Demo Accounts Panel */}
        <div style={{
          marginTop: '2.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(201, 168, 76, 0.08)',
          fontSize: '0.72rem',
          color: '#8892a4',
          lineHeight: '1.6'
        }}>
          <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Authorized Demo Access
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span>🔑 <strong>Admin:</strong> admin</span>
            <span style={{ color: '#c9a84c' }}>admin@barari</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>🔑 <strong>Agent (User):</strong> agent</span>
            <span style={{ color: '#c9a84c' }}>agent@barari</span>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
