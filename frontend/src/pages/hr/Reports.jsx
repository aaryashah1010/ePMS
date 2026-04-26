import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import CycleSelector from '../../components/CycleSelector';
import { reportAPI, userAPI } from '../../services/api';

export default function Reports() {
  const [cycleId, setCycleId] = useState('');
  const [activeTab, setActiveTab] = useState('department');
  const [deptSummary, setDeptSummary] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [progress, setProgress] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [individualReport, setIndividualReport] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    userAPI.getAll().then((r) => setUsers(r.data.users || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cycleId) return;
    setMsg({ type: '', text: '' });
    setLoading(true);
    Promise.allSettled([
      reportAPI.department(cycleId),
      reportAPI.distribution(cycleId),
      reportAPI.progress(cycleId),
    ]).then(([d, dist, p]) => {
      if (d.status === 'fulfilled') setDeptSummary(d.value.data.summary || []);
      if (dist.status === 'fulfilled') setDistribution(dist.value.data.distribution);
      if (p.status === 'fulfilled') setProgress(p.value.data.progress);
    }).finally(() => setLoading(false));
  }, [cycleId]);

  const fetchIndividual = async () => {
    if (!selectedUserId || !cycleId) return;
    try {
      const r = await reportAPI.individual(cycleId, selectedUserId);
      setIndividualReport(r.data.report);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to fetch report' });
    }
  };

  const handleExportDepartment = async () => {
    if (!cycleId) return;
    try {
      const r = await reportAPI.exportDepartment(cycleId);
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'department_summary.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to download department report' });
    }
  };

  const handleExportIndividual = async () => {
    if (!cycleId || !selectedUserId) return;
    try {
      const r = await reportAPI.exportIndividual(cycleId, selectedUserId);
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement('a');
      link.href = url;
      // We could use the user's name from individualReport, but a generic or ID is fine too
      link.setAttribute('download', `appraisal_report_${selectedUserId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to download individual report' });
    }
  };

  const BAND_COLORS = {
    Poor: '#dc2626', 'Below Average': '#d97706', Average: '#0369a1', Good: '#16a34a', Outstanding: '#7c3aed',
  };

  return (
    <Layout>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Reports & Analytics</h1>

      <div style={{ marginBottom: 20 }}>
        <CycleSelector value={cycleId} onChange={setCycleId} />
      </div>

      {cycleId && (
        <>
          <Alert type={msg.type || 'info'} message={msg.text} />

          {/* Tabs */}
          <div style={tabsStyle}>
            {['department', 'distribution', 'progress', 'individual'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...tabStyle, ...(activeTab === tab ? activeTabStyle : {}) }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Report
              </button>
            ))}
          </div>

          {/* Department Summary */}
          {activeTab === 'department' && (
            <div>
              {deptSummary.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <button onClick={handleExportDepartment} style={exportBtnStyle}>
                    ⬇️ Download Excel Summary
                  </button>
                </div>
              )}
              {deptSummary.map((dept) => (
                <Card key={dept.department} title={dept.department || 'Unknown'} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={statChip}>{dept.totalEmployees} Employees</span>
                    <span style={statChip}>{dept.finalized} Finalized</span>
                    <span style={{ ...statChip, background: '#dcfce7', color: '#166534' }}>
                      Avg Score: {dept.avgFinalScore != null ? `${dept.avgFinalScore} / 5` : 'N/A'}
                    </span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {['Employee', 'Code', 'Status', 'Final Score', 'Rating Band'].map((h) => (
                            <th key={h} style={thStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dept.employees.map((e) => (
                          <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={tdStyle}>{e.name}</td>
                            <td style={tdStyle}>{e.employeeCode || '—'}</td>
                            <td style={tdStyle}><Badge label={e.status} /></td>
                            <td style={tdStyle}><strong>{e.finalScore != null ? `${e.finalScore} / 5` : '—'}</strong></td>
                            <td style={tdStyle}>
                              {e.ratingBand ? <Badge label={e.ratingBand} /> : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))}
              {deptSummary.length === 0 && <Card><p style={emptyStyle}>No data available.</p></Card>}
            </div>
          )}

          {/* Distribution */}
          {activeTab === 'distribution' && distribution && (
            <Card title="Rating Band Distribution">
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
                Total finalized appraisals: <strong>{distribution.total}</strong>
              </div>
              {Object.entries(distribution.distribution || {}).map(([band, count]) => (
                <div key={band} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Badge label={band} />
                      <span style={{ fontSize: 13, color: '#64748b' }}>{count} employees</span>
                    </div>
                    <strong style={{ color: BAND_COLORS[band], fontSize: 16 }}>
                      {distribution.percentages[band]}%
                    </strong>
                  </div>
                  <div style={{ height: 12, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${distribution.percentages[band]}%`,
                      background: BAND_COLORS[band] || '#2563eb',
                      borderRadius: 6,
                      transition: 'width 0.5s',
                    }} />
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Progress */}
          {activeTab === 'progress' && progress && (
            <Card title="Appraisal Cycle Progress">
              <div style={{ fontSize: 14, marginBottom: 20 }}>Total: <strong>{progress.total}</strong></div>
              {Object.entries(progress.progress || {}).map(([status, count]) => (
                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <Badge label={status} />
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 200, height: 8, background: '#e2e8f0', borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${progress.total ? (count / progress.total) * 100 : 0}%`, background: '#2563eb', borderRadius: 4 }} />
                    </div>
                    <strong>{count}</strong>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Individual */}
          {activeTab === 'individual' && (
            <div>
              <Card style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    style={{ ...inputStyle, flex: 1, maxWidth: 300 }}
                    value={selectedUserId}
                    onChange={(e) => { setSelectedUserId(e.target.value); setIndividualReport(null); }}
                  >
                    <option value="">-- Select Employee --</option>
                    {users.filter((u) => u.role === 'EMPLOYEE').map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.employeeCode || u.email})</option>
                    ))}
                  </select>
                  <button onClick={fetchIndividual} disabled={!selectedUserId} style={fetchBtnStyle}>
                    Generate Report
                  </button>
                </div>
              </Card>

              {individualReport && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <button onClick={handleExportIndividual} style={exportBtnStyle}>
                      ⬇️ Download PDF Report
                    </button>
                  </div>
                  <Card title="Employee Details" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                      {[
                        ['Name', individualReport.user?.name],
                        ['Email', individualReport.user?.email],
                        ['Department', individualReport.user?.department || '—'],
                        ['Employee Code', individualReport.user?.employeeCode || '—'],
                      ].map(([l, v]) => (
                        <div key={l} style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8 }}>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{l}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {individualReport.appraisal && (
                    <Card title="Appraisal Results">
                      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        <Badge label={individualReport.appraisal.status} />
                        {individualReport.appraisal.ratingBand && <Badge label={individualReport.appraisal.ratingBand} />}
                      </div>
                      {individualReport.appraisal.finalScore && (() => {
                        const kpaRaw = individualReport.appraisal.kpaScore;
                        const kpaOn5 = kpaRaw != null ? parseFloat((kpaRaw / 20).toFixed(2)) : null;
                        return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                          {[
                            ['Final Score', individualReport.appraisal.finalScore, '/ 5'],
                            ['KPA (60%)', kpaOn5, `/ 5 (raw: ${kpaRaw ?? '—'}/100)`],
                            ['Values (20%)', individualReport.appraisal.valuesScore, '/ 5'],
                            ['Competencies (20%)', individualReport.appraisal.competenciesScore, '/ 5'],
                          ].map(([l, v, suffix]) => (
                            <div key={l} style={{ background: '#f8fafc', padding: 14, borderRadius: 8, textAlign: 'center' }}>
                              <div style={{ fontSize: 12, color: '#64748b' }}>{l}</div>
                              <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb' }}>{v ?? '—'}<span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}> {v != null ? suffix : ''}</span></div>
                            </div>
                          ))}
                        </div>
                        );
                      })()}
                      {individualReport.kpas?.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>KPA Goals</h4>
                          {individualReport.kpas.map((k) => (
                            <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                              <span>{k.title}</span>
                              <span style={{ color: '#64748b' }}>{k.weightage}% · <Badge label={k.status} /></span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

const tabsStyle = { display: 'flex', gap: 0, marginBottom: 20, border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', width: 'fit-content' };
const tabStyle = { padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, background: '#fff', color: '#64748b' };
const activeTabStyle = { background: '#2563eb', color: '#fff', fontWeight: 700 };
const emptyStyle = { textAlign: 'center', color: '#94a3b8', padding: 40 };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', borderBottom: '2px solid #e2e8f0' };
const tdStyle = { padding: '10px 12px', fontSize: 13 };
const statChip = { background: '#dbeafe', color: '#1d4ed8', padding: '4px 12px', borderRadius: 16, fontSize: 13, fontWeight: 600 };
const inputStyle = { padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14 };
const fetchBtnStyle = { padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const exportBtnStyle = { padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 };
