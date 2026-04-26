import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card, { StatCard } from '../../components/Card';
import Badge from '../../components/Badge';
import { cycleAPI, userAPI, reportAPI } from '../../services/api';

export default function AdminDashboard() {
  const [cycles, setCycles] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeCycles, setActiveCycles] = useState([]);
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      cycleAPI.getAll(),
      userAPI.getAll(),
      cycleAPI.getActive(),
    ]).then(async ([c, u, ac]) => {
      if (c.status === 'fulfilled') setCycles(c.value.data.cycles || []);
      if (u.status === 'fulfilled') setUsers(u.value.data.users || []);
      if (ac.status === 'fulfilled') {
        const activeList = ac.value.data.cycles || [];
        setActiveCycles(activeList);
        if (activeList.length > 0) {
          const prog = await reportAPI.progress(activeList[0].id).catch(() => null);
          if (prog?.data?.progress) {
            setProgressData(prog.data.progress);
          }
        }
      }
    });
  }, []);

  const roleCount = {};
  for (const u of users) roleCount[u.role] = (roleCount[u.role] || 0) + 1;

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>HR Admin Dashboard</h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>System overview and management</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Employees" value={users.length} color="#2563eb" />
        <StatCard label="Active Cycles" value={activeCycles.length} color="#16a34a" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* User Breakdown */}
        <Card title="User Breakdown" actions={<Link to="/hr/users" style={linkStyle}>Manage Users →</Link>}>
          {Object.entries(roleCount).map(([role, count]) => (
            <div key={role} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
              <span style={{ color: '#374151' }}>{role.replace(/_/g, ' ')}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </Card>

        {/* Cycles overview */}
        <Card title="All Cycles" actions={<Link to="/hr/cycles" style={linkStyle}>View All →</Link>}>
          {cycles.slice(0, 5).map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Year: {c.year}</div>
              </div>
              <Badge label={c.status} />
            </div>
          ))}
        </Card>
      </div>

      {progressData && activeCycles[0] && (
        <Card title={`Completion Stats: ${activeCycles[0].name}`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <div>
              <h4 style={{ fontSize: 14, marginBottom: 8, color: '#1e293b' }}>Goal Setting</h4>
              <StatRow label="Draft" value={progressData.goalProgress.DRAFT || 0} />
              <StatRow label="Submitted" value={progressData.goalProgress.SUBMITTED || 0} />
              <StatRow label="Reporting Done" value={progressData.goalProgress.REPORTING_DONE || 0} />
            </div>
            <div>
              <h4 style={{ fontSize: 14, marginBottom: 8, color: '#1e293b' }}>Mid-Year Review</h4>
              <StatRow label="Draft" value={progressData.midYearProgress.DRAFT || 0} />
              <StatRow label="Submitted" value={progressData.midYearProgress.SUBMITTED || 0} />
              <StatRow label="Reporting Done" value={progressData.midYearProgress.REPORTING_DONE || 0} />
            </div>
            <div>
              <h4 style={{ fontSize: 14, marginBottom: 8, color: '#1e293b' }}>Annual Appraisal</h4>
              <StatRow label="Draft" value={progressData.appraisalProgress.DRAFT || 0} />
              <StatRow label="Submitted" value={progressData.appraisalProgress.SUBMITTED || 0} />
              <StatRow label="Reporting Done" value={progressData.appraisalProgress.REPORTING_DONE || 0} />
              <StatRow label="Reviewing Done" value={progressData.appraisalProgress.REVIEWING_DONE || 0} />
              <StatRow label="Accepting Done" value={progressData.appraisalProgress.ACCEPTING_DONE || 0} />
              <StatRow label="Finalized" value={progressData.appraisalProgress.FINALIZED || 0} />
            </div>
          </div>
        </Card>
      )}
    </Layout>
  );
}

const StatRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
    <span style={{ color: '#64748b' }}>{label}</span>
    <strong style={{ color: '#0f172a' }}>{value}</strong>
  </div>
);

const linkStyle = { fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 600 };
const arrowBtnStyle = { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: 'bold' };
