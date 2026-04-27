import React from 'react';

export default function Card({ title, children, style = {}, actions }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 14, boxShadow: '0 1px 3px rgba(60,36,21,0.06), 0 1px 2px rgba(60,36,21,0.04)', padding: 24, border: '1px solid #E8DCC8', ...style }}>
      {(title || actions) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {title && <h2 style={{ fontSize: 18, fontWeight: 700, color: '#3C2415', letterSpacing: '-0.01em' }}>{title}</h2>}
          {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({ label, value, color = '#A0785A', icon }) {
  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 14, padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(60,36,21,0.06), 0 1px 2px rgba(60,36,21,0.04)',
      borderLeft: `4px solid ${color}`,
      border: '1px solid #E8DCC8',
      borderLeftColor: color,
      transition: 'all 0.2s ease',
    }}>
      <div style={{ fontSize: 13, color: '#A0785A', fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value ?? '—'}</div>
    </div>
  );
}
