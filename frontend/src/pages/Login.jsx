import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import api from '../services/api';

const ROLE_REDIRECTS = {
  EMPLOYEE: '/employee/dashboard',
  REPORTING_OFFICER: '/employee/dashboard',
  REVIEWING_OFFICER: '/employee/dashboard',
  ACCEPTING_OFFICER: '/employee/dashboard',
  HR: '/hr/dashboard',
  MANAGING_DIRECTOR: '/ceo/dashboard',
};

const ROLE_ICON = {
  MANAGING_DIRECTOR: 'admin_panel_settings',
  HR: 'psychology',
  EMPLOYEE: 'person',
  REPORTING_OFFICER: 'assignment_ind',
  REVIEWING_OFFICER: 'rate_review',
  ACCEPTING_OFFICER: 'verified',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState([]);

  useEffect(() => {
    // Fetch current accounts from backend
    api.get('/auth/demo-accounts')
      .then(r => {
        const accounts = r.data.accounts || [];
        // Build short labels: CEO, HR1, HR2, EMP1, EMP2, etc.
        const counters = {};
        const labeled = accounts.map(a => {
          let prefix;
          if (a.role === 'MANAGING_DIRECTOR') prefix = 'CEO';
          else if (a.role === 'HR') prefix = 'HR';
          else prefix = 'EMP';
          
          counters[prefix] = (counters[prefix] || 0) + 1;
          const label = counters[prefix] === 1 && prefix === 'CEO' ? 'CEO' : `${prefix}${counters[prefix]}`;
          return { ...a, label, pass: '123456' };
        });
        setDemoAccounts(labeled);
      })
      .catch(() => {});
  }, []);

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
      {/* Split panel layout */}
      <div style={splitContainerStyle}>
        {/* Left branding panel */}
        <div style={leftPanelStyle}>
          <div style={leftOverlayStyle} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#fff' }}>donut_small</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>e-PMS</span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 12 }}>
              Performance Management
            </h1>
            <p style={{ fontSize: 16, color: '#E8DCC8', lineHeight: 1.6, maxWidth: 340 }}>
              Empowering teams with clear goals, structured feedback, and actionable insights to drive organizational success.
            </p>
          </div>
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, color: '#E8DCC8' }}>
              <span style={{ fontWeight: 600, color: '#fff' }}>Trusted by</span><br />
              industry leaders
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div style={rightPanelStyle}>
          <div style={{ marginBottom: 24 }}>
            {/* Mobile-only branding */}
            <div style={mobileBrandStyle}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#3C2415' }}>donut_small</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#3C2415' }}>e-PMS</span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#3C2415', marginBottom: 8, letterSpacing: '-0.01em' }}>Welcome back</h2>
            <p style={{ color: '#6F4E37', fontSize: 16 }}>Please enter your credentials to access your portal.</p>
          </div>

          <Alert type="error" message={error} />

          <form onSubmit={handleSubmit}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@company.com"
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
              {loading ? 'Signing in...' : 'Log In'}
              {!loading && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>}
            </button>
          </form>

          {demoAccounts.length > 0 && (
            <div style={hintsStyle}>
              <p style={{ fontSize: 12, color: '#6F4E37', marginBottom: 10, fontWeight: 600 }}>Quick-fill Demo Accounts:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {demoAccounts.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    style={quickBtnStyle}
                    onClick={() => setForm({ email: a.email, password: '123456' })}
                    title={`${a.name} (${a.email})`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{ROLE_ICON[a.role] || 'person'}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#F5F0E8', padding: 16,
};
const splitContainerStyle = {
  width: '100%', maxWidth: 1000, display: 'flex',
  background: '#FFFFFF', borderRadius: 14,
  boxShadow: '0 20px 40px rgba(60,36,21,0.06)',
  overflow: 'hidden',
};
const leftPanelStyle = {
  width: '50%', background: '#3C2415', position: 'relative',
  padding: 48, display: 'flex', flexDirection: 'column',
  justifyContent: 'space-between', minHeight: 520,
};
const leftOverlayStyle = {
  position: 'absolute', inset: 0,
  background: 'linear-gradient(to top, #3C2415 0%, transparent 100%)',
  opacity: 0.8, zIndex: 1,
};
const mobileBrandStyle = {
  display: 'none', /* hidden on desktop, shown via media query if needed */
  alignItems: 'center', gap: 8, marginBottom: 20,
};
const rightPanelStyle = {
  width: '50%', display: 'flex', flexDirection: 'column',
  justifyContent: 'center', padding: '40px 48px',
};
const fieldStyle = { marginBottom: 14 };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#6F4E37', marginBottom: 6 };
const inputStyle = {
  width: '100%', padding: '12px 16px', border: '1.5px solid #D4C3BB',
  borderRadius: 10, fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
  background: '#FAF8F4', color: '#3C2415', fontFamily: "'Inter', sans-serif",
};
const btnStyle = {
  width: '100%', padding: '12px', background: '#3C2415', color: '#fff',
  border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
  cursor: 'pointer', marginTop: 8, transition: 'all 0.2s',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  fontFamily: "'Inter', sans-serif", letterSpacing: '0.01em',
};
const hintsStyle = {
  marginTop: 24, paddingTop: 20, borderTop: '1px solid #E8DCC8',
};
const quickBtnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: '#FAF8F4', border: '1px solid #D4C3BB', padding: '6px 12px',
  borderRadius: 20, fontSize: 12, color: '#6F4E37', fontWeight: 500,
  cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
};
