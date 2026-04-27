import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card, { StatCard } from '../../components/Card';
import Badge from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';
import { cycleAPI, kpaAPI, appraisalAPI, midYearAPI } from '../../services/api';

export default function AppraisalSummary() {
  const { user } = useAuth();
  const [activeCycles, setActiveCycles] = useState([]);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [cycleDataMap, setCycleDataMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cycleAPI.getActive()
      .then(async (r) => {
        const list = r.data.cycles || [];
        setActiveCycles(list);
        
        const newData = {};
        await Promise.all(list.map(async (c) => {
          const results = await Promise.allSettled([
            kpaAPI.getMy(c.id).catch(() => ({ data: {} })),
            midYearAPI.getMy(c.id).catch(() => ({ data: {} })),
            appraisalAPI.getMy(c.id).catch(() => ({ data: {} })),
          ]);
          newData[c.id] = {
            kpas: results[0].status === 'fulfilled' ? (results[0].value.data?.kpas || []) : [],
            midYear: results[1].status === 'fulfilled' ? results[1].value.data?.review : null,
            appraisal: results[2].status === 'fulfilled' ? results[2].value.data?.appraisal : null,
          };
        }));
        setCycleDataMap(newData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cycle = activeCycles[cycleIndex] || null;
  const currentData = cycle ? cycleDataMap[cycle.id] : null;
  const kpas = currentData?.kpas || [];
  const midYear = currentData?.midYear || null;
  const appraisal = currentData?.appraisal || null;

  const handlePrev = () => setCycleIndex((prev) => (prev - 1 + activeCycles.length) % activeCycles.length);
  const handleNext = () => setCycleIndex((prev) => (prev + 1) % activeCycles.length);

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
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/employee/dashboard" style={{ textDecoration: 'none', color: '#A0785A', fontSize: 24 }}>←</Link>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#3C2415', letterSpacing: '-0.01em' }}>
            My Appraisal Space
          </h1>
          <p style={{ color: '#6F4E37', marginTop: 4 }}>
            Manage your goals, mid-year review, and final appraisal here.
          </p>
        </div>
      </div>

      {cycle ? (
        <>
          <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #3C2415, #6F4E37)', color: '#fff', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Active Cycle</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{cycle.name}</div>
                <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4, display: 'flex', gap: 10 }}>
                  <span>Phase: {cycle.phase?.replace(/_/g, ' ')}</span>
                  <Badge label={cycle.status} />
                </div>
              </div>
              {activeCycles.length > 1 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handlePrev} style={arrowBtnStyleWhite}>←</button>
                  <span style={{ fontSize: 13, alignSelf: 'center', opacity: 0.8 }}>{cycleIndex + 1} / {activeCycles.length}</span>
                  <button onClick={handleNext} style={arrowBtnStyleWhite}>→</button>
                </div>
              )}
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard label="KPAs Defined" value={kpas.length} color="#A0785A" />
            <StatCard label="Total Weight" value={`${totalWeight}%`} color={Math.abs(totalWeight - 100) < 0.01 ? '#4A7C59' : '#B8860B'} />
            <StatCard label="KPAs Submitted" value={submittedKpas} color="#4A7C59" />
            <StatCard label="Final Score" value={appraisal?.status === 'FINALIZED' ? (appraisal?.finalScore ?? '—') : '—'} color="#8B6914" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <Card title="Goal Setting" actions={<Link to="/employee/goals" style={actionLinkStyle}>Manage Goals →</Link>}>
              <div style={{ fontSize: 14, color: '#6F4E37', marginBottom: 12 }}>
                {kpas.length === 0 ? 'No KPAs defined yet. Start by setting your goals.' : `${kpas.length} KPA(s) defined · ${totalWeight}% weight allocated`}
              </div>
              {kpas.slice(0, 3).map((k) => (
                <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F5F0E8' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#3C2415' }}>{k.title}</span>
                  <Badge label={k.status} />
                </div>
              ))}
            </Card>

            <Card title="Mid-Year Review" actions={<Link to="/employee/mid-year" style={actionLinkStyle}>Update →</Link>}>
              {midYear ? (
                <>
                  <Badge label={midYear.status} />
                  <p style={{ fontSize: 13, color: '#6F4E37', marginTop: 10 }}>{midYear.progress?.slice(0, 120)}...</p>
                </>
              ) : (
                <p style={{ fontSize: 14, color: '#6F4E37' }}>Not started yet.</p>
              )}
            </Card>

            <Card title="Annual Appraisal" actions={<Link to="/employee/appraisal" style={actionLinkStyle}>View →</Link>}>
              {appraisal ? (
                <div>
                  <Badge label={appraisal.status} />
                  <p style={{ fontSize: 13, color: '#6F4E37', marginTop: 10, fontWeight: 500 }}>
                    {getStatusLabel(appraisal.status)}
                  </p>
                  {appraisal.status === 'FINALIZED' && appraisal.finalScore && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 32, fontWeight: 800, color: '#3C2415' }}>{appraisal.finalScore}<span style={{ fontSize: 14, fontWeight: 500, color: '#A0785A' }}> / 5</span></div>
                      <Badge label={appraisal.ratingBand} />
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: '#6F4E37' }}>Not started yet.</p>
              )}
            </Card>
          </div>
        </>
      ) : (
        !loading && (
          <Card>
            <div style={{ textAlign: 'center', padding: 40, color: '#A0785A' }}>
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

const actionLinkStyle = { fontSize: 13, color: '#A0785A', textDecoration: 'none', fontWeight: 600 };
const arrowBtnStyleWhite = { background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' };
