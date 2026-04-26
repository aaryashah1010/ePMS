import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import CycleSelector from '../../components/CycleSelector';
import { appraisalAPI, kpaAPI, attributeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const RATING_BAND_COLOR = {
  Poor: '#dc2626', 'Below Average': '#d97706',
  Average: '#0369a1', Good: '#16a34a', Outstanding: '#7c3aed',
};

export default function SelfAppraisal() {
  const [cycleId, setCycleId] = useState('');
  const [appraisal, setAppraisal] = useState(null);
  const [kpas, setKpas] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [kpaRatings, setKpaRatings] = useState({});
  const [attrRatings, setAttrRatings] = useState({});
  const [achievements, setAchievements] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth(); // Needed to check if ratedBy is self

  const load = async (cid) => {
    if (!cid) return;
    try {
      const r = await appraisalAPI.getMy(cid);
      const apprs = r.data.appraisal;
      setAppraisal(apprs);
      setAchievements(apprs?.achievements || '');

      const [kpaRes, attrRes] = await Promise.all([
        kpaAPI.getMy(cid),
        attributeAPI.getAll({ isActive: 'true' })
      ]);
      setKpas(kpaRes.data.kpas || []);
      setAttributes(attrRes.data.attributes || []);

      const kMap = {};
      const aMap = {};
      for (const rating of apprs?.kpaRatings || []) {
        if (rating.ratedBy === user?.id) kMap[rating.kpaGoalId] = { rating: rating.rating, remarks: rating.remarks || '' };
      }
      for (const rating of apprs?.attributeRatings || []) {
        if (rating.ratedBy === user?.id) aMap[rating.attributeId] = { rating: rating.rating, remarks: rating.remarks || '' };
      }
      setKpaRatings(kMap);
      setAttrRatings(aMap);

    } catch {
      setAppraisal(null);
    }
  };

  useEffect(() => { load(cycleId); }, [cycleId]);

  const handleSaveRatingsOnly = async () => {
    if (!appraisal) return;
    const kpaPayload = Object.entries(kpaRatings).map(([kpaGoalId, v]) => ({ kpaGoalId, rating: parseFloat(v.rating), remarks: v.remarks }));
    const attrPayload = Object.entries(attrRatings).map(([attributeId, v]) => ({ attributeId, rating: parseFloat(v.rating), remarks: v.remarks }));
    
    await Promise.all([
      kpaPayload.length ? appraisalAPI.saveKpaRatings(appraisal.id, kpaPayload) : Promise.resolve(),
      attrPayload.length ? appraisalAPI.saveAttributeRatings(appraisal.id, attrPayload) : Promise.resolve(),
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      await handleSaveRatingsOnly();
      await appraisalAPI.updateSelf(cycleId, achievements);
      setMsg({ type: 'success', text: 'Achievements and self-ratings saved.' });
      load(cycleId);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Save failed' });
    } finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    if (!window.confirm('Submit appraisal? This cannot be undone.')) return;
    setSubmitting(true);
    try {
      await handleSaveRatingsOnly();
      await appraisalAPI.updateSelf(cycleId, achievements); // ensure last achievements saved
      await appraisalAPI.submit(cycleId);
      setMsg({ type: 'success', text: 'Appraisal submitted. Your reporting officer will now review it.' });
      load(cycleId);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Submit failed' });
    } finally { setSubmitting(false); }
  };

  const isDraft = !appraisal || appraisal.status === 'DRAFT';
  const isFinalized = appraisal?.status === 'FINALIZED';

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

  const valuesAttrs = attributes.filter((a) => a.type === 'VALUES');
  const competencyAttrs = attributes.filter((a) => a.type === 'COMPETENCIES');

  return (
    <Layout>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Annual Self-Appraisal</h1>

      <div style={{ marginBottom: 20 }}>
        <CycleSelector value={cycleId} onChange={setCycleId} minPhase="ANNUAL_APPRAISAL" />
      </div>

      {cycleId && (
        <>
          <Alert type={msg.type || 'info'} message={msg.text} />

          {isFinalized && appraisal.finalScore && (
            <Card style={{ marginBottom: 20, textAlign: 'center', background: '#f0fdf4', border: '2px solid #86efac' }}>
              <div style={{ fontSize: 13, color: '#166534', fontWeight: 600, marginBottom: 6 }}>FINAL APPRAISAL RESULT</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: RATING_BAND_COLOR[appraisal.ratingBand] || '#2563eb' }}>
                {appraisal.finalScore}
              </div>
              <Badge label={appraisal.ratingBand} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
                <div style={scoreCardStyle}><div style={scoreLabelStyle}>KPA Score (60%)</div><div style={scoreValStyle}>{appraisal.kpaScore ?? '—'}</div></div>
                <div style={scoreCardStyle}><div style={scoreLabelStyle}>Values Score (20%)</div><div style={scoreValStyle}>{appraisal.valuesScore ?? '—'}</div></div>
                <div style={scoreCardStyle}><div style={scoreLabelStyle}>Competencies (20%)</div><div style={scoreValStyle}>{appraisal.competenciesScore ?? '—'}</div></div>
              </div>
            </Card>
          )}

          <Card title="Self Assessment">
            {appraisal && (
              <div style={{ marginBottom: 12 }}>
                <Badge label={appraisal.status} />
                {!isDraft && (
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 8, fontWeight: 600 }}>
                    {getStatusLabel(appraisal.status)}
                  </p>
                )}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Achievements & Contributions *</label>
              <textarea
                style={{ width: '100%', padding: '12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, height: 180, resize: 'vertical' }}
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                placeholder="Describe your key achievements, contributions, and outcomes for this appraisal year..."
                disabled={!isDraft}
              />
            </div>

            {/* KPA Self Ratings */}
            {isDraft && kpas.length > 0 && (
              <div style={{ marginTop: 24, marginBottom: 16 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Self-Rate KPAs</h4>
                {kpas.map((k) => (
                  <div key={k.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{k.title}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Weight: {k.weightage}%</div>
                      </div>
                      <input
                        type="number" min="0" max={k.weightage} step="0.1"
                        value={kpaRatings[k.id]?.rating || ''}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val !== '' && Number(val) > k.weightage) val = k.weightage.toString();
                          setKpaRatings((p) => ({ ...p, [k.id]: { ...p[k.id], rating: val } }));
                        }}
                        placeholder={`Max ${k.weightage}`}
                        style={ratingInputStyle}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Attribute Self Ratings */}
            {isDraft && (valuesAttrs.length > 0 || competencyAttrs.length > 0) && (
              <div style={{ marginTop: 24, marginBottom: 20 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Self-Rate Values & Competencies (1-5)</h4>
                {[{ label: 'Values', list: valuesAttrs }, { label: 'Competencies', list: competencyAttrs }].map(({ label, list }) => (
                  list.length > 0 && (
                    <div key={label} style={{ marginBottom: 16 }}>
                      <h5 style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 8 }}>{label}</h5>
                      {list.map((attr) => (
                        <div key={attr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{attr.name}</div>
                          <input
                            type="number" min="1" max="5" step="0.1"
                            value={attrRatings[attr.id]?.rating || ''}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (val !== '' && Number(val) > 5) val = '5';
                              setAttrRatings((p) => ({ ...p, [attr.id]: { rating: val } }));
                            }}
                            placeholder="1–5"
                            style={ratingInputStyle}
                          />
                        </div>
                      ))}
                    </div>
                  )
                ))}
              </div>
            )}

            {isDraft && (
              <div style={{ display: 'flex', gap: 10 }}>
                <Button onClick={handleSave} loading={saving} variant="outline">Save Draft</Button>
                <Button onClick={handleSubmit} loading={submitting} variant="success" disabled={!achievements.trim()}>
                  Submit for Review
                </Button>
              </div>
            )}
          </Card>

          {/* KPA Ratings from officer */}
          {isFinalized && appraisal?.kpaRatings?.length > 0 && (
            <Card title="KPA Ratings" style={{ marginTop: 20 }}>
              {appraisal.kpaRatings.map((r) => (
                <div key={r.id} style={ratingRowStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.kpaGoal?.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Weight: {r.kpaGoal?.weightage}%</div>
                    {r.remarks && <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Remarks: {r.remarks}</div>}
                  </div>
                  <div style={ratingBubble(r.rating)}>{r.rating}</div>
                </div>
              ))}
            </Card>
          )}

          {/* Remarks chain */}
          {isFinalized && (
            <>
              {appraisal?.reportingRemarks && (
                <Card title="Reporting Officer Remarks" style={{ marginTop: 16, background: '#fefce8' }}>
                  <p style={{ fontSize: 14 }}>{appraisal.reportingRemarks}</p>
                </Card>
              )}
              {appraisal?.reviewingRemarks && (
                <Card title="Reviewing Officer Remarks" style={{ marginTop: 16, background: '#f0f9ff' }}>
                  <p style={{ fontSize: 14 }}>{appraisal.reviewingRemarks}</p>
                </Card>
              )}
              {appraisal?.acceptingRemarks && (
                <Card title="Accepting Officer Remarks" style={{ marginTop: 16, background: '#f0fdf4' }}>
                  <p style={{ fontSize: 14 }}>{appraisal.acceptingRemarks}</p>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </Layout>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const ratingRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', gap: 12 };
const ratingBubble = (val) => ({
  width: 44, height: 44, borderRadius: '50%',
  background: val >= 4 ? '#dcfce7' : val >= 3 ? '#dbeafe' : '#fee2e2',
  color: val >= 4 ? '#166534' : val >= 3 ? '#1d4ed8' : '#991b1b',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 800, fontSize: 16, flexShrink: 0,
});
const scoreCardStyle = { background: '#f8fafc', borderRadius: 10, padding: '14px 16px' };
const scoreLabelStyle = { fontSize: 12, color: '#64748b', fontWeight: 500, marginBottom: 4 };
const scoreValStyle = { fontSize: 26, fontWeight: 800, color: '#1e293b' };
const ratingInputStyle = {
  width: 70, padding: '6px 10px', border: '1.5px solid #d1d5db',
  borderRadius: 8, fontSize: 13, fontWeight: 700, textAlign: 'center',
};
