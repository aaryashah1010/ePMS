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
  MANAGING_DIRECTOR: [
    { to: '/ceo/dashboard', label: 'Dashboard' },
    { to: '/ceo/users', label: 'Manage HRs' },
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

  if (user?.role === 'MANAGING_DIRECTOR') {
    links = NAV_LINKS.MANAGING_DIRECTOR;
    positionLabel = 'Managing Director';
  } else if (user?.role === 'HR') {
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
            {positionLabel && <div style={{ fontSize: 11, color: '#C4A882' }}>{positionLabel}</div>}
          </div>
          <span style={{ marginLeft: 6 }}>▾</span>
        </button>
        {open && (
          <div style={dropdownStyle}>
            <div style={dropItemInfoStyle}>
              <div style={{ fontWeight: 600, color: '#3C2415' }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: '#A0785A' }}>{user?.email}</div>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #E8DCC8' }} />
            <button style={dropItemStyle} onClick={handleLogout}>Sign Out</button>
          </div>
        )}
      </div>
    </nav>
  );
}

const navStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  background: '#3C2415', color: '#fff', padding: '0 24px', height: 60,
  position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(60,36,21,0.25)',
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
};
const brandStyle = { display: 'flex', alignItems: 'center', gap: 10 };
const logoStyle = { fontSize: 22, fontWeight: 800, color: '#A0785A', letterSpacing: 1.5 };
const tagStyle = { fontSize: 12, color: '#C4A882' };
const linksStyle = { display: 'flex', gap: 4 };
const linkStyle = { color: '#E8DCC8', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500, transition: 'all 0.2s ease' };
const activeLinkStyle = { background: 'rgba(160,120,90,0.2)', color: '#F5F0E8', fontWeight: 600 };
const userMenuStyle = { position: 'relative' };
const userBtnStyle = {
  display: 'flex', alignItems: 'center', gap: 10, background: 'transparent',
  border: '1px solid rgba(200,168,130,0.3)', borderRadius: 10, padding: '6px 12px',
  color: '#fff', cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
};
const avatarStyle = {
  width: 32, height: 32, background: '#A0785A', borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, fontSize: 14, flexShrink: 0, color: '#FFFFFF',
};
const dropdownStyle = {
  position: 'absolute', right: 0, top: '110%', background: '#FAF8F4', color: '#3C2415',
  borderRadius: 12, boxShadow: '0 8px 24px rgba(60,36,21,0.15)', minWidth: 200,
  padding: '8px 0', zIndex: 200, border: '1px solid #E8DCC8',
};
const dropItemInfoStyle = { padding: '10px 16px' };
const dropItemStyle = {
  display: 'block', width: '100%', padding: '10px 16px', background: 'none',
  border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14, color: '#8B3A3A',
  fontWeight: 500, fontFamily: "'Inter', sans-serif",
};
