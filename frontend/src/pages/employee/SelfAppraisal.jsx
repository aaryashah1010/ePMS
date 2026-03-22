import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import CycleSelector from '../../components/CycleSelector';
import { appraisalAPI } from '../../services/api';

const RATING_BAND_COLOR = {
  Poor: '#dc2626', 'Below Average': '#d97706',
  Average: '#0369a1', Good: '#16a34a', Outstanding: '#7c3aed',
};

export default function SelfAppraisal() {
  const [cycleId, setCycleId] = useState('');
  const [appraisal, setAppraisal] = useState(null);
  const [achievements, setAchievements] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async (cid) => {
    if (!cid) return;
    try {
      const r = await appraisalAPI.getMy(cid);
      setAppraisal(r.data.appraisal);
      setAchievements(r.data.appraisal?.achievements || '');
    } catch {
      setAppraisal(null);
    }
  };

  useEffect(() => { load(cycleId); }, [cycleId]);

  const handleSave = async () => {
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      await appraisalAPI.updateSelf(cycleId, achievements);
      setMsg({ type: 'success', text: 'Achievements saved.' });
      load(cycleId);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Save failed' });
    } finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    if (!window.confirm('Submit appraisal? This cannot be undone.')) return;
    setSubmitting(true);
    try {
      await appraisalAPI.submit(cycleId);
      setMsg({ type: 'success', text: 'Appraisal submitted. Your reporting officer will now review it.' });
      load(cycleId);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Submit failed' });
    } finally { setSubmitting(false); }
  };

  const isDraft = !appraisal || appraisal.status === 'DRAFT';
  const isFinalized = appraisal?.status === 'FINALIZED';

  return (
    <Layout>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Annual Self-Appraisal</h1>

      <div style={{ marginBottom: 20 }}>
        <CycleSelector value={cycleId} onChange={setCycleId} />
      </div>

      {cycleId && (
        <>
          <Alert type={msg.type || 'info'} message={msg.text} />

          {isFinalized && appraisal.finalScore && (
            <Card style={{ marginBottom: 20, textAlign: 'center', background: '#f0fdf4', border: '2px solid #86efac' }}>
              <div style={{ fontSize: 13, color: '#166534', fontWeight: 600, marginBottom: 6 }}>FINAL APPRAISAL RESULT</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: RATING_BAND_COLOR[appraisal.ratingBand] || '#2563eb' }}>
                {appraisal.finalScore}
              </div>
              <Badge label={appraisal.ratingBand} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
                <div style={scoreCardStyle}><div style={scoreLabelStyle}>KPA Score (60%)</div><div style={scoreValStyle}>{appraisal.kpaScore ?? '—'}</div></div>
                <div style={scoreCardStyle}><div style={scoreLabelStyle}>Values Score (20%)</div><div style={scoreValStyle}>{appraisal.valuesScore ?? '—'}</div></div>
                <div style={scoreCardStyle}><div style={scoreLabelStyle}>Competencies (20%)</div><div style={scoreValStyle}>{appraisal.competenciesScore ?? '—'}</div></div>
              </div>
            </Card>
          )}

          <Card title="Self Assessment">
            {appraisal && <div style={{ marginBottom: 12 }}><Badge label={appraisal.status} /></div>}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Achievements & Contributions *</label>
              <textarea
                style={{ width: '100%', padding: '12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, height: 180, resize: 'vertical' }}
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                placeholder="Describe your key achievements, contributions, and outcomes for this appraisal year..."
                disabled={!isDraft}
              />
            </div>

            {isDraft && (
              <div style={{ display: 'flex', gap: 10 }}>
                <Button onClick={handleSave} loading={saving} variant="outline">Save Draft</Button>
                <Button onClick={handleSubmit} loading={submitting} variant="success" disabled={!achievements.trim()}>
                  Submit for Review
                </Button>
              </div>
            )}
          </Card>

          {/* KPA Ratings from officer */}
          {appraisal?.kpaRatings?.length > 0 && (
            <Card title="KPA Ratings" style={{ marginTop: 20 }}>
              {appraisal.kpaRatings.map((r) => (
                <div key={r.id} style={ratingRowStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.kpaGoal?.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Weight: {r.kpaGoal?.weightage}%</div>
                    {r.remarks && <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Remarks: {r.remarks}</div>}
                  </div>
                  <div style={ratingBubble(r.rating)}>{r.rating}</div>
                </div>
              ))}
            </Card>
          )}

          {/* Remarks chain */}
          {appraisal?.reportingRemarks && (
            <Card title="Reporting Officer Remarks" style={{ marginTop: 16, background: '#fefce8' }}>
              <p style={{ fontSize: 14 }}>{appraisal.reportingRemarks}</p>
            </Card>
          )}
          {appraisal?.reviewingRemarks && (
            <Card title="Reviewing Officer Remarks" style={{ marginTop: 16, background: '#f0f9ff' }}>
              <p style={{ fontSize: 14 }}>{appraisal.reviewingRemarks}</p>
            </Card>
          )}
          {appraisal?.acceptingRemarks && (
            <Card title="Accepting Officer Remarks" style={{ marginTop: 16, background: '#f0fdf4' }}>
              <p style={{ fontSize: 14 }}>{appraisal.acceptingRemarks}</p>
            </Card>
          )}
        </>
      )}
    </Layout>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const ratingRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', gap: 12 };
const ratingBubble = (val) => ({
  width: 44, height: 44, borderRadius: '50%',
  background: val >= 4 ? '#dcfce7' : val >= 3 ? '#dbeafe' : '#fee2e2',
  color: val >= 4 ? '#166534' : val >= 3 ? '#1d4ed8' : '#991b1b',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 800, fontSize: 16, flexShrink: 0,
});
const scoreCardStyle = { background: '#f8fafc', borderRadius: 10, padding: '14px 16px' };
const scoreLabelStyle = { fontSize: 12, color: '#64748b', fontWeight: 500, marginBottom: 4 };
const scoreValStyle = { fontSize: 26, fontWeight: 800, color: '#1e293b' };
