import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import CycleSelector from '../../components/CycleSelector';
import Button from '../../components/Button';
import { kpaAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function GoalApproval() {
  const { user } = useAuth();
  const { roleType } = useParams();
  const [cycleId, setCycleId] = useState('');
  const [kpas, setKpas] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [remarkMap, setRemarkMap] = useState({});
  const [submitting, setSubmitting] = useState('');

  const load = async (cid) => {
    if (!cid) return;
    try {
      // getTeam returns all kpas for the officer, so we must filter by roleType
      const k = await kpaAPI.getTeam(cid);
      const allKpas = k.data.kpas || [];
      const filtered = allKpas.filter(kpa => {
        if (roleType === 'reporting') return kpa.user.reportingOfficerId === user.id;
        if (roleType === 'reviewing') return kpa.user.reviewingOfficerId === user.id && kpa.status === 'REPORTING_DONE';
        if (roleType === 'accepting') return kpa.user.acceptingOfficerId === user.id && kpa.status === 'REPORTING_DONE';
        return false;
      });
      setKpas(filtered);
    } catch (err) {
      setKpas([]);
    }
  };

  useEffect(() => { load(cycleId); }, [cycleId, roleType, user.id]);

  const handleReview = async (userId, action) => {
    const remarks = remarkMap[userId];
    if (action === 'REJECT' && !remarks?.trim()) {
      return setMsg({ type: 'error', text: 'Please enter remarks for rejection.' });
    }
    setSubmitting(userId);
    try {
      await kpaAPI.review(cycleId, userId, action, remarks);
      setMsg({ type: 'success', text: `Goals ${action === 'ACCEPT' ? 'accepted' : 'rejected'}.` });
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

  let contextualTarget = 'Reportees';
  if (roleType === 'reviewing') contextualTarget = 'Reviewees';
  if (roleType === 'accepting') contextualTarget = 'Appraisees';

  return (
    <Layout>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>{contextualTarget} Goal Approvals</h1>

      <div style={{ marginBottom: 20 }}>
        <CycleSelector value={cycleId} onChange={setCycleId} />
      </div>

      {cycleId && (
        <>
          <Alert type={msg.type || 'info'} message={msg.text} />

          {Object.values(byEmployee).length === 0 ? (
            <Card><p style={{ color: '#94a3b8', textAlign: 'center', padding: 30 }}>No KPAs from {contextualTarget.toLowerCase()}.</p></Card>
          ) : (
            Object.values(byEmployee).map(({ user: emp, kpas: empKpas }) => {
              const hasSubmitted = empKpas.some(k => k.status === 'SUBMITTED');
              
              return (
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
                  
                  {hasSubmitted && roleType === 'reporting' && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                      <textarea
                        value={remarkMap[emp.id] || ''}
                        onChange={(e) => setRemarkMap((prev) => ({ ...prev, [emp.id]: e.target.value }))}
                        placeholder="Enter remarks (required for rejection)..."
                        style={{ width: '100%', padding: 10, border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, height: 80, resize: 'vertical', marginBottom: 10 }}
                      />
                      <div style={{ display: 'flex', gap: 10 }}>
                        <Button 
                          onClick={() => handleReview(emp.id, 'ACCEPT')} 
                          disabled={submitting === emp.id}
                          variant="success"
                        >
                          {submitting === emp.id ? 'Processing...' : 'Accept Goals'}
                        </Button>
                        <Button 
                          onClick={() => handleReview(emp.id, 'REJECT')} 
                          disabled={submitting === emp.id}
                          variant="danger"
                        >
                          Reject with Remarks
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
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
