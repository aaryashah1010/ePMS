import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import ConfirmModal from '../../components/ConfirmModal';
import { attributeAPI } from '../../services/api';

const EMPTY_FORM = { name: '', type: 'VALUES', description: '' };

export default function AttributeManagement() {
  const [attributes, setAttributes] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', variant: 'primary' });

  const load = () => attributeAPI.getAll().then((r) => setAttributes(r.data.attributes || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await attributeAPI.update(editId, form);
        setMsg({ type: 'success', text: 'Attribute updated.' });
      } else {
        await attributeAPI.create(form);
        setMsg({ type: 'success', text: 'Attribute created.' });
      }
      setForm(EMPTY_FORM); setEditId(null); setShowForm(false); load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
    } finally { setLoading(false); }
  };

  const handleDeactivate = (id) => {
    setModalConfig({
      isOpen: true,
      title: 'Deactivate Attribute',
      message: 'Are you sure you want to deactivate this attribute? It will no longer be available for new cycles.',
      confirmText: 'Deactivate',
      variant: 'danger',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        try {
          await attributeAPI.delete(id);
          setMsg({ type: 'success', text: 'Deactivated.' });
          load();
        } catch { setMsg({ type: 'error', text: 'Failed' }); }
      }
    });
  };

  const values = attributes.filter((a) => a.type === 'VALUES');
  const competencies = attributes.filter((a) => a.type === 'COMPETENCIES');

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#3C2415', letterSpacing: '-0.01em' }}>Attribute Master</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY_FORM); }}>
          {showForm ? 'Cancel' : '+ New Attribute'}
        </Button>
      </div>

      <Alert type={msg.type || 'info'} message={msg.text} />

      {showForm && (
        <Card title={editId ? 'Edit Attribute' : 'Create Attribute'} style={{ marginBottom: 20 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>Type *</label>
                <select style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="VALUES">Values</option>
                  <option value="COMPETENCIES">Competencies</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, height: 60, resize: 'vertical' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" loading={loading}>{editId ? 'Update' : 'Create'}</Button>
              <Button variant="secondary" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {[{ label: 'Values', list: values, color: '#8B6914' }, { label: 'Competencies', list: competencies, color: '#4A7C59' }].map(({ label, list, color }) => (
          <Card key={label} title={`${label} (${list.length})`}>
            {list.length === 0 ? (
              <p style={{ color: '#A0785A', textAlign: 'center', padding: 20 }}>No {label.toLowerCase()} added yet.</p>
            ) : (
              list.map((a) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F5F0E8' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: a.isActive ? '#3C2415' : '#A0785A' }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: '#6F4E37', marginTop: 2 }}>{a.description}</div>
                    {!a.isActive && <span style={{ fontSize: 11, color: '#8B3A3A', fontWeight: 600 }}>Inactive</span>}
                  </div>
                  {a.isActive && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button size="sm" variant="outline" onClick={() => { setEditId(a.id); setForm({ name: a.name, type: a.type, description: a.description || '' }); setShowForm(true); }}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDeactivate(a.id)}>Deactivate</Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </Card>
        ))}
      </div>
      <ConfirmModal 
        {...modalConfig} 
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />
    </Layout>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#6F4E37', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1.5px solid #C4A882', borderRadius: 8, fontSize: 14, color: '#3C2415', fontFamily: "'Inter', sans-serif" };
