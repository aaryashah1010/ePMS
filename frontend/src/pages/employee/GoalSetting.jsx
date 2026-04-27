import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import CycleSelector from '../../components/CycleSelector';
import ConfirmModal from '../../components/ConfirmModal';
import { kpaAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const EMPTY_FORM = { title: '', description: '', weightage: '' };

export default function GoalSetting() {
  const { user: authUser } = useAuth();
  const [cycleId, setCycleId] = useState('');
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [kpas, setKpas] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', variant: 'primary' });

  const isPhaseLocked = selectedCycle && selectedCycle.phase !== 'GOAL_SETTING';

  const totalWeight = kpas.reduce((s, k) => s + k.weightage, 0);
  const isSubmitted = kpas.length > 0 && kpas.every((k) => k.status !== 'DRAFT');

  const loadKpas = async (cid) => {
    if (!cid) return;
    try {
      const r = await kpaAPI.getMy(cid);
      setKpas(r.data.kpas || []);
    } catch { setKpas([]); }
  };

  useEffect(() => { loadKpas(cycleId); }, [cycleId]);

  // Auto-save drafts
  useEffect(() => {
    if (!cycleId || isSubmitted || (!form.title && !form.description && !form.weightage)) return;
    
    const interval = setInterval(async () => {
      // Only auto-save if title and weightage are present
      if (form.title && form.weightage) {
        try {
          if (editId) {
            await kpaAPI.update(editId, { ...form, weightage: parseFloat(form.weightage) });
          } else {
            const res = await kpaAPI.create(cycleId, { ...form, weightage: parseFloat(form.weightage) });
            setEditId(res.data.kpa.id); // set editId so subsequent auto-saves update it
          }
          setMsg({ type: 'success', text: 'Draft auto-saved.' });
          loadKpas(cycleId);
        } catch (err) {
          // silent fail for auto-save, or we can log it
          console.error("Auto-save failed", err);
        }
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [cycleId, form, editId, isSubmitted]);

  // Check for rejection remarks
  const rejectionRemarks = kpas.find(k => k.status === 'DRAFT' && k.reportingRemarks)?.reportingRemarks;

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setLoading(true);
    try {
      if (editId) {
        await kpaAPI.update(editId, { ...form, weightage: parseFloat(form.weightage) });
        setMsg({ type: 'success', text: 'KPA updated.' });
      } else {
        await kpaAPI.create(cycleId, { ...form, weightage: parseFloat(form.weightage) });
        setMsg({ type: 'success', text: 'KPA added.' });
      }
      setForm(EMPTY_FORM);
      setEditId(null);
      loadKpas(cycleId);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save KPA' });
    } finally { setLoading(false); }
  };

  const handleDelete = (id) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete KPA',
      message: 'Are you sure you want to delete this KPA?',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await kpaAPI.delete(id);
          setMsg({ type: 'success', text: 'KPA deleted.' });
          loadKpas(cycleId);
        } catch (err) {
          setMsg({ type: 'error', text: err.response?.data?.message || 'Delete failed' });
        }
      }
    });
  };

  const handleEdit = (kpa) => {
    setEditId(kpa.id);
    setForm({ title: kpa.title, description: kpa.description || '', weightage: kpa.weightage });
  };

  const handleSubmitAll = () => {
    setModalConfig({
      isOpen: true,
      title: 'Submit KPAs',
      message: 'Submit all KPAs? This cannot be undone.',
      confirmText: 'Submit All',
      variant: 'success',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setSubmitting(true);
        try {
          const r = await kpaAPI.submit(cycleId);
          setMsg({ type: 'success', text: r.data.message });
          loadKpas(cycleId);
        } catch (err) {
          setMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed' });
        } finally { setSubmitting(false); }
      }
    });
  };

  return (
    <Layout>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, color: '#3C2415', letterSpacing: '-0.01em' }}>Goal Setting (KPAs)</h1>

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
          {rejectionRemarks && (
            <div style={{ marginBottom: 20, background: '#FDF0F0', border: '1px solid #D4A0A0', borderRadius: 10, padding: 16 }}>
              <h4 style={{ margin: 0, color: '#8B3A3A', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>⚠️</span> Goals Rejected
              </h4>
              <p style={{ marginTop: 8, color: '#8B3A3A', fontSize: 14 }}>
                <strong>Reporting Officer Remarks:</strong> {rejectionRemarks}
              </p>
            </div>
          )}

          {isPhaseLocked && (
            <div style={{ marginBottom: 16, background: '#FDF8EE', border: '1px solid #D4C090', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#B8860B' }}>
              This cycle has moved to the <strong>{selectedCycle?.phase?.replace(/_/g, ' ')}</strong> phase. Goal Setting is now <strong>read-only</strong>.
            </div>
          )}

          {kpas.length > 0 && kpas.every(k => k.status === 'SUBMITTED') && (() => {
            if (!authUser?.reportingOfficerId) {
              return (
                <div style={{ marginBottom: 16, background: '#FDF0F0', border: '1px solid #D4A0A0', borderRadius: 10, padding: '14px 18px', fontSize: 13 }}>
                  <strong style={{ color: '#8B3A3A' }}>Reporting Officer Not Assigned</strong>
                  <p style={{ color: '#8B3A3A', margin: '6px 0 0' }}>Your reporting officer has not been assigned yet. Please contact HR to assign your reporting officer so your goals can be reviewed.</p>
                </div>
              );
            }
            return (
              <div style={{ marginBottom: 16, background: '#F0FAF0', border: '1px solid #C8E6C9', borderRadius: 10, padding: '14px 18px', fontSize: 13, color: '#2E7D32' }}>
                <strong>Goals Submitted</strong> — Your goals are under review by <strong>{authUser.reportingOfficer?.name || 'your Reporting Officer'}</strong>.
              </div>
            );
          })()}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20, alignItems: 'start' }}>
            {/* Add KPA form - hidden when phase locked or already submitted */}
            {!isSubmitted && !isPhaseLocked && (
              <Card title={editId ? 'Edit KPA' : 'Add New KPA'}>
                <form onSubmit={handleSubmitForm}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>KPA Title *</label>
                    <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g., Deliver Project Alpha" />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Description</label>
                    <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the goal in detail..." />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Weightage (%) *</label>
                    <input style={inputStyle} type="number" min="1" max="100" step="0.01" value={form.weightage} onChange={(e) => setForm({ ...form, weightage: e.target.value })} required placeholder="e.g., 30" />
                    <small style={{ color: '#A0785A', fontSize: 12 }}>Total allocated: {totalWeight}% · Remaining: {(100 - totalWeight).toFixed(2)}%</small>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button type="submit" loading={loading}>{editId ? 'Update KPA' : 'Add KPA'}</Button>
                    {editId && <Button variant="secondary" onClick={() => { setEditId(null); setForm(EMPTY_FORM); }}>Cancel</Button>}
                  </div>
                </form>
              </Card>
            )}

            {/* KPA List */}
            <Card
              title={`My KPAs (${kpas.length})`}
              actions={
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button variant="secondary" size="sm" onClick={() => window.print()}>
                    Print
                  </Button>
                  {!isSubmitted && !isPhaseLocked && kpas.length > 0 && (
                    <Button
                      variant="success"
                      size="sm"
                      loading={submitting}
                      onClick={handleSubmitAll}
                      disabled={Math.abs(totalWeight - 100) > 0.01}
                    >
                      Submit All KPAs
                    </Button>
                  )}
                </div>
              }
            >
              {kpas.length === 0 ? (
                <p style={{ color: '#A0785A', textAlign: 'center', padding: 30 }}>No KPAs yet. Add your first goal.</p>
              ) : (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ height: 8, background: '#E8DCC8', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(totalWeight, 100)}%`, background: Math.abs(totalWeight - 100) < 0.01 ? '#4A7C59' : '#A0785A', borderRadius: 4, transition: 'width 0.3s ease' }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#6F4E37', marginTop: 4 }}>
                      {totalWeight}% allocated {Math.abs(totalWeight - 100) < 0.01 ? '✓ Ready to submit' : `· ${(100 - totalWeight).toFixed(2)}% remaining`}
                    </div>
                  </div>
                  {kpas.map((k) => (
                    <div key={k.id} style={kpaRowStyle}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#3C2415' }}>{k.title}</div>
                        {k.description && <div style={{ fontSize: 13, color: '#6F4E37', marginTop: 2 }}>{k.description}</div>}
                        <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                          <span style={weightBadge}>{k.weightage}%</span>
                          <Badge label={k.status} />
                        </div>
                      </div>
                      {k.status === 'DRAFT' && !isPhaseLocked && (
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(k)}>Edit</Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(k.id)}>Delete</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </Card>
          </div>
        </>
      )}
      <ConfirmModal 
        {...modalConfig} 
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />
    </Layout>
  );
}

const fieldStyle = { marginBottom: 14 };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#6F4E37', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #C4A882', borderRadius: 10, fontSize: 14, background: '#FAF8F4', color: '#3C2415', fontFamily: "'Inter', sans-serif" };
const kpaRowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '12px 0', borderBottom: '1px solid #F5F0E8', gap: 12,
};
const weightBadge = {
  background: '#E8DCC8', color: '#3C2415', padding: '2px 8px',
  borderRadius: 12, fontSize: 12, fontWeight: 700,
};
