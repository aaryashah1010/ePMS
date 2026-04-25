import React, { useEffect, useState } from 'react';
import { cycleAPI } from '../services/api';

const PHASE_ORDER = {
  'GOAL_SETTING': 1,
  'MID_YEAR_REVIEW': 2,
  'ANNUAL_APPRAISAL': 3
};

export default function CycleSelector({ value, onChange, style = {}, minPhase }) {
  const [cycles, setCycles] = useState([]);

  useEffect(() => {
    cycleAPI.getAll().then((r) => {
      let list = r.data.cycles || [];
      if (minPhase) {
        list = list.filter((c) => PHASE_ORDER[c.phase] >= PHASE_ORDER[minPhase]);
      }
      setCycles(list);
    }).catch(() => {});
  }, [minPhase]);

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
