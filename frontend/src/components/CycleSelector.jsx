import React, { useEffect, useState } from 'react';
import { cycleAPI } from '../services/api';

const PHASE_ORDER = {
  'GOAL_SETTING': 1,
  'MID_YEAR_REVIEW': 2,
  'ANNUAL_APPRAISAL': 3
};

// onCycleChange(cycleId, cycleObject) — passes full cycle so pages can detect phase
export default function CycleSelector({ value, onChange, onCycleChange, style = {}, minPhase, exactPhase }) {
  const [cycles, setCycles] = useState([]);

  useEffect(() => {
    cycleAPI.getAll().then((r) => {
      let list = r.data.cycles || [];
      if (minPhase) {
        list = list.filter((c) => PHASE_ORDER[c.phase] >= PHASE_ORDER[minPhase]);
      }
      if (exactPhase) {
        list = list.filter((c) => c.phase === exactPhase);
      }
      setCycles(list);
    }).catch(() => {});
  }, [minPhase, exactPhase]);

  const handleChange = (e) => {
    const id = e.target.value;
    onChange(id);
    if (onCycleChange) {
      const cycle = cycles.find((c) => c.id === id) || null;
      onCycleChange(id, cycle);
    }
  };

  return (
    <select
      value={value || ''}
      onChange={handleChange}
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
