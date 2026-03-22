import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import CycleSelector from '../../components/CycleSelector';
import { kpaAPI, midYearAPI } from '../../services/api';

export default function GoalApproval() {
  const [cycleId, setCycleId] = useState('');
  const [kpas, setKpas] = useState([]);
  const [midReviews, setMidReviews] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('goals');
  const [remarkMap, setRemarkMap] = useState({});
  const [submitting, setSubmitting] = useState('');

  const load = async (cid) => {
    if (!cid) return;
    const [k, m] = await Promise.allSettled([
      kpaAPI.getTeam(cid),
      midYearAPI.getTeam(cid),
    ]);
    if (k.status === 'fulfilled') setKpas(k.value.data.kpas || []);
    if (m.status === 'fulfilled') setMidReviews(m.value.data.reviews || []);
  };

  useEffect(() => { load(cycleId); }, [cycleId]);

  const handleAddRemark = async (userId) => {
    const remarks = remarkMap[userId];
    if (!remarks?.trim()) return setMsg({ type: 'error', text: 'Please enter remarks.' });
    setSubmitting(userId);
    try {
      await midYearAPI.addRemarks(cycleId, userId, remarks);
      setMsg({ type: 'success', text: 'Remarks added.' });
      load(cycleId);
      setRemarkMap((prev) => ({ ...prev, [userId]: '' }));
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
    } finally { setSubmitting(''); }
  };

  // Group KPAs by employee
  const byEmployee = {};
  for (const k of kpas) {
    const uid = k.user.id;
    if (!byEmployee[uid]) byEmployee[uid] = { user: k.user, kpas: [] };
    byEmployee[uid].kpas.push(k);
  }

  return (
    <Layout>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Goal & Mid-Year Review</h1>

      <div style={{ marginBottom: 20 }}>
        <CycleSelector value={cycleId} onChange={setCycleId} />
      </div>

      {cycleId && (
        <>
          <Alert type={msg.type || 'info'} message={msg.text} />

          <div style={{ display: 'flex', gap: 0, marginBottom: 20, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
            {['goals', 'midyear'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 24px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  background: activeTab === tab ? '#2563eb' : '#fff',
                  color: activeTab === tab ? '#fff' : '#64748b',
                }}>
                {tab === 'goals' ? 'KPA Goals' : 'Mid-Year Reviews'}
              </button>
            ))}
          </div>

          {activeTab === 'goals' && (
            Object.values(byEmployee).length === 0 ? (
              <Card><p style={{ color: '#94a3b8', textAlign: 'center', padding: 30 }}>No KPAs from team members.</p></Card>
            ) : (
              Object.values(byEmployee).map(({ user: emp, kpas: empKpas }) => (
                <Card key={emp.id} title={`${emp.name} (${emp.employeeCode || emp.email})`} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{emp.department}</div>
                  {empKpas.map((k) => (
                    <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{k.title}</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>{k.description}</div>
                        <span style={weightBadge}>{k.weightage}%</span>
                      </div>
                      <Badge label={k.status} />
                    </div>
                  ))}
                  <div style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
                    Total weight: {empKpas.reduce((s, k) => s + k.weightage, 0)}%
                  </div>
                </Card>
              ))
            )
          )}

          {activeTab === 'midyear' && (
            midReviews.length === 0 ? (
              <Card><p style={{ color: '#94a3b8', textAlign: 'center', padding: 30 }}>No mid-year reviews submitted.</p></Card>
            ) : (
              midReviews.map((r) => (
                <Card key={r.id} title={`${r.user?.name} — Mid-Year`} style={{ marginBottom: 16 }}>
                  <Badge label={r.status} />
                  <p style={{ marginTop: 12, fontSize: 14, color: '#1e293b' }}>{r.progress}</p>
                  {r.selfRating && <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Self Rating: {r.selfRating}</p>}
                  {r.reportingRemarks && (
                    <div style={{ marginTop: 12, background: '#f0fdf4', padding: 12, borderRadius: 8 }}>
                      <strong style={{ fontSize: 13 }}>Your Remarks:</strong>
                      <p style={{ fontSize: 13, marginTop: 4 }}>{r.reportingRemarks}</p>
                    </div>
                  )}
                  {r.status === 'SUBMITTED' && (
                    <div style={{ marginTop: 12 }}>
                      <textarea
                        value={remarkMap[r.userId] || ''}
                        onChange={(e) => setRemarkMap((prev) => ({ ...prev, [r.userId]: e.target.value }))}
                        placeholder="Enter your remarks..."
                        style={{ width: '100%', padding: 10, border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, height: 80, resize: 'vertical' }}
                      />
                      <button
                        onClick={() => handleAddRemark(r.userId)}
                        disabled={submitting === r.userId}
                        style={remarkBtnStyle}
                      >
                        {submitting === r.userId ? 'Saving...' : 'Add Remarks'}
                      </button>
                    </div>
                  )}
                </Card>
              ))
            )
          )}
        </>
      )}
    </Layout>
  );
}

const weightBadge = {
  display: 'inline-block', background: '#dbeafe', color: '#1d4ed8',
  padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700, marginTop: 4,
};
const remarkBtnStyle = {
  marginTop: 8, padding: '8px 18px', background: '#2563eb', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
