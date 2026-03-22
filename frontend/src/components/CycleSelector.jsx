import React, { useEffect, useState } from 'react';
import { cycleAPI } from '../services/api';

export default function CycleSelector({ value, onChange, style = {} }) {
  const [cycles, setCycles] = useState([]);

  useEffect(() => {
    cycleAPI.getAll().then((r) => setCycles(r.data.cycles || [])).catch(() => {});
  }, []);

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 14, ...style }}
    >
      <option value="">-- Select Cycle --</option>
      {cycles.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} ({c.phase?.replace(/_/g, ' ')} · {c.status})
        </option>
      ))}
    </select>
  );
}
