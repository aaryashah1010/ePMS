import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card, { StatCard } from '../../components/Card';
import Badge from '../../components/Badge';
import { cycleAPI, userAPI, reportAPI } from '../../services/api';

export default function AdminDashboard() {
  const [cycles, setCycles] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeCycle, setActiveCycle] = useState(null);
  const [progress, setProgress] = useState(null);
  const [distribution, setDistribution] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      cycleAPI.getAll(),
      userAPI.getAll(),
      cycleAPI.getActive(),
    ]).then(([c, u, ac]) => {
      if (c.status === 'fulfilled') setCycles(c.value.data.cycles || []);
      if (u.status === 'fulfilled') setUsers(u.value.data.users || []);
      if (ac.status === 'fulfilled') {
        const cyc = ac.value.data.cycle;
        setActiveCycle(cyc);
        if (cyc) {
          Promise.allSettled([
            reportAPI.progress(cyc.id),
            reportAPI.distribution(cyc.id),
          ]).then(([p, d]) => {
            if (p.status === 'fulfilled') setProgress(p.value.data.progress);
            if (d.status === 'fulfilled') setDistribution(d.value.data.distribution);
          });
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
        <StatCard label="Active Cycles" value={cycles.filter((c) => c.status === 'ACTIVE').length} color="#16a34a" />
        <StatCard label="Finalized Appraisals" value={progress?.progress?.FINALIZED ?? '—'} color="#7c3aed" />
        <StatCard label="Pending" value={progress ? (progress.total - (progress.progress?.FINALIZED || 0)) : '—'} color="#d97706" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Active Cycle */}
        <Card title="Active Cycle" actions={<Link to="/hr/cycles" style={linkStyle}>Manage Cycles →</Link>}>
          {activeCycle ? (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{activeCycle.name}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <Badge label={activeCycle.phase} />
                <Badge label={activeCycle.status} />
              </div>
              {progress && (
                <div>
                  {Object.entries(progress.progress || {}).map(([status, count]) => (
                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                      <span><Badge label={status} /></span>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
              <p>No active cycle.</p>
              <Link to="/hr/cycles" style={{ color: '#2563eb', fontSize: 14 }}>Create one →</Link>
            </div>
          )}
        </Card>

        {/* Rating Distribution */}
        <Card title="Rating Distribution" actions={<Link to="/hr/reports" style={linkStyle}>View Reports →</Link>}>
          {distribution ? (
            <div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                Total finalized: {distribution.total}
              </div>
              {Object.entries(distribution.percentages || {}).map(([band, pct]) => (
                <div key={band} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <Badge label={band} />
                    <span>{distribution.distribution[band]} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#2563eb', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: 30 }}>No finalized appraisals yet.</p>
          )}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
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
    </Layout>
  );
}

const linkStyle = { fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 600 };
