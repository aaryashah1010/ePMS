import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import { userAPI } from '../../services/api';

const ROLES = ['EMPLOYEE'];
const EMPTY_FORM = { name: '', email: '', password: '', role: 'EMPLOYEE', department: '', employeeCode: '', reportingOfficerId: '', reviewingOfficerId: '', acceptingOfficerId: '' };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => userAPI.getAll().then((r) => setUsers(r.data.users || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const officers = users.filter((u) => u.role !== 'HR' && u.role !== 'MANAGING_DIRECTOR');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const data = { ...form };
      if (editId) {
        // On update: send null to clear officer assignments
        if (!data.reportingOfficerId) data.reportingOfficerId = null;
        if (!data.reviewingOfficerId) data.reviewingOfficerId = null;
        if (!data.acceptingOfficerId) data.acceptingOfficerId = null;
      } else {
        // On create: omit empty fields
        if (!data.reportingOfficerId) delete data.reportingOfficerId;
        if (!data.reviewingOfficerId) delete data.reviewingOfficerId;
        if (!data.acceptingOfficerId) delete data.acceptingOfficerId;
      }
      if (!data.employeeCode) delete data.employeeCode;
      if (editId) {
        if (!data.password) delete data.password;
        await userAPI.update(editId, data);
        setMsg({ type: 'success', text: 'User updated.' });
      } else {
        await userAPI.create(data);
        setMsg({ type: 'success', text: 'User created.' });
      }
      setForm(EMPTY_FORM); setEditId(null); setShowForm(false); load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
    } finally { setLoading(false); }
  };

  const handleEdit = (u) => {
    setEditId(u.id);
    setForm({ ...u, password: '' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggle = async (u) => {
    try {
      await userAPI.update(u.id, { isActive: !u.isActive });
      setMsg({ type: 'success', text: `User ${u.isActive ? 'deactivated' : 'activated'}.` });
      load();
    } catch { setMsg({ type: 'error', text: 'Failed' }); }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#3C2415', letterSpacing: '-0.01em' }}>User Management</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY_FORM); }}>
          {showForm && !editId ? 'Cancel' : '+ New User'}
        </Button>
      </div>

      <Alert type={msg.type || 'info'} message={msg.text} />

      {showForm && (
        <Card title={editId ? 'Edit User' : 'Create New User'} style={{ marginBottom: 20 }}>
          <form onSubmit={handleSubmit}>
            <div style={gridStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Email *</label>
                <input type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>{editId ? 'New Password (leave blank)' : 'Password *'}</label>
                <input type="password" style={inputStyle} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editId} placeholder={editId ? 'Leave blank to keep' : ''} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Role *</label>
                <select style={inputStyle} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Department *</label>
                <input style={inputStyle} value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g., Engineering" required />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Employee Code *</label>
                <input style={{ ...inputStyle, ...(editId ? { background: '#FAF8F4', color: '#A0785A', cursor: 'not-allowed' } : {}) }} value={form.employeeCode || ''} onChange={(e) => setForm({ ...form, employeeCode: e.target.value.toUpperCase() })} placeholder="e.g., EMP001" required pattern="^[A-Z]{2,4}\d{3,}$" title="Format: 2-4 letters followed by 3+ digits (e.g., EMP001)" readOnly={!!editId} />
              </div>
              {form.role !== 'HR' && form.role !== 'MANAGING_DIRECTOR' && (
                <>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Reporting Officer</label>
                    <select style={inputStyle} value={form.reportingOfficerId || ''} onChange={(e) => setForm({ ...form, reportingOfficerId: e.target.value })}>
                      <option value="">-- None --</option>
                      {officers.filter((o) => o.id !== editId).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Reviewing Officer</label>
                    <select style={inputStyle} value={form.reviewingOfficerId || ''} onChange={(e) => setForm({ ...form, reviewingOfficerId: e.target.value })}>
                      <option value="">-- None --</option>
                      {officers.filter((o) => o.id !== editId).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Accepting Officer</label>
                    <select style={inputStyle} value={form.acceptingOfficerId || ''} onChange={(e) => setForm({ ...form, acceptingOfficerId: e.target.value })}>
                      <option value="">-- None --</option>
                      {officers.filter((o) => o.id !== editId).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Button type="submit" loading={loading}>{editId ? 'Update User' : 'Create User'}</Button>
              <Button variant="secondary" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`All Users (${filtered.length})`}>
        <input
          style={{ ...inputStyle, marginBottom: 16, width: 300 }}
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={thRowStyle}>
                {['Name', 'Email', 'Code', 'Role', 'Department', 'Status', 'Officer Assignment', 'Actions'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={trStyle}>
                  <td style={tdStyle}><strong style={{ color: '#3C2415' }}>{u.name}</strong></td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>{u.employeeCode || '—'}</td>
                  <td style={tdStyle}><Badge label={u.role} /></td>
                  <td style={tdStyle}>{u.department || '—'}</td>
                  <td style={tdStyle}>
                    <span style={{ color: u.isActive ? '#4A7C59' : '#8B3A3A', fontWeight: 600, fontSize: 13 }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {u.role === 'MANAGING_DIRECTOR' ? (
                      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#F0FAF0', color: '#4A7C59', border: '1px solid #C8E6C9' }}>Done</span>
                    ) : u.role === 'HR' ? (
                      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#F0FAF0', color: '#4A7C59', border: '1px solid #C8E6C9' }}>Done</span>
                    ) : (() => {
                      const done = u.reportingOfficerId && u.reviewingOfficerId && u.acceptingOfficerId;
                      return (
                        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: done ? '#F0FAF0' : '#FDF0F0', color: done ? '#4A7C59' : '#8B3A3A', border: `1px solid ${done ? '#C8E6C9' : '#D4A0A0'}` }}>
                          {done ? 'Done' : 'Pending'}
                        </span>
                      );
                    })()}
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
      </Card>
    </Layout>
  );
}

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 14 };
const fieldStyle = {};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#6F4E37', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1.5px solid #C4A882', borderRadius: 8, fontSize: 14, color: '#3C2415', fontFamily: "'Inter', sans-serif" };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thRowStyle = { background: '#FAF8F4' };
const thStyle = { padding: '12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#3C2415', borderBottom: '2px solid #E8DCC8' };
const trStyle = { borderBottom: '1px solid #F5F0E8' };
const tdStyle = { padding: '12px', fontSize: 13, color: '#6F4E37' };
