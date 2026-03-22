import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import CycleSelector from '../../components/CycleSelector';
import { kpaAPI } from '../../services/api';

const EMPTY_FORM = { title: '', description: '', weightage: '' };

export default function GoalSetting() {
  const [cycleId, setCycleId] = useState('');
  const [kpas, setKpas] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalWeight = kpas.reduce((s, k) => s + k.weightage, 0);
  const isSubmitted = kpas.length > 0 && kpas.every((k) => k.status === 'SUBMITTED');

  const loadKpas = async (cid) => {
    if (!cid) return;
    try {
      const r = await kpaAPI.getMy(cid);
      setKpas(r.data.kpas || []);
    } catch { setKpas([]); }
  };

  useEffect(() => { loadKpas(cycleId); }, [cycleId]);

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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this KPA?')) return;
    try {
      await kpaAPI.delete(id);
      setMsg({ type: 'success', text: 'KPA deleted.' });
      loadKpas(cycleId);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Delete failed' });
    }
  };

  const handleEdit = (kpa) => {
    setEditId(kpa.id);
    setForm({ title: kpa.title, description: kpa.description || '', weightage: kpa.weightage });
  };

  const handleSubmitAll = async () => {
    if (!window.confirm('Submit all KPAs? This cannot be undone.')) return;
    setSubmitting(true);
    try {
      const r = await kpaAPI.submit(cycleId);
      setMsg({ type: 'success', text: r.data.message });
      loadKpas(cycleId);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed' });
    } finally { setSubmitting(false); }
  };

  return (
    <Layout>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Goal Setting (KPAs)</h1>

      <div style={{ marginBottom: 20 }}>
        <CycleSelector value={cycleId} onChange={setCycleId} />
      </div>

      {cycleId && (
        <>
          <Alert type={msg.type || 'info'} message={msg.text} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20, alignItems: 'start' }}>
            {/* Form */}
            {!isSubmitted && (
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
                    <small style={{ color: '#64748b', fontSize: 12 }}>Total allocated: {totalWeight}% · Remaining: {(100 - totalWeight).toFixed(2)}%</small>
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
                !isSubmitted && kpas.length > 0 && (
                  <Button
                    variant="success"
                    size="sm"
                    loading={submitting}
                    onClick={handleSubmitAll}
                    disabled={Math.abs(totalWeight - 100) > 0.01}
                  >
                    Submit All KPAs
                  </Button>
                )
              }
            >
              {kpas.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: 30 }}>No KPAs yet. Add your first goal.</p>
              ) : (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(totalWeight, 100)}%`, background: Math.abs(totalWeight - 100) < 0.01 ? '#16a34a' : '#2563eb', borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                      {totalWeight}% allocated {Math.abs(totalWeight - 100) < 0.01 ? '✓ Ready to submit' : `· ${(100 - totalWeight).toFixed(2)}% remaining`}
                    </div>
                  </div>
                  {kpas.map((k) => (
                    <div key={k.id} style={kpaRowStyle}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{k.title}</div>
                        {k.description && <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{k.description}</div>}
                        <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                          <span style={weightBadge}>{k.weightage}%</span>
                          <Badge label={k.status} />
                        </div>
                      </div>
                      {k.status === 'DRAFT' && (
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
    </Layout>
  );
}

const fieldStyle = { marginBottom: 14 };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14 };
const kpaRowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '12px 0', borderBottom: '1px solid #f1f5f9', gap: 12,
};
const weightBadge = {
  background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px',
  borderRadius: 12, fontSize: 12, fontWeight: 700,
};
