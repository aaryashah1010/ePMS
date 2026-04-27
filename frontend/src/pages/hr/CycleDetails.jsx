import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import ConfirmModal from '../../components/ConfirmModal';
import { cycleAPI, appraisalAPI, reportAPI } from '../../services/api';

const PHASES = ['GOAL_SETTING', 'MID_YEAR_REVIEW', 'ANNUAL_APPRAISAL'];

export default function CycleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState(null);
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', variant: 'primary' });

  const load = async () => {
    setLoading(true);
    try {
      const rCycle = await cycleAPI.getById(id);
      setCycle(rCycle.data.cycle);
      setForm({
        name: rCycle.data.cycle.name,
        year: rCycle.data.cycle.year,
        phase: rCycle.data.cycle.phase,
        status: rCycle.data.cycle.status,
        startDate: rCycle.data.cycle.startDate.split('T')[0],
        endDate: rCycle.data.cycle.endDate.split('T')[0],
        description: rCycle.data.cycle.description || '',
        kpaWeight: rCycle.data.cycle.kpaWeight,
        valuesWeight: rCycle.data.cycle.valuesWeight,
        competenciesWeight: rCycle.data.cycle.competenciesWeight
      });

      const [progress, distribution] = await Promise.all([
        reportAPI.progress(id),
        reportAPI.distribution(id)
      ]);
      setStats({ progress: progress.data, distribution: distribution.data.distribution });
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to load cycle details.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const totalWeight = Number(form.kpaWeight) + Number(form.valuesWeight) + Number(form.competenciesWeight);
    if (totalWeight !== 100) {
      return setMsg({ type: 'error', text: `Weights must total 100. Current: ${totalWeight}` });
    }
    
    setUpdating(true);
    try {
      const data = {
        ...form,
        kpaWeight: parseFloat(form.kpaWeight),
        valuesWeight: parseFloat(form.valuesWeight),
        competenciesWeight: parseFloat(form.competenciesWeight)
      };
      await cycleAPI.update(id, data);
      setMsg({ type: 'success', text: 'Cycle updated successfully.' });
      setShowEdit(false);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAdvance = async () => {
    try {
      const res = await cycleAPI.getPendingWork(id);
      const pendingWork = res.data;
      
      let message = 'Advance to the next phase?';
      if (pendingWork.pendingCount > 0) {
        const names = pendingWork.pendingEmployees;
        const displayNames = names.length > 3 ? names.slice(0, 3).join(', ') + `, and ${names.length - 3} others` : names.join(', ');
        message = `${pendingWork.pendingCount} employees (${displayNames}) have not completed their work for the current phase yet. Are you sure you still want to advance?`;
      }

      setModalConfig({
        isOpen: true,
        title: 'Advance Phase',
        message: message,
        confirmText: 'Advance Phase',
        variant: 'warning',
        onConfirm: async () => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          try {
            await cycleAPI.advancePhase(id);
            setMsg({ type: 'success', text: 'Phase advanced.' });
            load();
          } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to advance phase' });
          }
        }
      });
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to fetch pending work status.' });
    }
  };

  const handleFinalizeAll = () => {
    setModalConfig({
      isOpen: true,
      title: 'Finalize Appraisals',
      message: 'Finalize all ACCEPTING_DONE appraisals? This action will formally close the appraisal evaluations.',
      confirmText: 'Finalize All',
      variant: 'success',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        try {
          const r = await appraisalAPI.finalizeAll(id);
          setMsg({ type: 'success', text: `Finalized ${r.data.finalized} appraisals.` });
        } catch (err) {
          setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
        }
      }
    });
  };

  const handleClose = () => {
    setModalConfig({
      isOpen: true,
      title: 'Close Cycle',
      message: 'Are you sure you want to close this cycle? This will lock it permanently.',
      confirmText: 'Close Cycle',
      variant: 'warning',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await cycleAPI.close(id);
          setMsg({ type: 'success', text: 'Cycle closed.' });
          load();
        } catch (err) {
          setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
        }
      }
    });
  };

  const handleDelete = () => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Cycle',
      message: 'Are you absolutely sure? This will delete the cycle and all related data permanently.',
      confirmText: 'Delete Permanently',
      variant: 'danger',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await cycleAPI.delete(id);
          navigate('/hr/cycles');
        } catch (err) {
          setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete' });
        }
      }
    });
  };

  if (loading) {
    return <Layout><div style={{ padding: 40, textAlign: 'center', color: '#A0785A' }}>Loading...</div></Layout>;
  }

  if (!cycle) {
    return <Layout><div style={{ padding: 40, textAlign: 'center', color: '#8B3A3A' }}>Cycle not found.</div></Layout>;
  }

  return (
    <Layout>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/hr/cycles')} style={{ background: 'none', border: 'none', color: '#6F4E37', cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>&larr; Back</button>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#3C2415', letterSpacing: '-0.01em' }}>{cycle.name} Details</h1>
      </div>

      <Alert type={msg.type || 'info'} message={msg.text} />

      {/* Action Buttons */}
      <Card style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button variant="secondary" onClick={() => setShowEdit(!showEdit)}>{showEdit ? 'Cancel Edit' : 'Edit Cycle'}</Button>
        {cycle.status === 'ACTIVE' && (
          <>
            <Button variant="warning" onClick={handleAdvance}>Advance Phase</Button>
            <Button variant="success" onClick={handleFinalizeAll}>Finalize All</Button>
            <Button variant="danger" onClick={handleClose}>Close Cycle</Button>
          </>
        )}
        <Button style={{ background: '#8B3A3A', color: 'white', border: 'none' }} onClick={handleDelete}>Delete Cycle</Button>
      </Card>

      {/* Edit Form */}
      {showEdit && (
        <Card title="Edit Appraisal Cycle" style={{ marginBottom: 20 }}>
          <form onSubmit={handleUpdate}>
            <div style={gridStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Cycle Name (Locked)</label>
                <input style={{...inputStyle, background: '#FAF8F4', color: '#A0785A', cursor: 'not-allowed'}} value={form.name} disabled />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Year (Locked)</label>
                <input type="number" style={{...inputStyle, background: '#FAF8F4', color: '#A0785A', cursor: 'not-allowed'}} value={form.year} disabled />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Start Date (Locked)</label>
                <input type="date" style={{...inputStyle, background: '#FAF8F4', color: '#A0785A', cursor: 'not-allowed'}} value={form.startDate} disabled />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>End Date *</label>
                <input type="date" style={inputStyle} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Phase (Locked)</label>
                <select style={{...inputStyle, background: '#FAF8F4', color: '#A0785A', cursor: 'not-allowed'}} value={form.phase} disabled>
                  {PHASES.map((p) => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>
            
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: '16px 0 10px', color: '#3C2415' }}>Score Weights (%)</h4>
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
            
            <div style={{ marginTop: 16 }}>
              <Button type="submit" loading={updating}>Update Cycle</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Basic Info */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Badge label={cycle.status} />
          <Badge label={cycle.phase} />
          <span style={{ fontSize: 14, color: '#6F4E37' }}>Year: {cycle.year}</span>
        </div>
        <div style={{ fontSize: 14, color: '#3C2415', marginBottom: 16 }}>
          <strong>Timeline:</strong> {new Date(cycle.startDate).toLocaleDateString()} – {new Date(cycle.endDate).toLocaleDateString()}
        </div>
        {cycle.description && <p style={{ fontSize: 14, color: '#6F4E37', marginBottom: 16 }}>{cycle.description}</p>}

        {/* Phase Timeline Tracker */}
        <div style={{ display: 'flex', gap: 0, marginTop: 16, border: '1px solid #E8DCC8', borderRadius: 8, overflow: 'hidden' }}>
          {PHASES.map((p, i) => {
            const isCurrentOrPast = PHASES.indexOf(cycle.phase) >= i;
            return (
              <div key={p} style={{
                flex: 1, padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600,
                background: p === cycle.phase ? '#3C2415' : isCurrentOrPast ? '#E8DCC8' : '#FAF8F4',
                color: p === cycle.phase ? '#fff' : isCurrentOrPast ? '#3C2415' : '#A0785A',
                borderRight: i < PHASES.length - 1 ? '1px solid #E8DCC8' : 'none',
              }}>
                {p.replace(/_/g, ' ')}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Statistics */}
      {stats && (
        <div style={gridStyle}>
          <Card title="Goal Setting">
            {Object.entries(stats.progress?.progress?.goalProgress || {}).map(([status, count]) => (
              <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F5F0E8' }}>
                <Badge label={status} />
                <span style={{ fontWeight: 600, color: '#3C2415' }}>{count}</span>
              </div>
            ))}
          </Card>

          <Card title="Mid-Year Review">
            {Object.entries(stats.progress?.progress?.midYearProgress || {}).map(([status, count]) => (
              <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F5F0E8' }}>
                <Badge label={status} />
                <span style={{ fontWeight: 600, color: '#3C2415' }}>{count}</span>
              </div>
            ))}
          </Card>

          <Card title="Annual Appraisal">
            {Object.entries(stats.progress?.progress?.appraisalProgress || {}).map(([status, count]) => (
              <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F5F0E8' }}>
                <Badge label={status} />
                <span style={{ fontWeight: 600, color: '#3C2415' }}>{count}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      <ConfirmModal 
        {...modalConfig} 
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />
    </Layout>
  );
}

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 };
const fieldStyle = {};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#6F4E37', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1.5px solid #C4A882', borderRadius: 8, fontSize: 14, color: '#3C2415', fontFamily: "'Inter', sans-serif" };
