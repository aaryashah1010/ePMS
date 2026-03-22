import React from 'react';

const STATUS_COLORS = {
  DRAFT:          { bg: '#f1f5f9', color: '#475569' },
  SUBMITTED:      { bg: '#dbeafe', color: '#1d4ed8' },
  REPORTING_DONE: { bg: '#fef3c7', color: '#92400e' },
  REVIEWING_DONE: { bg: '#ede9fe', color: '#5b21b6' },
  ACCEPTING_DONE: { bg: '#d1fae5', color: '#065f46' },
  FINALIZED:      { bg: '#dcfce7', color: '#15803d' },
  ACTIVE:         { bg: '#dbeafe', color: '#1d4ed8' },
  CLOSED:         { bg: '#fee2e2', color: '#991b1b' },
  Poor:           { bg: '#fee2e2', color: '#991b1b' },
  'Below Average':{ bg: '#fef3c7', color: '#92400e' },
  Average:        { bg: '#e0f2fe', color: '#0369a1' },
  Good:           { bg: '#d1fae5', color: '#065f46' },
  Outstanding:    { bg: '#fce7f3', color: '#9d174d' },
};

export default function Badge({ label }) {
  const style = STATUS_COLORS[label] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{
      background: style.bg, color: style.color,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {label?.replace(/_/g, ' ')}
    </span>
  );
}
