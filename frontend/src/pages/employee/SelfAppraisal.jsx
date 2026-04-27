import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import CycleSelector from '../../components/CycleSelector';
import ConfirmModal from '../../components/ConfirmModal';
import { appraisalAPI, kpaAPI, attributeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const RATING_BAND_COLOR = {
  Poor: '#8B3A3A', 'Below Average': '#A0785A',
  Average: '#6F4E37', Good: '#4A7C59', Outstanding: '#3C2415',
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
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', variant: 'primary' });
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
      // Create/update the appraisal first so it exists for ratings
      await appraisalAPI.updateSelf(cycleId, achievements);
      // Reload to get the appraisal id (needed for first-time save)
      const r = await appraisalAPI.getMy(cycleId);
      const freshAppraisal = r.data.appraisal;
      if (freshAppraisal) {
        setAppraisal(freshAppraisal);
        // Now save ratings against the existing appraisal
        const kpaPayload = Object.entries(kpaRatings).map(([kpaGoalId, v]) => ({ kpaGoalId, rating: parseFloat(v.rating), remarks: v.remarks }));
        const attrPayload = Object.entries(attrRatings).map(([attributeId, v]) => ({ attributeId, rating: parseFloat(v.rating), remarks: v.remarks }));
        await Promise.all([
          kpaPayload.length ? appraisalAPI.saveKpaRatings(freshAppraisal.id, kpaPayload) : Promise.resolve(),
          attrPayload.length ? appraisalAPI.saveAttributeRatings(freshAppraisal.id, attrPayload) : Promise.resolve(),
        ]);
      }
      setMsg({ type: 'success', text: 'Achievements and self-ratings saved.' });
      load(cycleId);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Save failed' });
    } finally { setSaving(false); }
  };

  const handleSubmit = () => {
    setModalConfig({
      isOpen: true,
      title: 'Submit Appraisal',
      message: 'Submit appraisal? This cannot be undone.',
      confirmText: 'Submit',
      variant: 'primary',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setSubmitting(true);
        try {
          // Create/update appraisal first
          await appraisalAPI.updateSelf(cycleId, achievements);
          // Reload to get appraisal id
          const r = await appraisalAPI.getMy(cycleId);
          const freshAppraisal = r.data.appraisal;
          if (freshAppraisal) {
            const kpaPayload = Object.entries(kpaRatings).map(([kpaGoalId, v]) => ({ kpaGoalId, rating: parseFloat(v.rating), remarks: v.remarks }));
            const attrPayload = Object.entries(attrRatings).map(([attributeId, v]) => ({ attributeId, rating: parseFloat(v.rating), remarks: v.remarks }));
            await Promise.all([
              kpaPayload.length ? appraisalAPI.saveKpaRatings(freshAppraisal.id, kpaPayload) : Promise.resolve(),
              attrPayload.length ? appraisalAPI.saveAttributeRatings(freshAppraisal.id, attrPayload) : Promise.resolve(),
            ]);
          }
          await appraisalAPI.submit(cycleId);
          setMsg({ type: 'success', text: 'Appraisal submitted. Your reporting officer will now review it.' });
          load(cycleId);
        } catch (err) {
          setMsg({ type: 'error', text: err.response?.data?.message || 'Submit failed' });
        } finally { setSubmitting(false); }
      }
    });
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

  // Get accepting officer's ID
  const acceptingOfficerId = appraisal?.user?.acceptingOfficerId;

  // Get accepting officer's KPA ratings grouped by KPA goal
  const getAcceptingKpaRatings = () => {
    if (!appraisal?.kpaRatings || !acceptingOfficerId) return [];
    return appraisal.kpaRatings.filter(r => r.ratedBy === acceptingOfficerId);
  };

  // Get accepting officer's attribute ratings
  const getAcceptingAttrRatings = () => {
    if (!appraisal?.attributeRatings || !acceptingOfficerId) return [];
    return appraisal.attributeRatings.filter(r => r.ratedBy === acceptingOfficerId);
  };

  // Compute KPA total from accepting officer's ratings (out of 100)
  const computeKpaTotal = () => {
    const ratings = getAcceptingKpaRatings();
    if (ratings.length === 0) return null;
    return parseFloat(ratings.reduce((sum, r) => sum + r.rating, 0).toFixed(2));
  };

  // Compute attribute average from accepting officer's ratings (1-5)
  const computeAttrAvg = (type) => {
    const ratings = getAcceptingAttrRatings().filter(r => r.attribute?.type === type);
    if (ratings.length === 0) return null;
    return parseFloat((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2));
  };

  // Convert KPA score (0-100) to 1-5 scale
  const kpaTo5 = (kpaScore) => {
    if (kpaScore === null || kpaScore === undefined) return null;
    return parseFloat((kpaScore / 20).toFixed(2));
  };

  // Get rating label for a 1-5 score
  const getRatingLabel = (score) => {
    if (score === null || score === undefined) return '—';
    if (score >= 4.5) return 'Outstanding';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Average';
    if (score >= 1.5) return 'Below Average';
    return 'Poor';
  };

  return (
    <Layout>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, color: '#3C2415', letterSpacing: '-0.01em' }}>Annual Self-Appraisal</h1>

      <div style={{ marginBottom: 20 }}>
        <CycleSelector value={cycleId} onChange={setCycleId} minPhase="ANNUAL_APPRAISAL" />
      </div>

      {cycleId && (
        <>
          <Alert type={msg.type || 'info'} message={msg.text} />

          {isFinalized && appraisal.finalScore && (() => {
            const kpaRaw = appraisal.kpaScore;
            const kpaOn5 = kpaTo5(kpaRaw);
            const valuesOn5 = appraisal.valuesScore;
            const compOn5 = appraisal.competenciesScore;

            return (
              <Card style={{ marginBottom: 20, textAlign: 'center', background: '#FDF8EE', border: '1px solid #D4C090' }}>
                <div style={{ fontSize: 13, color: '#8B6914', fontWeight: 600, marginBottom: 6 }}>FINAL APPRAISAL RESULT</div>
                <div style={{ fontSize: 56, fontWeight: 900, color: RATING_BAND_COLOR[appraisal.ratingBand] || '#3C2415' }}>
                  {appraisal.finalScore} <span style={{ fontSize: 20, fontWeight: 500, color: '#6F4E37' }}>/ 5</span>
                </div>
                <Badge label={appraisal.ratingBand} />

                {/* Phase-wise Score Breakdown */}
                <div style={{ marginTop: 24, textAlign: 'left' }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#3C2415', textAlign: 'center' }}>Phase-wise Rating Breakdown</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {/* KPA Score */}
                    <div style={phaseCardStyle}>
                      <div style={phaseLabelStyle}>KPA Score (60%)</div>
                      <div style={phaseValStyle}>{kpaOn5 ?? '—'}<span style={outOf5Style}> / 5</span></div>
                      <div style={phaseRawStyle}>Raw: {kpaRaw ?? '—'} / 100</div>
                      <div style={{ ...phaseBandStyle, color: RATING_BAND_COLOR[getRatingLabel(kpaOn5)] }}>{getRatingLabel(kpaOn5)}</div>
                    </div>

                    {/* Values Score */}
                    <div style={phaseCardStyle}>
                      <div style={phaseLabelStyle}>Values Score (20%)</div>
                      <div style={phaseValStyle}>{valuesOn5 ?? '—'}<span style={outOf5Style}> / 5</span></div>
                      <div style={{ ...phaseBandStyle, color: RATING_BAND_COLOR[getRatingLabel(valuesOn5)] }}>{getRatingLabel(valuesOn5)}</div>
                    </div>

                    {/* Competencies Score */}
                    <div style={phaseCardStyle}>
                      <div style={phaseLabelStyle}>Competencies Score (20%)</div>
                      <div style={phaseValStyle}>{compOn5 ?? '—'}<span style={outOf5Style}> / 5</span></div>
                      <div style={{ ...phaseBandStyle, color: RATING_BAND_COLOR[getRatingLabel(compOn5)] }}>{getRatingLabel(compOn5)}</div>
                    </div>
                  </div>

                  {/* Overall computation display */}
                  <div style={{ marginTop: 16, background: '#FAF8F4', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#6F4E37', textAlign: 'center', border: '1px solid #E8DCC8' }}>
                    <strong>Overall:</strong> ({kpaOn5 ?? 0} × 0.60) + ({valuesOn5 ?? 0} × 0.20) + ({compOn5 ?? 0} × 0.20) = <strong style={{ color: '#3C2415', fontSize: 15 }}>{appraisal.finalScore}</strong>
                  </div>
                </div>
              </Card>
            );
          })()}

          <Card title="Self Assessment">
            {appraisal && (
              <div style={{ marginBottom: 12 }}>
                <Badge label={appraisal.status} />
                {!isDraft && (
                  <p style={{ fontSize: 13, color: '#6F4E37', marginTop: 8, fontWeight: 600 }}>
                    {getStatusLabel(appraisal.status)}
                  </p>
                )}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Achievements & Contributions *</label>
              <textarea
                style={{ width: '100%', padding: '12px', border: '1.5px solid #C4A882', borderRadius: 10, fontSize: 14, height: 180, resize: 'vertical', background: !isDraft ? '#FAF8F4' : '#fff', color: '#3C2415', fontFamily: "'Inter', sans-serif" }}
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                placeholder="Describe your key achievements, contributions, and outcomes for this appraisal year..."
                disabled={!isDraft}
              />
            </div>

            {/* KPA Self Ratings — always shown, read-only after submission */}
            {kpas.length > 0 && (
              <div style={{ marginTop: 24, marginBottom: 16 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#3C2415' }}>
                  {isDraft ? 'Self-Rate KPAs' : 'Your KPA Self-Ratings'}
                </h4>
                {!isDraft && (
                  <div style={{ fontSize: 12, color: '#8B6914', marginBottom: 10 }}>ℹ️ These are read-only after submission. Your ratings are visible to your reviewing officers.</div>
                )}
                {kpas.map((k) => (
                  <div key={k.id} style={{ padding: '14px 0', borderBottom: '1px solid #F5F0E8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#3C2415' }}>{k.title}</div>
                        <div style={{ fontSize: 12, color: '#6F4E37' }}>Weight: {k.weightage}%</div>
                      </div>
                      <input
                        type="number" min="0" max={k.weightage} step="0.1"
                        value={kpaRatings[k.id]?.rating || ''}
                        onChange={(e) => {
                          if (!isDraft) return;
                          let val = e.target.value;
                          if (val !== '' && Number(val) > k.weightage) val = k.weightage.toString();
                          setKpaRatings((p) => ({ ...p, [k.id]: { ...p[k.id], rating: val } }));
                        }}
                        placeholder={isDraft ? `Max ${k.weightage}` : '—'}
                        style={{ ...ratingInputStyle, opacity: isDraft ? 1 : 0.7, background: isDraft ? '#fff' : '#FAF8F4' }}
                        readOnly={!isDraft}
                      />
                    </div>
                    <textarea
                      value={kpaRatings[k.id]?.remarks || ''}
                      onChange={(e) => {
                        if (!isDraft) return;
                        setKpaRatings((p) => ({ ...p, [k.id]: { ...p[k.id], remarks: e.target.value } }));
                      }}
                      placeholder={isDraft ? 'Your achievements / remarks for this KPA...' : 'No remarks entered.'}
                      style={{ width: '100%', padding: '10px', border: '1px solid #E8DCC8', borderRadius: 8, fontSize: 13, resize: 'vertical', minHeight: 56, marginTop: 4, background: isDraft ? '#fff' : '#FAF8F4', color: '#3C2415', fontFamily: "'Inter', sans-serif" }}
                      readOnly={!isDraft}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Attribute Self Ratings — always shown, read-only after submission */}
            {(valuesAttrs.length > 0 || competencyAttrs.length > 0) && (
              <div style={{ marginTop: 24, marginBottom: 20 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#3C2415' }}>
                  {isDraft ? 'Self-Rate Values & Competencies (1-5)' : 'Your Values & Competencies Self-Ratings'}
                </h4>
                {!isDraft && (
                  <div style={{ fontSize: 12, color: '#8B6914', marginBottom: 10 }}>ℹ️ These are read-only after submission. Your ratings are visible to your reviewing officers.</div>
                )}
                {[{ label: 'Values', list: valuesAttrs }, { label: 'Competencies', list: competencyAttrs }].map(({ label, list }) => (
                  list.length > 0 && (
                    <div key={label} style={{ marginBottom: 16 }}>
                      <h5 style={{ fontSize: 14, fontWeight: 600, color: '#6F4E37', marginBottom: 8 }}>{label}</h5>
                      {list.map((attr) => (
                        <div key={attr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#3C2415' }}>{attr.name}</div>
                          <input
                            type="number" min="1" max="5" step="0.1"
                            value={attrRatings[attr.id]?.rating || ''}
                            onChange={(e) => {
                              if (!isDraft) return;
                              let val = e.target.value;
                              if (val !== '' && Number(val) > 5) val = '5';
                              if (val !== '' && Number(val) < 1) val = '1';
                              setAttrRatings((p) => ({ ...p, [attr.id]: { rating: val } }));
                            }}
                            placeholder={isDraft ? '1–5' : '—'}
                            style={{ ...ratingInputStyle, opacity: isDraft ? 1 : 0.7, background: isDraft ? '#fff' : '#FAF8F4' }}
                            readOnly={!isDraft}
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

          {/* Accepting Officer's Final KPA Ratings */}
          {isFinalized && (() => {
            const acceptingKpaRatings = getAcceptingKpaRatings();
            const kpaTotal = computeKpaTotal();
            const kpaOn5 = kpaTo5(kpaTotal);
            
            if (acceptingKpaRatings.length === 0) return null;
            return (
              <Card title="Final KPA Ratings — Accepting Officer" style={{ marginTop: 20, background: '#FAF8F4', border: '1px solid #E8DCC8' }}>
                {acceptingKpaRatings.map((r) => (
                  <div key={r.id} style={ratingRowStyle}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#3C2415' }}>{r.kpaGoal?.title}</div>
                      <div style={{ fontSize: 12, color: '#6F4E37' }}>Weight: {r.kpaGoal?.weightage}%</div>
                      {r.remarks && <div style={{ fontSize: 13, color: '#3C2415', marginTop: 4 }}>Remarks: {r.remarks}</div>}
                    </div>
                    <div style={ratingBubble(r.rating / (r.kpaGoal?.weightage || 1) * 5)}>{r.rating}</div>
                  </div>
                ))}
                <div style={{ marginTop: 16, padding: '14px 16px', background: '#F5F0E8', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#3C2415' }}>KPA Total</div>
                    <div style={{ fontSize: 12, color: '#6F4E37' }}>Raw: {kpaTotal} / 100 → Scaled: {kpaOn5} / 5</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: RATING_BAND_COLOR[getRatingLabel(kpaOn5)] || '#3C2415' }}>
                    {kpaOn5} <span style={{ fontSize: 13, fontWeight: 500, color: '#A0785A' }}>/ 5 ({getRatingLabel(kpaOn5)})</span>
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Accepting Officer's Final Values Ratings */}
          {isFinalized && (() => {
            const acceptingAttrRatings = getAcceptingAttrRatings();
            const valuesRatings = acceptingAttrRatings.filter(r => r.attribute?.type === 'VALUES');
            const valuesAvg = computeAttrAvg('VALUES');
            
            if (valuesRatings.length === 0) return null;
            return (
              <Card title="Final Values Ratings — Accepting Officer" style={{ marginTop: 20, background: '#FDF8EE', border: '1px solid #D4C090' }}>
                {valuesRatings.map((r) => (
                  <div key={r.id} style={ratingRowStyle}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#3C2415' }}>{r.attribute?.name}</div>
                      {r.remarks && <div style={{ fontSize: 13, color: '#6F4E37', marginTop: 4 }}>Remarks: {r.remarks}</div>}
                    </div>
                    <div style={ratingBubble(r.rating)}>{r.rating}</div>
                  </div>
                ))}
                <div style={{ marginTop: 16, padding: '14px 16px', background: '#FAF8F4', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#3C2415' }}>Values Average</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: RATING_BAND_COLOR[getRatingLabel(valuesAvg)] || '#3C2415' }}>
                    {valuesAvg} <span style={{ fontSize: 13, fontWeight: 500, color: '#A0785A' }}>/ 5 ({getRatingLabel(valuesAvg)})</span>
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Accepting Officer's Final Competencies Ratings */}
          {isFinalized && (() => {
            const acceptingAttrRatings = getAcceptingAttrRatings();
            const compRatings = acceptingAttrRatings.filter(r => r.attribute?.type === 'COMPETENCIES');
            const compAvg = computeAttrAvg('COMPETENCIES');
            
            if (compRatings.length === 0) return null;
            return (
              <Card title="Final Competencies Ratings — Accepting Officer" style={{ marginTop: 20, background: '#FAF8F4', border: '1px solid #E8DCC8' }}>
                {compRatings.map((r) => (
                  <div key={r.id} style={ratingRowStyle}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#3C2415' }}>{r.attribute?.name}</div>
                      {r.remarks && <div style={{ fontSize: 13, color: '#6F4E37', marginTop: 4 }}>Remarks: {r.remarks}</div>}
                    </div>
                    <div style={ratingBubble(r.rating)}>{r.rating}</div>
                  </div>
                ))}
                <div style={{ marginTop: 16, padding: '14px 16px', background: '#F5F0E8', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#3C2415' }}>Competencies Average</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: RATING_BAND_COLOR[getRatingLabel(compAvg)] || '#3C2415' }}>
                    {compAvg} <span style={{ fontSize: 13, fontWeight: 500, color: '#A0785A' }}>/ 5 ({getRatingLabel(compAvg)})</span>
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Only Accepting Officer's Final Remarks */}
          {isFinalized && appraisal?.acceptingRemarks && (
            <Card title="Final Remarks — Accepting Officer" style={{ marginTop: 20, background: '#FAF8F4', border: '1px solid #E8DCC8' }}>
              <p style={{ fontSize: 14, color: '#3C2415', lineHeight: 1.6 }}>{appraisal.acceptingRemarks}</p>
            </Card>
          )}
        </>
      )}
      <ConfirmModal 
        {...modalConfig} 
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />
    </Layout>
  );
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#6F4E37', marginBottom: 6 };
const ratingRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F5F0E8', gap: 12 };
const ratingBubble = (val) => ({
  width: 44, height: 44, borderRadius: '50%',
  background: val >= 4 ? '#E8DCC8' : val >= 3 ? '#FAF8F4' : '#FDF0F0',
  color: val >= 4 ? '#3C2415' : val >= 3 ? '#6F4E37' : '#8B3A3A',
  border: `1px solid ${val >= 4 ? '#C4A882' : val >= 3 ? '#D4C3BB' : '#D4A0A0'}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 800, fontSize: 16, flexShrink: 0,
});
const phaseCardStyle = { background: '#FAF8F4', borderRadius: 12, padding: '16px 18px', textAlign: 'center', border: '1px solid #E8DCC8' };
const phaseLabelStyle = { fontSize: 12, color: '#6F4E37', fontWeight: 600, marginBottom: 6 };
const phaseValStyle = { fontSize: 28, fontWeight: 900, color: '#3C2415' };
const outOf5Style = { fontSize: 14, fontWeight: 500, color: '#A0785A' };
const phaseRawStyle = { fontSize: 11, color: '#A0785A', marginTop: 2 };
const phaseBandStyle = { fontSize: 12, fontWeight: 700, marginTop: 4 };
const ratingInputStyle = {
  width: 70, padding: '8px 10px', border: '1.5px solid #C4A882',
  borderRadius: 8, fontSize: 13, fontWeight: 700, textAlign: 'center',
  color: '#3C2415', fontFamily: "'Inter', sans-serif"
};
