import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import Alert from '../../components/Alert';

export default function LandingDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  const handleOfficerNavigation = async (roleType) => {
    setErrorMsg('');
    try {
      let res;
      if (roleType === 'reporting') res = await userAPI.getReportees();
      else if (roleType === 'reviewing') res = await userAPI.getReviewees();
      else if (roleType === 'accepting') res = await userAPI.getAppraisees();

      const employees = res?.data?.reportees || res?.data?.reviewees || res?.data?.appraisees || [];
      
      if (employees.length > 0) {
        navigate(`/officer/${roleType}/dashboard`);
      } else {
        const contextualTerm = roleType === 'reporting' ? 'reportees' : roleType === 'reviewing' ? 'reviewees' : 'appraisees';
        setErrorMsg(`Access Denied: You do not have any ${contextualTerm} assigned to you for this space.`);
      }
    } catch (error) {
      setErrorMsg('Failed to verify access. Please try again later.');
    }
  };

  const roleCards = [
    { key: 'employee', icon: 'person', label: 'Employee Space', desc: 'Manage your self-appraisal, view goals, and track your individual development plan.', gradient: 'linear-gradient(135deg, #FAF8F4, #E8DCC8)', iconColor: '#3C2415', onClick: () => navigate('/employee/summary') },
    { key: 'reporting', icon: 'assignment_ind', label: 'Reporting Officer', desc: 'Evaluate direct reports, provide continuous feedback, and draft initial ratings.', gradient: 'linear-gradient(135deg, #FFF8F3, #FFEBD3)', iconColor: '#8B6914', onClick: () => handleOfficerNavigation('reporting') },
    { key: 'reviewing', icon: 'rate_review', label: 'Reviewing Officer', desc: 'Normalize ratings across teams, resolve disputes, and ensure fair evaluations.', gradient: 'linear-gradient(135deg, #FFFFFF, #F5EDE0)', iconColor: '#A0785A', onClick: () => handleOfficerNavigation('reviewing') },
    { key: 'accepting', icon: 'verified', label: 'Accepting Officer', desc: 'Finalize appraisals, approve organizational bell-curve alignment, and close the cycle.', gradient: 'linear-gradient(135deg, #FCF9F5, #F0E6D8)', iconColor: '#4A7C59', onClick: () => handleOfficerNavigation('accepting') },
  ];

  return (
    <Layout>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#3C2415', letterSpacing: '-0.02em' }}>
          Role Navigation Spaces
        </h1>
        <p style={{ color: '#6F4E37', fontSize: 16, marginTop: 8, maxWidth: 600 }}>
          Select your active role context to proceed with the performance appraisal cycle. Your available actions will adapt based on the selected workspace.
        </p>
      </div>

      {errorMsg && <Alert type="error" message={errorMsg} />}

      <div style={gridStyle}>
        {roleCards.map((card) => (
          <div key={card.key} style={{ ...cardWrapperStyle, background: card.gradient }} onClick={card.onClick}>
            <div style={glowStyle} />
            <div style={{ ...roleIconStyle, color: card.iconColor }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{card.icon}</span>
            </div>
            <div style={{ zIndex: 1, marginTop: 20 }}>
              <h2 style={cardTitleStyle}>{card.label}</h2>
              <p style={cardDescStyle}>{card.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 24,
};

const cardWrapperStyle = {
  borderRadius: 14,
  padding: 24,
  cursor: 'pointer',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  boxShadow: '0 1px 3px rgba(60,36,21,0.06)',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 220,
  position: 'relative',
  overflow: 'hidden',
  border: '1px solid rgba(212,195,187,0.4)',
};

const glowStyle = {
  position: 'absolute', right: -24, top: -24,
  width: 128, height: 128, borderRadius: '50%',
  background: 'rgba(196,168,130,0.15)',
  filter: 'blur(40px)',
};

const roleIconStyle = {
  width: 48, height: 48, borderRadius: '50%',
  background: '#FFFFFF', boxShadow: '0 1px 3px rgba(60,36,21,0.08)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1, border: '1px solid rgba(212,195,187,0.2)',
};

const cardTitleStyle = {
  fontSize: 20, fontWeight: 700, margin: '0 0 8px 0',
  color: '#3C2415', letterSpacing: '-0.01em',
};

const cardDescStyle = {
  fontSize: 14, color: 'rgba(111,78,55,0.8)',
  lineHeight: 1.5, margin: 0,
};
