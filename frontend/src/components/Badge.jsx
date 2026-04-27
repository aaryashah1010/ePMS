import React from 'react';

const STATUS_COLORS = {
  DRAFT:          { bg: '#F5F0E8', color: '#6F4E37' },
  SUBMITTED:      { bg: '#E8DCC8', color: '#3C2415' },
  REPORTING_DONE: { bg: '#FFF3E0', color: '#B8860B' },
  REVIEWING_DONE: { bg: '#F3EDE4', color: '#6F4E37' },
  ACCEPTING_DONE: { bg: '#E8F0E8', color: '#4A7C59' },
  FINALIZED:      { bg: '#E0EDE0', color: '#3D6B3D' },
  ACTIVE:         { bg: '#E8DDD0', color: '#3C2415' },
  CLOSED:         { bg: '#F0E0E0', color: '#8B3A3A' },
  Poor:           { bg: '#F0E0E0', color: '#8B3A3A' },
  'Below Average':{ bg: '#FFF3E0', color: '#B8860B' },
  Average:        { bg: '#E0ECF0', color: '#5B7B9A' },
  Good:           { bg: '#E0EDE0', color: '#4A7C59' },
  Outstanding:    { bg: '#F5EDE0', color: '#8B6914' },
  GOAL_SETTING:   { bg: '#F5F0E8', color: '#6F4E37' },
  MID_YEAR_REVIEW:{ bg: '#FFF3E0', color: '#B8860B' },
  ANNUAL_APPRAISAL:{ bg: '#E8F0E8', color: '#4A7C59' },
  REJECTED:       { bg: '#F0E0E0', color: '#8B3A3A' },
  ACCEPTED:       { bg: '#E0EDE0', color: '#4A7C59' },
};

export default function Badge({ label }) {
  const style = STATUS_COLORS[label] || { bg: '#F5F0E8', color: '#6F4E37' };
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
