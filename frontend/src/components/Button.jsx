import React from 'react';

const VARIANTS = {
  primary:   { background: '#3C2415', color: '#fff', border: 'none' },
  success:   { background: '#4A7C59', color: '#fff', border: 'none' },
  danger:    { background: '#8B3A3A', color: '#fff', border: 'none' },
  warning:   { background: '#B8860B', color: '#fff', border: 'none' },
  secondary: { background: '#E8DCC8', color: '#3C2415', border: 'none' },
  outline:   { background: 'transparent', color: '#3C2415', border: '1.5px solid #3C2415' },
};

export default function Button({ children, variant = 'primary', disabled, loading, onClick, style = {}, type = 'button', size = 'md' }) {
  const sz = size === 'sm' ? { padding: '6px 14px', fontSize: 13 } : { padding: '10px 20px', fontSize: 14 };
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...VARIANTS[variant],
        ...sz,
        borderRadius: 10,
        fontWeight: 600,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        letterSpacing: '0.01em',
        ...style,
      }}
    >
      {loading && (
        <span style={{
          width: 14, height: 14,
          border: '2px solid rgba(255,255,255,0.3)',
          borderTop: '2px solid #fff',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          display: 'inline-block',
        }} />
      )}
      {children}
    </button>
  );
}
