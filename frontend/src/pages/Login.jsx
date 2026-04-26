import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

const ROLE_REDIRECTS = {
  EMPLOYEE: '/employee/dashboard',
  REPORTING_OFFICER: '/employee/dashboard',
  REVIEWING_OFFICER: '/employee/dashboard',
  ACCEPTING_OFFICER: '/employee/dashboard',
  HR: '/hr/dashboard',
  MANAGING_DIRECTOR: '/ceo/dashboard',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(ROLE_REDIRECTS[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={logoStyle}>e-PMS</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '12px 0 4px' }}>Welcome Back</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Electronic Performance Management System</p>
        </div>

        <Alert type="error" message={error} />

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@epms.com"
              required
              style={inputStyle}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={hintsStyle}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>Demo Accounts:</p>
          {[
            ['CEO (MD)', 'ceo@epms.com', 'ceo@123'],
            ['HR Admin', 'hr@epms.com', 'hr@123'],
            ['Alice (Employee)', 'alice@epms.com', 'alice@123'],
            ['Bob (Reporting Officer)', 'bob@epms.com', 'bob@123'],
            ['Carol (Reviewing Officer)', 'carol@epms.com', 'carol@123'],
            ['Dave (Accepting Officer)', 'dave@epms.com', 'dave@123'],
          ].map(([role, email, pass]) => (
            <button
              key={email}
              type="button"
              style={quickBtnStyle}
              onClick={() => setForm({ email, password: pass })}
            >
              <strong>{role}</strong> · {email}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
};
const cardStyle = {
  background: '#fff', borderRadius: 16, padding: '40px 36px',
  width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
};
const headerStyle = { textAlign: 'center', marginBottom: 28 };
const logoStyle = {
  display: 'inline-block', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
  color: '#fff', fontSize: 28, fontWeight: 900, padding: '8px 20px',
  borderRadius: 10, letterSpacing: 2,
};
const fieldStyle = { marginBottom: 16 };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const inputStyle = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db',
  borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border 0.2s',
};
const btnStyle = {
  width: '100%', padding: '12px', background: '#2563eb', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700,
  cursor: 'pointer', marginTop: 4, transition: 'background 0.2s',
};
const hintsStyle = {
  marginTop: 24, padding: '16px', background: '#f8fafc',
  borderRadius: 8, border: '1px solid #e2e8f0',
};
const quickBtnStyle = {
  display: 'block', width: '100%', textAlign: 'left', background: 'none',
  border: 'none', padding: '6px 0', fontSize: 12, color: '#2563eb',
  cursor: 'pointer', borderBottom: '1px solid #e2e8f0',
};
