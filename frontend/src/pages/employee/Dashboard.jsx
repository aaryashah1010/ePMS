import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card, { StatCard } from '../../components/Card';
import Badge from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';
import { cycleAPI, kpaAPI, appraisalAPI, midYearAPI } from '../../services/api';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [cycle, setCycle] = useState(null);
  const [kpas, setKpas] = useState([]);
  const [midYear, setMidYear] = useState(null);
  const [appraisal, setAppraisal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cycleAPI.getActive()
      .then(async (r) => {
        const c = r.data.cycle;
        setCycle(c);
        if (c) {
          const results = await Promise.allSettled([
            kpaAPI.getMy(c.id),
            midYearAPI.getMy(c.id),
            appraisalAPI.getMy(c.id),
          ]);
          if (results[0].status === 'fulfilled') setKpas(results[0].value.data.kpas || []);
          if (results[1].status === 'fulfilled') setMidYear(results[1].value.data.review);
          if (results[2].status === 'fulfilled') setAppraisal(results[2].value.data.appraisal);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalWeight = kpas.reduce((s, k) => s + k.weightage, 0);
  const submittedKpas = kpas.filter((k) => k.status === 'SUBMITTED').length;

  const getStatusLabel = (status) => {
    switch (status) {
      case 'SUBMITTED': return 'Appraisal under review by Reporting Officer';
      case 'REPORTING_DONE': return 'Under review by Reviewing Officer';
      case 'REVIEWING_DONE': return 'Under review by Accepting Officer';
      case 'ACCEPTING_DONE': return 'Under review by HR';
      case 'FINALIZED': return '✅ Appraisal completed — View your score';
      default: return 'Draft / Not Submitted';
    }
  };

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e293b' }}>
          Welcome, {user?.name}
        </h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>
          {user?.department} · Employee Code: {user?.employeeCode || 'N/A'}
        </p>
      </div>

      {cycle ? (
        <>
          <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Active Cycle</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{cycle.name}</div>
                <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>
                  Phase: {cycle.phase?.replace(/_/g, ' ')}
                </div>
              </div>
              <Badge label={cycle.status} />
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard label="KPAs Defined" value={kpas.length} color="#2563eb" />
            <StatCard label="Total Weight" value={`${totalWeight}%`} color={Math.abs(totalWeight - 100) < 0.01 ? '#16a34a' : '#d97706'} />
            <StatCard label="KPAs Submitted" value={submittedKpas} color="#16a34a" />
            <StatCard label="Final Score" value={appraisal?.status === 'FINALIZED' ? (appraisal?.finalScore ?? '—') : '—'} color="#7c3aed" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <Card title="Goal Setting" actions={<Link to="/employee/goals" style={actionLinkStyle}>Manage Goals →</Link>}>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>
                {kpas.length === 0 ? 'No KPAs defined yet. Start by setting your goals.' : `${kpas.length} KPA(s) defined · ${totalWeight}% weight allocated`}
              </div>
              {kpas.slice(0, 3).map((k) => (
                <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{k.title}</span>
                  <Badge label={k.status} />
                </div>
              ))}
            </Card>

            <Card title="Mid-Year Review" actions={<Link to="/employee/mid-year" style={actionLinkStyle}>Update →</Link>}>
              {midYear ? (
                <>
                  <Badge label={midYear.status} />
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 10 }}>{midYear.progress?.slice(0, 120)}...</p>
                </>
              ) : (
                <p style={{ fontSize: 14, color: '#64748b' }}>Not started yet.</p>
              )}
            </Card>

            <Card title="Annual Appraisal" actions={<Link to="/employee/appraisal" style={actionLinkStyle}>View →</Link>}>
              {appraisal ? (
                <div>
                  <Badge label={appraisal.status} />
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 10, fontWeight: 500 }}>
                    {getStatusLabel(appraisal.status)}
                  </p>
                  {appraisal.status === 'FINALIZED' && appraisal.finalScore && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 32, fontWeight: 800, color: '#2563eb' }}>{appraisal.finalScore}</div>
                      <Badge label={appraisal.ratingBand} />
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: '#64748b' }}>Not started yet.</p>
              )}
            </Card>
          </div>
        </>
      ) : (
        !loading && (
          <Card>
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              <div style={{ fontSize: 48 }}>📋</div>
              <p style={{ fontSize: 16, marginTop: 12 }}>No active appraisal cycle found.</p>
              <p style={{ fontSize: 13 }}>Please contact HR to initiate an appraisal cycle.</p>
            </div>
          </Card>
        )
      )}
    </Layout>
  );
}

const actionLinkStyle = { fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 600 };
