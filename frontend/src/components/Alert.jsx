import React from 'react';

const TYPES = {
  error:   { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', icon: '✕' },
  success: { bg: '#f0fdf4', border: '#86efac', color: '#166534', icon: '✓' },
  info:    { bg: '#eff6ff', border: '#93c5fd', color: '#1e40af', icon: 'ℹ' },
  warning: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', icon: '⚠' },
};

export default function Alert({ type = 'info', message }) {
  if (!message) return null;
  const s = TYPES[type];
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: 8, padding: '12px 16px', marginBottom: 16,
      display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14,
    }}>
      <span style={{ fontWeight: 700, flexShrink: 0 }}>{s.icon}</span>
      <span>{message}</span>
    </div>
  );
}
