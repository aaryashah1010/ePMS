import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import CycleSelector from '../../components/CycleSelector';
import ConfirmModal from '../../components/ConfirmModal';
import { midYearAPI } from '../../services/api';

export default function MidYearReview() {
  const [cycleId, setCycleId] = useState('');
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [review, setReview] = useState(null);
  const [progress, setProgress] = useState('');
  const [selfRating, setSelfRating] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', variant: 'primary' });

  const isPhaseLocked = selectedCycle && selectedCycle.phase !== 'MID_YEAR_REVIEW';

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

  const handleSubmit = () => {
    if (!progress.trim()) return setMsg({ type: 'error', text: 'Progress update is required.' });
    setModalConfig({
      isOpen: true,
      title: 'Submit Mid-Year Review',
      message: 'Submit mid-year review? You cannot edit after submission.',
      confirmText: 'Submit',
      variant: 'primary',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setSubmitting(true);
        setMsg({ type: '', text: '' });
        try {
          await midYearAPI.save(cycleId, { progress, selfRating: selfRating ? parseFloat(selfRating) : null });
          await midYearAPI.submit(cycleId);
          setMsg({ type: 'success', text: 'Mid-year review submitted successfully.' });
          load(cycleId);
        } catch (err) {
          setMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed' });
        } finally { setSubmitting(false); }
      }
    });
  };

  const isLocked = isPhaseLocked || review?.status === 'SUBMITTED' || review?.status === 'REPORTING_DONE';

  return (
    <Layout>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Mid-Year Review</h1>

      <div style={{ marginBottom: 20 }}>
        <CycleSelector
          value={cycleId}
          onChange={setCycleId}
          onCycleChange={(id, cycle) => setSelectedCycle(cycle)}
        />
      </div>

      {cycleId && (
        <>
          <Alert type={msg.type || 'info'} message={msg.text} />

          {isPhaseLocked && (
            <div style={{ marginBottom: 16, background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#713f12' }}>
              🔒 This cycle has moved to the <strong>{selectedCycle?.phase?.replace(/_/g, ' ')}</strong> phase. Mid-Year Review is now <strong>read-only</strong>.
            </div>
          )}

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
                  if (val !== '' && Number(val) < 1) val = '1';
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
      <ConfirmModal 
        {...modalConfig} 
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />
    </Layout>
  );
}

const fieldStyle = { marginBottom: 16 };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14 };
