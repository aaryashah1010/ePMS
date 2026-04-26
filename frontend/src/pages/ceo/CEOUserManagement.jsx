import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import { userAPI } from '../../services/api';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'HR', department: 'Human Resources', employeeCode: '' };

export default function CEOUserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const load = () => userAPI.getAll({ role: 'HR' }).then((r) => setUsers((r.data.users || []).filter(u => u.role === 'HR'))).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const data = { ...form, role: 'HR' }; // Always HR
      if (!data.employeeCode) delete data.employeeCode;
      // Officers are auto-assigned by backend
      delete data.reportingOfficerId;
      delete data.reviewingOfficerId;
      delete data.acceptingOfficerId;

      if (editId) {
        if (!data.password) delete data.password;
        delete data.role; // Don't change role on edit
        await userAPI.update(editId, data);
        setMsg({ type: 'success', text: 'HR user updated.' });
      } else {
        await userAPI.create(data);
        setMsg({ type: 'success', text: 'HR account created. Officers auto-assigned to Managing Director.' });
      }
      setForm(EMPTY_FORM); setEditId(null); setShowForm(false); load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
    } finally { setLoading(false); }
  };

  const handleEdit = (u) => {
    setEditId(u.id);
    setForm({ name: u.name, email: u.email, password: '', role: 'HR', department: u.department || 'Human Resources', employeeCode: u.employeeCode || '' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggle = async (u) => {
    try {
      await userAPI.update(u.id, { isActive: !u.isActive });
      setMsg({ type: 'success', text: `HR user ${u.isActive ? 'deactivated' : 'activated'}.` });
      load();
    } catch { setMsg({ type: 'error', text: 'Failed' }); }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Manage HR Accounts</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Create and manage HR personnel. All HRs automatically report to you.</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY_FORM); }}>
          {showForm && !editId ? 'Cancel' : '+ New HR User'}
        </Button>
      </div>

      <Alert type={msg.type || 'info'} message={msg.text} />

      {showForm && (
        <Card title={editId ? 'Edit HR User' : 'Create New HR Account'} style={{ marginBottom: 20 }}>
          <div style={{ padding: '8px 12px', background: '#eff6ff', borderRadius: 8, marginBottom: 14, fontSize: 13, color: '#1e40af' }}>
            ℹ️ HR users are automatically assigned to the Managing Director as their Reporting, Reviewing, and Accepting Officer.
          </div>
          <form onSubmit={handleSubmit}>
            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>{editId ? 'New Password (leave blank)' : 'Password *'}</label>
                <input type="password" style={inputStyle} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editId} placeholder={editId ? 'Leave blank to keep' : ''} />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <input style={{ ...inputStyle, background: '#f1f5f9', cursor: 'not-allowed' }} value="HR" readOnly />
              </div>
              <div>
                <label style={labelStyle}>Department</label>
                <input style={inputStyle} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Employee Code</label>
                <input style={inputStyle} value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} placeholder="e.g., HR002" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Button type="submit" loading={loading}>{editId ? 'Update' : 'Create HR Account'}</Button>
              <Button variant="secondary" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`HR Users (${users.length})`}>
        {users.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 14 }}>No HR users found. Click "+ New HR User" to create one.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr style={thRowStyle}>
                  {['Name', 'Email', 'Code', 'Department', 'Status', 'Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={trStyle}>
                    <td style={tdStyle}><strong>{u.name}</strong></td>
                    <td style={tdStyle}>{u.email}</td>
                    <td style={tdStyle}>{u.employeeCode || '—'}</td>
                    <td style={tdStyle}>{u.department || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{ color: u.isActive ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: 13 }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(u)}>Edit</Button>
                        <Button size="sm" variant={u.isActive ? 'danger' : 'success'} onClick={() => handleToggle(u)}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Layout>
  );
}

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 14 };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14 };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thRowStyle = { background: '#f8fafc' };
const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', borderBottom: '2px solid #e2e8f0' };
const trStyle = { borderBottom: '1px solid #f1f5f9' };
const tdStyle = { padding: '12px', fontSize: 13 };
