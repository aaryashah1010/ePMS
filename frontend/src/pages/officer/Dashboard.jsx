import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import Card, { StatCard } from '../../components/Card';
import Badge from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';
import { cycleAPI, appraisalAPI, userAPI } from '../../services/api';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const { roleType } = useParams(); // reporting, reviewing, accepting
  const [activeCycles, setActiveCycles] = useState([]);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [appraisalsMap, setAppraisalsMap] = useState({});
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    cycleAPI.getActive().then(async (r) => {
      const list = r.data.cycles || [];
      setActiveCycles(list);

      let empRes;
      if (roleType === 'reporting') empRes = await userAPI.getReportees().catch(() => ({ data: {} }));
      else if (roleType === 'reviewing') empRes = await userAPI.getReviewees().catch(() => ({ data: {} }));
      else if (roleType === 'accepting') empRes = await userAPI.getAppraisees().catch(() => ({ data: {} }));
      
      const emps = empRes?.data?.reportees || empRes?.data?.reviewees || empRes?.data?.appraisees || [];
      setEmployees(emps);

      const newMap = {};
      await Promise.all(list.map(async (c) => {
        const ap = await appraisalAPI.getTeam(c.id).catch(() => ({ data: {} }));
        // appraisalAPI.getTeam returns all appraisals for the officer.
        // We should ideally filter these by the roleType if the backend returns all of them.
        // Wait, backend getTeam might need to be filtered by who they are for. We can filter on frontend:
        const allAppraisals = ap.data?.appraisals || [];
        const filtered = allAppraisals.filter(a => {
          if (roleType === 'reporting') return a.user.reportingOfficerId === user.id;
          if (roleType === 'reviewing') return a.user.reviewingOfficerId === user.id;
          if (roleType === 'accepting') return a.user.acceptingOfficerId === user.id;
          return false;
        });
        newMap[c.id] = filtered;
      }));
      setAppraisalsMap(newMap);
    }).catch(() => {});
  }, [roleType, user.id]);

  const cycle = activeCycles[cycleIndex] || null;
  const appraisals = cycle ? (appraisalsMap[cycle.id] || []) : [];

  const handlePrev = () => setCycleIndex((prev) => (prev - 1 + activeCycles.length) % activeCycles.length);
  const handleNext = () => setCycleIndex((prev) => (prev + 1) % activeCycles.length);

  let contextualTarget = 'Reportees';
  let title = 'Reporting Officer';
  if (roleType === 'reviewing') { contextualTarget = 'Reviewees'; title = 'Reviewing Officer'; }
  if (roleType === 'accepting') { contextualTarget = 'Appraisees'; title = 'Accepting Officer'; }

  const pendingAction = appraisals.filter((a) => {
    if (roleType === 'reporting') return a.status === 'SUBMITTED';
    if (roleType === 'reviewing') return a.status === 'REPORTING_DONE';
    if (roleType === 'accepting') return a.status === 'REVIEWING_DONE';
    return false;
  }).length;

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#3C2415', letterSpacing: '-0.01em' }}>
          {title} Dashboard
        </h1>
        <p style={{ color: '#6F4E37', marginTop: 4 }}>
          {user?.name} · {user?.department}
        </p>
      </div>

      {cycle && (
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
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label={`Total ${contextualTarget}`} value={employees.length} color="#A0785A" />
        <StatCard label="Total Appraisals" value={appraisals.length} color="#8B6914" />
        <StatCard label="Pending Your Action" value={pendingAction} color={pendingAction > 0 ? '#B8860B' : '#4A7C59'} />
        <StatCard label="Finalized" value={appraisals.filter((a) => a.status === 'FINALIZED').length} color="#4A7C59" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card title={`${contextualTarget} Appraisal Status`} actions={<Link to={`/officer/${roleType}/ratings`} style={linkStyle}>View All →</Link>}>
          {appraisals.length === 0 ? (
            <p style={{ color: '#A0785A', textAlign: 'center', padding: 20 }}>No appraisals found.</p>
          ) : (
            appraisals.slice(0, 6).map((a) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F5F0E8' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#3C2415' }}>{a.user?.name}</div>
                  <div style={{ fontSize: 12, color: '#6F4E37' }}>{a.user?.department}</div>
                </div>
                <Badge label={a.status} />
              </div>
            ))
          )}
        </Card>

        <Card title={`My ${contextualTarget}`} actions={<Link to={`/officer/${roleType}/goals`} style={linkStyle}>View Goals →</Link>}>
          {employees.length === 0 ? (
            <p style={{ color: '#A0785A', textAlign: 'center', padding: 20 }}>No {contextualTarget.toLowerCase()} assigned.</p>
          ) : (
            employees.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F5F0E8' }}>
                <div style={avatarStyle}>{r.name?.charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#3C2415' }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: '#6F4E37' }}>{r.department} · {r.employeeCode}</div>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </Layout>
  );
}

const linkStyle = { fontSize: 13, color: '#A0785A', textDecoration: 'none', fontWeight: 600 };
const avatarStyle = {
  width: 36, height: 36, background: '#E8DCC8', color: '#3C2415',
  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, fontSize: 15, flexShrink: 0,
};
const arrowBtnStyleWhite = { background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' };
