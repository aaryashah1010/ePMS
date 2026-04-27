import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card, { StatCard } from '../../components/Card';
import Badge from '../../components/Badge';
import { cycleAPI, userAPI } from '../../services/api';

export default function AdminDashboard() {
  const [cycles, setCycles] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeCycles, setActiveCycles] = useState([]);

  useEffect(() => {
    Promise.allSettled([
      cycleAPI.getAll(),
      userAPI.getAll(),
      cycleAPI.getActive(),
    ]).then(([c, u, ac]) => {
      if (c.status === 'fulfilled') setCycles(c.value.data.cycles || []);
      if (u.status === 'fulfilled') setUsers(u.value.data.users || []);
      if (ac.status === 'fulfilled') {
        setActiveCycles(ac.value.data.cycles || []);
      }
    });
  }, []);

  const roleCount = {};
  for (const u of users) roleCount[u.role] = (roleCount[u.role] || 0) + 1;

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#3C2415', letterSpacing: '-0.01em' }}>HR Admin Dashboard</h1>
        <p style={{ color: '#6F4E37', marginTop: 4 }}>System overview and management</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Employees" value={users.length} color="#A0785A" />
        <StatCard label="Active Cycles" value={activeCycles.length} color="#4A7C59" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* User Breakdown */}
        <Card title="User Breakdown" actions={<Link to="/hr/users" style={linkStyle}>Manage Users →</Link>}>
          {Object.entries(roleCount).map(([role, count]) => (
            <div key={role} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F5F0E8', fontSize: 14 }}>
              <span style={{ color: '#3C2415', fontWeight: 500 }}>{role.replace(/_/g, ' ')}</span>
              <strong style={{ color: '#3C2415' }}>{count}</strong>
            </div>
          ))}
        </Card>

        {/* Cycles overview */}
        <Card title="All Cycles" actions={<Link to="/hr/cycles" style={linkStyle}>View All →</Link>}>
          {cycles.slice(0, 5).map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F5F0E8' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#3C2415' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: '#6F4E37' }}>Year: {c.year}</div>
              </div>
              <Badge label={c.status} />
            </div>
          ))}
        </Card>
      </div>
    </Layout>
  );
}

const linkStyle = { fontSize: 13, color: '#A0785A', textDecoration: 'none', fontWeight: 600 };
