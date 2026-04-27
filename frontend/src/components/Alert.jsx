import React from 'react';

const TYPES = {
  error:   { bg: '#FDF0F0', border: '#D4A0A0', color: '#8B3A3A', icon: '✕' },
  success: { bg: '#EFF5F0', border: '#A0C4A8', color: '#4A7C59', icon: '✓' },
  info:    { bg: '#EEF2F5', border: '#A8BFD0', color: '#5B7B9A', icon: 'ℹ' },
  warning: { bg: '#FDF8EE', border: '#D4C090', color: '#B8860B', icon: '⚠' },
};

export default function Alert({ type = 'info', message }) {
  if (!message) return null;
  const s = TYPES[type];
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: 10, padding: '12px 16px', marginBottom: 16,
      display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14,
    }}>
      <span style={{ fontWeight: 700, flexShrink: 0 }}>{s.icon}</span>
      <span>{message}</span>
    </div>
  );
}
