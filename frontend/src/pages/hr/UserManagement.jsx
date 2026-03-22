import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import { userAPI } from '../../services/api';

const ROLES = ['EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER', 'HR'];
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

  const officers = users.filter((u) => ['REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER', 'HR'].includes(u.role));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const data = { ...form };
      if (!data.reportingOfficerId) delete data.reportingOfficerId;
      if (!data.reviewingOfficerId) delete data.reviewingOfficerId;
      if (!data.acceptingOfficerId) delete data.acceptingOfficerId;
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
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>User Management</h1>
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
                <label style={labelStyle}>Department</label>
                <input style={inputStyle} value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g., Engineering" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Employee Code</label>
                <input style={inputStyle} value={form.employeeCode || ''} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} placeholder="e.g., EMP001" />
              </div>
              {form.role === 'EMPLOYEE' && (
                <>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Reporting Officer</label>
                    <select style={inputStyle} value={form.reportingOfficerId || ''} onChange={(e) => setForm({ ...form, reportingOfficerId: e.target.value })}>
                      <option value="">-- None --</option>
                      {officers.filter((o) => o.role === 'REPORTING_OFFICER').map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Reviewing Officer</label>
                    <select style={inputStyle} value={form.reviewingOfficerId || ''} onChange={(e) => setForm({ ...form, reviewingOfficerId: e.target.value })}>
                      <option value="">-- None --</option>
                      {officers.filter((o) => o.role === 'REVIEWING_OFFICER').map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Accepting Officer</label>
                    <select style={inputStyle} value={form.acceptingOfficerId || ''} onChange={(e) => setForm({ ...form, acceptingOfficerId: e.target.value })}>
                      <option value="">-- None --</option>
                      {officers.filter((o) => o.role === 'ACCEPTING_OFFICER').map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
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
                {['Name', 'Email', 'Code', 'Role', 'Department', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={trStyle}>
                  <td style={tdStyle}><strong>{u.name}</strong></td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>{u.employeeCode || '—'}</td>
                  <td style={tdStyle}><Badge label={u.role} /></td>
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
      </Card>
    </Layout>
  );
}

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 14 };
const fieldStyle = {};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 };
const inputStyle = { width: '100%', padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14 };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thRowStyle = { background: '#f8fafc' };
const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', borderBottom: '2px solid #e2e8f0' };
const trStyle = { borderBottom: '1px solid #f1f5f9' };
const tdStyle = { padding: '12px', fontSize: 13 };
