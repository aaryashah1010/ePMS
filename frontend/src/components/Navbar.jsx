import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = {
  HR: [
    { to: '/hr/dashboard', label: 'Dashboard' },
    { to: '/hr/cycles', label: 'Cycles' },
    { to: '/hr/users', label: 'Users' },
    { to: '/hr/reports', label: 'Reports' },
    { to: '/hr/attributes', label: 'Attributes' },
  ],
  EMPLOYEE_SPACE: [
    { to: '/employee/dashboard', label: 'Home' },
    { to: '/employee/summary', label: 'My Appraisal Space' },
    { to: '/employee/goals', label: 'Goal Setting' },
    { to: '/employee/mid-year', label: 'Mid-Year' },
    { to: '/employee/appraisal', label: 'Annual Appraisal' },
  ],
  OFFICER_SPACE: [
    { to: '/employee/dashboard', label: 'Home' },
    { to: '/officer/dashboard', label: 'Team Dashboard' },
    { to: '/officer/goals', label: 'Goal Review' },
    { to: '/officer/mid-year', label: 'Team Mid-Year' },
    { to: '/officer/ratings', label: 'Rate Team' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Determine which links to show
  let links = [];
  let positionLabel = '';

  if (user?.role === 'HR') {
    links = NAV_LINKS.HR;
    positionLabel = 'HR Admin';
  } else {
    // For all other roles (treated as EMPLOYEE)
    if (location.pathname === '/employee/dashboard') {
      links = [{ to: '/employee/dashboard', label: 'Home' }];
      positionLabel = '';
    } else if (location.pathname.startsWith('/officer/')) {
      const parts = location.pathname.split('/');
      const roleType = parts[2]; // reporting, reviewing, accepting
      
      let contextualTarget = 'Reportees';
      let title = 'Reporting Officer';
      if (roleType === 'reviewing') { contextualTarget = 'Reviewees'; title = 'Reviewing Officer'; }
      if (roleType === 'accepting') { contextualTarget = 'Appraisees'; title = 'Accepting Officer'; }

      links = [
        { to: '/employee/dashboard', label: 'Home' },
        { to: `/officer/${roleType}/dashboard`, label: `${contextualTarget} Dashboard` },
        { to: `/officer/${roleType}/goals`, label: 'Goal Review' },
        { to: `/officer/${roleType}/mid-year`, label: `${contextualTarget} Mid-Year` },
        { to: `/officer/${roleType}/ratings`, label: `Rate ${contextualTarget}` },
      ];
      positionLabel = title;
    } else {
      links = NAV_LINKS.EMPLOYEE_SPACE;
      positionLabel = '';
    }
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={navStyle}>
      <div style={brandStyle}>
        <span style={logoStyle}>e-PMS</span>
        <span style={tagStyle}>Performance Management</span>
      </div>

      <div style={linksStyle}>
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            style={{ 
              ...linkStyle, 
              ...(location.pathname === link.to || (link.to !== '/employee/dashboard' && location.pathname.startsWith(link.to)) ? activeLinkStyle : {}) 
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div style={userMenuStyle}>
        <button style={userBtnStyle} onClick={() => setOpen(!open)}>
          <span style={avatarStyle}>{user?.name?.charAt(0)}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.name}</div>
            {positionLabel && <div style={{ fontSize: 11, color: '#94a3b8' }}>{positionLabel}</div>}
          </div>
          <span style={{ marginLeft: 6 }}>▾</span>
        </button>
        {open && (
          <div style={dropdownStyle}>
            <div style={dropItemInfoStyle}>
              <div style={{ fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{user?.email}</div>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />
            <button style={dropItemStyle} onClick={handleLogout}>Sign Out</button>
          </div>
        )}
      </div>
    </nav>
  );
}

const navStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  background: '#1e3a5f', color: '#fff', padding: '0 24px', height: 60,
  position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
};
const brandStyle = { display: 'flex', alignItems: 'center', gap: 10 };
const logoStyle = { fontSize: 22, fontWeight: 800, color: '#60a5fa', letterSpacing: 1 };
const tagStyle = { fontSize: 12, color: '#94a3b8' };
const linksStyle = { display: 'flex', gap: 4 };
const linkStyle = { color: '#cbd5e1', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 14, fontWeight: 500, transition: 'background 0.15s' };
const activeLinkStyle = { background: 'rgba(96,165,250,0.2)', color: '#60a5fa' };
const userMenuStyle = { position: 'relative' };
const userBtnStyle = {
  display: 'flex', alignItems: 'center', gap: 10, background: 'transparent',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 12px',
  color: '#fff', cursor: 'pointer',
};
const avatarStyle = {
  width: 32, height: 32, background: '#3b82f6', borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, fontSize: 14, flexShrink: 0,
};
const dropdownStyle = {
  position: 'absolute', right: 0, top: '110%', background: '#fff', color: '#1e293b',
  borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: 200,
  padding: '8px 0', zIndex: 200,
};
const dropItemInfoStyle = { padding: '10px 16px' };
const dropItemStyle = {
  display: 'block', width: '100%', padding: '10px 16px', background: 'none',
  border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14, color: '#ef4444',
  fontWeight: 500,
};
