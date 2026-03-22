import React from 'react';

const VARIANTS = {
  primary:   { background: '#2563eb', color: '#fff', border: 'none' },
  success:   { background: '#16a34a', color: '#fff', border: 'none' },
  danger:    { background: '#dc2626', color: '#fff', border: 'none' },
  warning:   { background: '#d97706', color: '#fff', border: 'none' },
  secondary: { background: '#64748b', color: '#fff', border: 'none' },
  outline:   { background: 'transparent', color: '#2563eb', border: '1.5px solid #2563eb' },
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
        borderRadius: 8,
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'opacity 0.2s',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        ...style,
      }}
    >
      {loading && (
        <span style={{
          width: 14, height: 14,
          border: '2px solid rgba(255,255,255,0.4)',
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
