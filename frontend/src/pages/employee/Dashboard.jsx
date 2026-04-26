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

  return (
    <Layout>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1e293b' }}>
          Welcome back, {user?.name}
        </h1>
        <p style={{ color: '#64748b', fontSize: 16, marginTop: 8 }}>
          {user?.department || 'No Department'} · Employee Code: {user?.employeeCode || 'N/A'}
        </p>
      </div>

      {errorMsg && <Alert type="error" message={errorMsg} style={{ marginBottom: 24 }} />}

      <div style={gridStyle}>
        <div style={{ ...cardWrapperStyle, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }} onClick={() => navigate('/employee/summary')}>
          <div style={iconStyle}>👤</div>
          <h2 style={cardTitleStyle}>Employee Space</h2>
          <p style={cardDescStyle}>Manage your own goals, mid-year review, and annual appraisal.</p>
        </div>

        <div style={{ ...cardWrapperStyle, background: 'linear-gradient(135deg, #10b981, #047857)' }} onClick={() => handleOfficerNavigation('reporting')}>
          <div style={iconStyle}>👥</div>
          <h2 style={cardTitleStyle}>Reporting Officer Space</h2>
          <p style={cardDescStyle}>Review goals and provide initial ratings for your direct reportees.</p>
        </div>

        <div style={{ ...cardWrapperStyle, background: 'linear-gradient(135deg, #8b5cf6, #5b21b6)' }} onClick={() => handleOfficerNavigation('reviewing')}>
          <div style={iconStyle}>🔍</div>
          <h2 style={cardTitleStyle}>Reviewing Officer Space</h2>
          <p style={cardDescStyle}>Review and adjust ratings for employees under your review cycle.</p>
        </div>

        <div style={{ ...cardWrapperStyle, background: 'linear-gradient(135deg, #f59e0b, #b45309)' }} onClick={() => handleOfficerNavigation('accepting')}>
          <div style={iconStyle}>✅</div>
          <h2 style={cardTitleStyle}>Accepting Officer Space</h2>
          <p style={cardDescStyle}>Provide final approval for appraisals within your hierarchy.</p>
        </div>
      </div>
    </Layout>
  );
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: 24,
};

const cardWrapperStyle = {
  borderRadius: 16,
  padding: 32,
  color: '#ffffff',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  border: 'none',
};

const iconStyle = {
  fontSize: 48,
  marginBottom: 16,
};

const cardTitleStyle = {
  fontSize: 20,
  fontWeight: 700,
  margin: '0 0 12px 0',
};

const cardDescStyle = {
  fontSize: 14,
  opacity: 0.9,
  lineHeight: 1.5,
  margin: 0,
};
