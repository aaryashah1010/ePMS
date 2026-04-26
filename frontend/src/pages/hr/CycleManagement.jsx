import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import { useNavigate } from 'react-router-dom';
import { cycleAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const EMPTY_FORM = {
  name: '', year: new Date().getFullYear(), phase: 'GOAL_SETTING', status: 'ACTIVE',
  startDate: '', endDate: '', description: '',
  kpaWeight: 60, valuesWeight: 20, competenciesWeight: 20
};

const PHASES = ['GOAL_SETTING', 'MID_YEAR_REVIEW', 'ANNUAL_APPRAISAL'];

export default function CycleManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cycles, setCycles] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const r = await cycleAPI.getAll();
    setCycles(r.data.cycles || []);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalWeight = Number(form.kpaWeight) + Number(form.valuesWeight) + Number(form.competenciesWeight);
    if (totalWeight !== 100) {
      setMsg({ type: 'error', text: `Weights must total 100. Current: ${totalWeight}` });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(form.startDate);
    if (start < today) {
      setMsg({ type: 'error', text: 'Start date cannot be in the past.' });
      return;
    }

    setLoading(true);
    try {
      const data = { 
        ...form, 
        year: parseInt(form.year),
        kpaWeight: parseFloat(form.kpaWeight),
        valuesWeight: parseFloat(form.valuesWeight),
        competenciesWeight: parseFloat(form.competenciesWeight)
      };
      await cycleAPI.create(data);
      setMsg({ type: 'success', text: 'Cycle created successfully.' });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Operation failed' });
    } finally { setLoading(false); }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Cycle Management</h1>
        <Button onClick={() => {
          setShowForm(!showForm);
          if (showForm) {
            setForm(EMPTY_FORM);
          }
        }}>
          {showForm ? 'Cancel' : '+ New Cycle'}
        </Button>
      </div>

      <Alert type={msg.type || 'info'} message={msg.text} />

      {showForm && (
        <Card title="Create New Appraisal Cycle" style={{ marginBottom: 20 }}>
          <form onSubmit={handleSubmit}>
            <div style={gridStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Cycle Name *</label>
                <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g., Annual Appraisal 2024" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Year *</label>
                <input type="number" style={inputStyle} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Opening Phase *</label>
                <select style={inputStyle} value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })}>
                  {PHASES.map((p) => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Start Date *</label>
                <input type="date" style={inputStyle} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>End Date *</label>
                <input type="date" style={inputStyle} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
              </div>
            </div>
            
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: '16px 0 10px', color: '#1e3a5f' }}>Score Weights (%)</h4>
            <div style={gridStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>KPA Weight</label>
                <input type="number" style={inputStyle} value={form.kpaWeight} onChange={(e) => setForm({ ...form, kpaWeight: e.target.value })} required />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Values Weight</label>
                <input type="number" style={inputStyle} value={form.valuesWeight} onChange={(e) => setForm({ ...form, valuesWeight: e.target.value })} required />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Competencies Weight</label>
                <input type="number" style={inputStyle} value={form.competenciesWeight} onChange={(e) => setForm({ ...form, competenciesWeight: e.target.value })} required />
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, height: 60, resize: 'vertical' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button type="submit" loading={loading}>Create Cycle</Button>
            </div>
          </form>
        </Card>
      )}

      {cycles.length === 0 ? (
        <Card><p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No cycles created yet.</p></Card>
      ) : (
        cycles.map((c) => (
          <div key={c.id} style={{ cursor: 'pointer', marginBottom: 16 }} onClick={() => navigate(`/hr/cycles/${c.id}`)}>
            <Card style={{ transition: 'all 0.2s', ':hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{c.name}</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <Badge label={c.status} />
                    <Badge label={c.phase} />
                    <span style={{ fontSize: 13, color: '#64748b' }}>Year: {c.year}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>
                    {new Date(c.startDate).toLocaleDateString()} – {new Date(c.endDate).toLocaleDateString()}
                  </div>
                  {c.description && <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>{c.description}</p>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#2563eb' }}>
                  Manage Details &rarr;
                </div>
              </div>

            {/* Phase Timeline */}
            <div style={{ display: 'flex', gap: 0, marginTop: 16, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              {PHASES.map((p, i) => {
                const isCurrentOrPast = PHASES.indexOf(c.phase) >= i;
                return (
                  <div key={p} style={{
                    flex: 1, padding: '8px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600,
                    background: p === c.phase ? '#2563eb' : isCurrentOrPast ? '#dbeafe' : '#f8fafc',
                    color: p === c.phase ? '#fff' : isCurrentOrPast ? '#1d4ed8' : '#94a3b8',
                    borderRight: i < PHASES.length - 1 ? '1px solid #e2e8f0' : 'none',
                  }}>
                    {p.replace(/_/g, ' ')}
                  </div>
                );
              })}
            </div>
            </Card>
          </div>
        ))
      )}
    </Layout>
  );
}

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 };
const fieldStyle = {};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14 };
