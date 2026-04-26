import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import CycleSelector from '../../components/CycleSelector';
import { midYearAPI } from '../../services/api';

export default function MidYearReview() {
  const [cycleId, setCycleId] = useState('');
  const [review, setReview] = useState(null);
  const [progress, setProgress] = useState('');
  const [selfRating, setSelfRating] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async (cid) => {
    if (!cid) return;
    setMsg({ type: '', text: '' });
    try {
      const r = await midYearAPI.getMy(cid);
      if (r.data.review) {
        setReview(r.data.review);
        setProgress(r.data.review.progress || '');
        setSelfRating(r.data.review.selfRating || '');
      } else {
        setReview(null); setProgress(''); setSelfRating('');
      }
    } catch { setReview(null); }
  };

  useEffect(() => { load(cycleId); }, [cycleId]);

  const handleSave = async () => {
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      await midYearAPI.save(cycleId, { progress, selfRating: selfRating ? parseFloat(selfRating) : null });
      setMsg({ type: 'success', text: 'Progress saved.' });
      load(cycleId);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Save failed' });
    } finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    if (!progress.trim()) return setMsg({ type: 'error', text: 'Progress update is required.' });
    if (!window.confirm('Submit mid-year review? You cannot edit after submission.')) return;
    setSubmitting(true);
    setMsg({ type: '', text: '' });
    try {
      // Always save first (creates if not exists, updates if draft), then submit
      await midYearAPI.save(cycleId, { progress, selfRating: selfRating ? parseFloat(selfRating) : null });
      await midYearAPI.submit(cycleId);
      setMsg({ type: 'success', text: 'Mid-year review submitted successfully.' });
      load(cycleId);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed' });
    } finally { setSubmitting(false); }
  };

  const isLocked = review?.status === 'SUBMITTED' || review?.status === 'REPORTING_DONE';

  return (
    <Layout>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Mid-Year Review</h1>

      <div style={{ marginBottom: 20 }}>
        <CycleSelector value={cycleId} onChange={setCycleId} minPhase="MID_YEAR_REVIEW" />
      </div>

      {cycleId && (
        <>
          <Alert type={msg.type || 'info'} message={msg.text} />

          <Card title="Progress Update">
            {review && (
              <div style={{ marginBottom: 16 }}>
                <Badge label={review.status} />
              </div>
            )}

            <div style={fieldStyle}>
              <label style={labelStyle}>Progress Update *</label>
              <textarea
                style={{ ...inputStyle, height: 160, resize: 'vertical' }}
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                placeholder="Describe your progress against each KPA..."
                disabled={isLocked}
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Self Rating (1-5)</label>
              <input
                type="number" min="1" max="5" step="0.1"
                style={{ ...inputStyle, width: 120 }}
                value={selfRating}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val !== '' && Number(val) > 5) val = '5';
                  setSelfRating(val);
                }}
                placeholder="1–5"
                disabled={isLocked}
              />
            </div>

            {!isLocked && (
              <div style={{ display: 'flex', gap: 10 }}>
                <Button onClick={handleSave} loading={saving} variant="outline">Save Draft</Button>
                <Button onClick={handleSubmit} loading={submitting} variant="success" disabled={!progress.trim()}>
                  Submit Review
                </Button>
              </div>
            )}
          </Card>

          {review?.reportingRemarks && (
            <Card title="Reporting Officer's Remarks" style={{ marginTop: 20, background: '#fffbeb' }}>
              <p style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.6 }}>{review.reportingRemarks}</p>
            </Card>
          )}
        </>
      )}
    </Layout>
  );
}

const fieldStyle = { marginBottom: 16 };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14 };
