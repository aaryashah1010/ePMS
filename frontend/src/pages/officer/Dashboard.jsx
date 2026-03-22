import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card, { StatCard } from '../../components/Card';
import Badge from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';
import { cycleAPI, appraisalAPI, userAPI } from '../../services/api';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [cycle, setCycle] = useState(null);
  const [appraisals, setAppraisals] = useState([]);
  const [reportees, setReportees] = useState([]);

  useEffect(() => {
    cycleAPI.getActive().then(async (r) => {
      const c = r.data.cycle;
      setCycle(c);
      if (c) {
        const [ap, rp] = await Promise.allSettled([
          appraisalAPI.getTeam(c.id),
          userAPI.getReportees(),
        ]);
        if (ap.status === 'fulfilled') setAppraisals(ap.value.data.appraisals || []);
        if (rp.status === 'fulfilled') setReportees(rp.value.data.reportees || []);
      }
    }).catch(() => {});
  }, []);

  const ROLE_LABELS = {
    REPORTING_OFFICER: 'Reporting Officer',
    REVIEWING_OFFICER: 'Reviewing Officer',
    ACCEPTING_OFFICER: 'Accepting Officer',
  };

  const pendingAction = appraisals.filter((a) => {
    if (user.role === 'REPORTING_OFFICER') return a.status === 'SUBMITTED';
    if (user.role === 'REVIEWING_OFFICER') return a.status === 'REPORTING_DONE';
    if (user.role === 'ACCEPTING_OFFICER') return a.status === 'REVIEWING_DONE';
    return false;
  }).length;

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e293b' }}>
          Officer Dashboard
        </h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>
          {ROLE_LABELS[user?.role]} · {user?.department}
        </p>
      </div>

      {cycle && (
        <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Active Cycle</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{cycle.name}</div>
              <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>Phase: {cycle.phase?.replace(/_/g, ' ')}</div>
            </div>
            <Badge label={cycle.status} />
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Team Members" value={reportees.length} color="#2563eb" />
        <StatCard label="Total Appraisals" value={appraisals.length} color="#7c3aed" />
        <StatCard label="Pending Your Action" value={pendingAction} color={pendingAction > 0 ? '#d97706' : '#16a34a'} />
        <StatCard label="Finalized" value={appraisals.filter((a) => a.status === 'FINALIZED').length} color="#16a34a" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card title="Team Appraisal Status" actions={<Link to="/officer/ratings" style={linkStyle}>View All →</Link>}>
          {appraisals.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No appraisals found.</p>
          ) : (
            appraisals.slice(0, 6).map((a) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.user?.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{a.user?.department}</div>
                </div>
                <Badge label={a.status} />
              </div>
            ))
          )}
        </Card>

        <Card title="My Team" actions={<Link to="/officer/goals" style={linkStyle}>View Goals →</Link>}>
          {reportees.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No reportees assigned.</p>
          ) : (
            reportees.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={avatarStyle}>{r.name?.charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{r.department} · {r.employeeCode}</div>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </Layout>
  );
}

const linkStyle = { fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 600 };
const avatarStyle = {
  width: 36, height: 36, background: '#dbeafe', color: '#1d4ed8',
  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, fontSize: 15, flexShrink: 0,
};
