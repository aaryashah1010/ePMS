import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import { ceoAPI } from '../../services/api';

export default function CEODashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState('');

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async (cycleId) => {
    setLoading(true);
    try {
      const res = await ceoAPI.getDashboard(cycleId || undefined);
      setData(res.data);
      if (!selectedCycle && res.data.cycle) setSelectedCycle(res.data.cycle.id);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally { setLoading(false); }
  };

  const handleCycleChange = (e) => {
    setSelectedCycle(e.target.value);
    loadDashboard(e.target.value);
  };

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={spinnerStyle} />
          <p style={{ color: '#6F4E37', marginTop: 12 }}>Loading dashboard...</p>
        </div>
      </div>
    </Layout>
  );

  if (!data || !data.cycle) return (
    <Layout>
      <div style={headerBox}>
        <h1 style={titleStyle}>Organisation Performance Dashboard</h1>
        <p style={subtitleStyle}>No active cycle found. Ask HR to create one.</p>
      </div>
    </Layout>
  );

  const { cycle, allCycles, totalEmployees, cycleStatus, performanceSummary, departmentPerformance, alerts, topPerformers, bottomPerformers, yearOnYear } = data;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Layout>
      {/* Header */}
      <div style={headerBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={titleStyle}>Organisation Performance Dashboard</h1>
            <p style={subtitleStyle}>{cycle.name} &middot; Year {cycle.year} &middot; As on {dateStr}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select style={selectStyle} value={selectedCycle} onChange={handleCycleChange}>
              {allCycles?.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.year}) — {c.status}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Summary stats */}
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Employees', value: totalEmployees, color: '#FDF8EE' },
            { label: 'Cycle Phase', value: cycle.phase?.replace(/_/g, ' '), color: '#D4C090' },
            { label: 'Overall Completion', value: `${cycleStatus?.overallCompletion || 0}%`, color: '#F5F0E8' },
            { label: 'Finalized', value: performanceSummary?.total || 0, color: '#C4A882' },
          ].map((s, i) => (
            <div key={i} style={summaryCardStyle}>
              <div style={{ fontSize: 11, color: '#F5F0E8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.8 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 1: Cycle Status */}
      <Card title="Section 1 — Cycle Status" style={{ marginBottom: 20 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={thRowStyle}>
                {['Stage', 'Total', 'Completed', 'Pending', 'Progress'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {cycleStatus?.stages?.map((s, i) => {
                const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
                return (
                  <tr key={i} style={trStyle}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{s.stage}</td>
                    <td style={tdStyle}>{s.total}</td>
                    <td style={{ ...tdStyle, color: '#4A7C59', fontWeight: 600 }}>{s.completed}</td>
                    <td style={{ ...tdStyle, color: s.pending > 0 ? '#8B3A3A' : '#4A7C59', fontWeight: 600 }}>{s.pending}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={progressBarBg}>
                          <div style={{ ...progressBarFill, width: `${pct}%`, background: pct === 100 ? '#4A7C59' : pct > 50 ? '#6F4E37' : '#B8860B' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, minWidth: 36 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, padding: '12px 16px', background: '#FAF8F4', border: '1px solid #E8DCC8', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#3C2415' }}>
            Overall Cycle Completion: {cycleStatus?.overallCompletion || 0}%
          </span>
          <div style={{ ...progressBarBg, width: 200, height: 10 }}>
            <div style={{ ...progressBarFill, width: `${cycleStatus?.overallCompletion || 0}%`, background: '#3C2415' }} />
          </div>
        </div>
      </Card>

      {/* SECTION 2: Performance Summary */}
      <Card title="Section 2 — Organisation Performance Summary" style={{ marginBottom: 20 }}>
        {performanceSummary?.total === 0 ? (
          <p style={{ color: '#A0785A', fontSize: 14 }}>No finalized appraisals yet for this cycle.</p>
        ) : (
          <>
            <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
              {performanceSummary?.distribution?.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ minWidth: 180, fontSize: 13, fontWeight: 600, color: '#3C2415' }}>
                    {d.band} <span style={{ color: '#A0785A', fontWeight: 400 }}>({d.grade})</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={progressBarBg}>
                      <div style={{ ...progressBarFill, width: `${d.percentage}%`, background: d.color, minWidth: d.percentage > 0 ? 4 : 0 }} />
                    </div>
                  </div>
                  <div style={{ minWidth: 50, fontSize: 13, fontWeight: 800, textAlign: 'right', color: '#3C2415' }}>{d.percentage}%</div>
                  <div style={{ minWidth: 30, fontSize: 12, color: '#6F4E37', textAlign: 'right' }}>({d.count})</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 14px', background: performanceSummary?.bellCurveOk ? '#FAF8F4' : '#FDF0F0', border: `1px solid ${performanceSummary?.bellCurveOk ? '#E8DCC8' : '#D4A0A0'}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: performanceSummary?.bellCurveOk ? '#3C2415' : '#8B3A3A' }}>
              Bell Curve Status: {performanceSummary?.bellCurveOk ? '✅ Normal Distribution' : '⚠️ Distribution Skewed'}
            </div>
          </>
        )}
      </Card>

      {/* SECTION 3: Department Performance */}
      <Card title="Section 3 — Department Wise Performance" style={{ marginBottom: 20 }}>
        {departmentPerformance?.length === 0 ? (
          <p style={{ color: '#A0785A', fontSize: 14 }}>No department data available.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr style={thRowStyle}>
                  {['Department', 'Avg Score', 'Top Scorer', 'Bottom Scorer', 'Pending'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {departmentPerformance?.map((d, i) => (
                  <tr key={i} style={trStyle}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#3C2415' }}>{d.department}</td>
                    <td style={tdStyle}>
                      {d.avgScore != null ? (
                        <span style={{ fontWeight: 800, color: '#3C2415' }}>{d.avgScore} <span style={{ fontSize: 11, color: '#A0785A', fontWeight: 600 }}>/ 5</span></span>
                      ) : '—'}
                    </td>
                    <td style={{ ...tdStyle, color: '#4A7C59', fontWeight: 500 }}>{d.topScorer}</td>
                    <td style={{ ...tdStyle, color: '#8B3A3A', fontWeight: 500 }}>{d.bottomScorer}</td>
                    <td style={tdStyle}>
                      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: d.pending > 0 ? '#FDF0F0' : '#FAF8F4', color: d.pending > 0 ? '#8B3A3A' : '#4A7C59', border: `1px solid ${d.pending > 0 ? '#D4A0A0' : '#E8DCC8'}` }}>
                        {d.pending}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* SECTION 4: Key Alerts */}
      <Card title="Section 4 — Key Alerts ⚠️" style={{ marginBottom: 20 }}>
        {alerts?.length === 0 ? (
          <p style={{ color: '#4A7C59', fontSize: 14, fontWeight: 600 }}>✅ No alerts — everything looks good!</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {alerts?.map((a, i) => (
              <div key={i} style={{
                padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: a.level === 'red' ? '#FDF0F0' : a.level === 'yellow' ? '#FDF8EE' : '#FAF8F4',
                color: a.level === 'red' ? '#8B3A3A' : a.level === 'yellow' ? '#B8860B' : '#4A7C59',
                borderLeft: `4px solid ${a.level === 'red' ? '#8B3A3A' : a.level === 'yellow' ? '#B8860B' : '#4A7C59'}`,
                borderTop: '1px solid rgba(0,0,0,0.05)',
                borderRight: '1px solid rgba(0,0,0,0.05)',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
              }}>
                {a.icon} {a.text}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* SECTION 6: Top & Bottom Performers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>
        <Card title="Top Performers 🏆">
          {topPerformers?.length === 0 ? (
            <p style={{ color: '#A0785A', fontSize: 13 }}>No finalized scores yet.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr style={thRowStyle}>
                  {['#', 'Name', 'Score', 'Department'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {topPerformers?.map((p, i) => (
                  <tr key={i} style={trStyle}>
                    <td style={{ ...tdStyle, fontWeight: 800, color: '#B8860B' }}>{i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#3C2415' }}>{p.name}</td>
                    <td style={tdStyle}><span style={{ fontWeight: 800, color: '#3C2415' }}>{p.score}</span> <span style={{ fontSize: 11, color: '#A0785A', fontWeight: 600 }}>/ 5</span></td>
                    <td style={tdStyle}>{p.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Needs Attention ⚡">
          {bottomPerformers?.length === 0 ? (
            <p style={{ color: '#A0785A', fontSize: 13 }}>No finalized scores yet.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr style={thRowStyle}>
                  {['#', 'Name', 'Score', 'Department'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {bottomPerformers?.map((p, i) => (
                  <tr key={i} style={trStyle}>
                    <td style={{ ...tdStyle, fontWeight: 800, color: '#8B3A3A' }}>{i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#3C2415' }}>{p.name}</td>
                    <td style={tdStyle}><span style={{ fontWeight: 800, color: '#8B3A3A' }}>{p.score}</span> <span style={{ fontSize: 11, color: '#A0785A', fontWeight: 600 }}>/ 5</span></td>
                    <td style={tdStyle}>{p.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* SECTION 7: Year on Year */}
      <Card title="Section 7 — Year on Year Comparison" style={{ marginBottom: 20 }}>
        {yearOnYear?.length === 0 ? (
          <p style={{ color: '#A0785A', fontSize: 14 }}>No historical data available.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr style={thRowStyle}>
                  <th style={thStyle}>Metric</th>
                  {yearOnYear?.map((y, i) => <th key={i} style={thStyle}>{y.cycleName} ({y.year})</th>)}
                  <th style={thStyle}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {/* Avg Score row */}
                <tr style={trStyle}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#3C2415' }}>Avg Score (/ 5)</td>
                  {yearOnYear?.map((y, i) => (
                    <td key={i} style={tdStyle}>{y.avgScore ?? '—'}</td>
                  ))}
                  <td style={tdStyle}>{getTrend(yearOnYear.map(y => y.avgScore))}</td>
                </tr>
                {/* Outstanding % */}
                <tr style={trStyle}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#3C2415' }}>Outstanding %</td>
                  {yearOnYear?.map((y, i) => (
                    <td key={i} style={tdStyle}>{y.outstandingPct != null ? `${y.outstandingPct}%` : '—'}</td>
                  ))}
                  <td style={tdStyle}>{getTrend(yearOnYear.map(y => y.outstandingPct))}</td>
                </tr>
                {/* Completion % */}
                <tr style={trStyle}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#3C2415' }}>Completion %</td>
                  {yearOnYear?.map((y, i) => (
                    <td key={i} style={tdStyle}>{y.completionPct != null ? `${y.completionPct}%` : '—'}</td>
                  ))}
                  <td style={tdStyle}>{getTrend(yearOnYear.map(y => y.completionPct))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Layout>
  );
}

function getTrend(values) {
  const valid = values.filter(v => v != null);
  if (valid.length < 2) return <span style={{ color: '#A0785A' }}>—</span>;
  // Compare last two (most recent vs previous) — yearOnYear is desc order so index 0 is newest
  const latest = valid[0];
  const previous = valid[1];
  if (latest > previous) return <span style={{ color: '#4A7C59', fontWeight: 800 }}>↑ Improving</span>;
  if (latest < previous) return <span style={{ color: '#8B3A3A', fontWeight: 800 }}>↓ Declining</span>;
  return <span style={{ color: '#B8860B', fontWeight: 700 }}>→ Stable</span>;
}

// Styles
const spinnerStyle = { width: 40, height: 40, border: '4px solid #E8DCC8', borderTop: '4px solid #3C2415', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' };
const headerBox = { marginBottom: 24, background: 'linear-gradient(135deg, #3C2415 0%, #6F4E37 100%)', borderRadius: 16, padding: '28px 32px', color: '#fff', boxShadow: '0 10px 25px rgba(60,36,21,0.15)' };
const titleStyle = { fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.01em' };
const subtitleStyle = { fontSize: 14, color: '#E8DCC8' };
const selectStyle = { padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" };
const summaryCardStyle = { flex: 1, minWidth: 140, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(255,255,255,0.15)' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thRowStyle = { background: '#FAF8F4' };
const thStyle = { padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#3C2415', borderBottom: '2px solid #E8DCC8' };
const trStyle = { borderBottom: '1px solid #F5F0E8' };
const tdStyle = { padding: '12px', fontSize: 13, color: '#6F4E37' };
const progressBarBg = { flex: 1, height: 8, background: '#E8DCC8', borderRadius: 4, overflow: 'hidden' };
const progressBarFill = { height: '100%', borderRadius: 4, transition: 'width 0.5s ease' };
