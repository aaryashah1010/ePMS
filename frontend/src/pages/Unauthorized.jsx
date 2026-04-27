import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const REDIRECTS = {
  EMPLOYEE: '/employee/dashboard',
  REPORTING_OFFICER: '/officer/dashboard',
  REVIEWING_OFFICER: '/officer/dashboard',
  ACCEPTING_OFFICER: '/officer/dashboard',
  HR: '/hr/dashboard',
};

export default function Unauthorized() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const to = REDIRECTS[user?.role] || '/login';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5F0E8' }}>
      <div style={{ textAlign: 'center', background: '#FFFFFF', padding: '48px 40px', borderRadius: 16, boxShadow: '0 4px 20px rgba(60,36,21,0.08)', border: '1px solid #E8DCC8' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#8B3A3A', marginBottom: 8 }}>Access Denied</h1>
        <p style={{ color: '#6F4E37', marginBottom: 24 }}>You don't have permission to view this page.</p>
        <button onClick={() => navigate(to)}
          style={{ padding: '10px 24px', background: '#3C2415', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
