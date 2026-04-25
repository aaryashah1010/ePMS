import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import CycleSelector from '../../components/CycleSelector';
import { appraisalAPI, kpaAPI, attributeAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ACTION_MAP = {
  REPORTING_OFFICER: { requiredStatus: 'SUBMITTED', actionLabel: 'Mark Reporting Done', handler: 'reportingDone' },
  REVIEWING_OFFICER: { requiredStatus: 'REPORTING_DONE', actionLabel: 'Mark Reviewing Done', handler: 'reviewingDone' },
  ACCEPTING_OFFICER: { requiredStatus: 'REVIEWING_DONE', actionLabel: 'Accept & Finalize', handler: 'acceptingDone' },
};

export default function RatingPage() {
  const { user } = useAuth();
  const [cycleId, setCycleId] = useState('');
  const [appraisals, setAppraisals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [kpas, setKpas] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [kpaRatings, setKpaRatings] = useState({});
  const [attrRatings, setAttrRatings] = useState({});
  const [prevKpaRatings, setPrevKpaRatings] = useState({});
  const [prevAttrRatings, setPrevAttrRatings] = useState({});
  const [remarks, setRemarks] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);

  const action = ACTION_MAP[user?.role];
  
  let prevRatingLabel = "Previous Officer's Rating";
  if (user?.role === 'REVIEWING_OFFICER') prevRatingLabel = "Reporting Officer's Rating";
  else if (user?.role === 'ACCEPTING_OFFICER') prevRatingLabel = "Reviewing Officer's Rating";

  const loadAppraisals = async (cid) => {
    if (!cid) return;
    try {
      const r = await appraisalAPI.getTeam(cid);
      setAppraisals(r.data.appraisals || []);
    } catch { setAppraisals([]); }
  };

  useEffect(() => { loadAppraisals(cycleId); }, [cycleId]);

  const loadAttributes = async () => {
    const r = await attributeAPI.getAll({ isActive: 'true' });
    setAttributes(r.data.attributes || []);
  };

  useEffect(() => { loadAttributes(); }, []);

  const selectAppraisal = async (appraisal) => {
    setSelected(appraisal);
    setMsg({ type: '', text: '' });
    setRemarks('');

    // Load KPAs
    const kpaRes = await kpaAPI.getEmployee(cycleId, appraisal.user.id);
    const kpaList = kpaRes.data.kpas || [];
    setKpas(kpaList);

    // Pre-fill existing ratings and track previous ratings
    const kpaMap = {};
    const prevKpaMap = {};
    const sortedKpa = [...(appraisal.kpaRatings || [])].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    for (const r of sortedKpa) {
      if (r.ratedBy === user.id) kpaMap[r.kpaGoalId] = { rating: r.rating, remarks: r.remarks || '' };
      else prevKpaMap[r.kpaGoalId] = r;
    }

    const attrMap = {};
    const prevAttrMap = {};
    const sortedAttr = [...(appraisal.attributeRatings || [])].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    for (const r of sortedAttr) {
      if (r.ratedBy === user.id) attrMap[r.attributeId] = { rating: r.rating, remarks: r.remarks || '' };
      else prevAttrMap[r.attributeId] = r;
    }

    // Default current inputs to previous ratings if not already rated
    for (const k of kpaList) {
      if (!kpaMap[k.id] && prevKpaMap[k.id]) {
        kpaMap[k.id] = { rating: prevKpaMap[k.id].rating, remarks: prevKpaMap[k.id].remarks || '' };
      }
    }
    for (const a of appraisal.attributeRatings || []) {
      if (!attrMap[a.attributeId] && prevAttrMap[a.attributeId]) {
        attrMap[a.attributeId] = { rating: prevAttrMap[a.attributeId].rating, remarks: prevAttrMap[a.attributeId].remarks || '' };
      }
    }

    setKpaRatings(kpaMap);
    setPrevKpaRatings(prevKpaMap);
    setAttrRatings(attrMap);
    setPrevAttrRatings(prevAttrMap);
  };

  const loadFull = async (ap) => {
    const full = await appraisalAPI.getEmployee(cycleId, ap.user.id);
    selectAppraisal({ ...ap, ...full.data.appraisal });
  };

  const handleSaveRatings = async () => {
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      const kpaPayload = Object.entries(kpaRatings).map(([kpaGoalId, v]) => ({ kpaGoalId, rating: parseFloat(v.rating), remarks: v.remarks }));
      const attrPayload = Object.entries(attrRatings).map(([attributeId, v]) => ({ attributeId, rating: parseFloat(v.rating), remarks: v.remarks }));

      await Promise.all([
        kpaPayload.length ? appraisalAPI.saveKpaRatings(selected.id, kpaPayload) : Promise.resolve(),
        attrPayload.length ? appraisalAPI.saveAttributeRatings(selected.id, attrPayload) : Promise.resolve(),
      ]);
      setMsg({ type: 'success', text: 'Ratings saved.' });
      loadAppraisals(cycleId);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Save failed' });
    } finally { setSaving(false); }
  };

  const handleAction = async () => {
    if (!window.confirm(`${action.actionLabel}?`)) return;
    setActing(true);
    try {
      // Auto-save ratings silently before submitting the action
      const kpaPayload = Object.entries(kpaRatings).map(([kpaGoalId, v]) => ({ kpaGoalId, rating: parseFloat(v.rating), remarks: v.remarks }));
      const attrPayload = Object.entries(attrRatings).map(([attributeId, v]) => ({ attributeId, rating: parseFloat(v.rating), remarks: v.remarks }));
      
      await Promise.all([
        kpaPayload.length ? appraisalAPI.saveKpaRatings(selected.id, kpaPayload) : Promise.resolve(),
        attrPayload.length ? appraisalAPI.saveAttributeRatings(selected.id, attrPayload) : Promise.resolve(),
      ]);

      await appraisalAPI[action.handler](cycleId, selected.user.id, remarks);
      setMsg({ type: 'success', text: `${action.actionLabel} done.` });
      setSelected(null);
      loadAppraisals(cycleId);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Action failed' });
    } finally { setActing(false); }
  };

  const valuesAttrs = attributes.filter((a) => a.type === 'VALUES');
  const competencyAttrs = attributes.filter((a) => a.type === 'COMPETENCIES');
  
  const isEditable = action && selected?.status === action.requiredStatus;

  return (
    <Layout>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Rate Appraisals</h1>

      <div style={{ marginBottom: 20 }}>
        <CycleSelector value={cycleId} onChange={setCycleId} minPhase="ANNUAL_APPRAISAL" />
      </div>

      {cycleId && (
        <Alert type={msg.type || 'info'} message={msg.text} />
      )}

      {cycleId && !selected && (
        <Card title={`Team Appraisals (${appraisals.length})`}>
          {appraisals.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: 30 }}>No appraisals available.</p>
          ) : (
            appraisals.map((a) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.user?.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{a.user?.department} · {a.user?.employeeCode}</div>
                  {a.finalScore && <div style={{ fontSize: 13, marginTop: 4 }}>Score: <strong>{a.finalScore}</strong> · <Badge label={a.ratingBand} /></div>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge label={a.status} />
                  {action && a.status === action.requiredStatus && (
                    <Button size="sm" onClick={() => loadFull(a)}>Rate & Review</Button>
                  )}
                  {a.status !== action?.requiredStatus && (
                    <Button size="sm" variant="outline" onClick={() => loadFull(a)}>View</Button>
                  )}
                </div>
              </div>
            ))
          )}
        </Card>
      )}

      {selected && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setSelected(null)} style={{ marginBottom: 16 }}>
            ← Back to List
          </Button>

          <Card title={`Appraisal: ${selected.user?.name}`} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <Badge label={selected.status} />
              <span style={{ fontSize: 13, color: '#64748b' }}>{selected.user?.department}</span>
            </div>
            {selected.achievements && (
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 12 }}>
                <strong style={{ fontSize: 13 }}>Employee Achievements:</strong>
                <p style={{ fontSize: 13, marginTop: 6, color: '#374151' }}>{selected.achievements}</p>
              </div>
            )}
          </Card>

          {/* KPA Ratings */}
          {kpas.length > 0 && (
            <Card title="Rate KPAs (0 – Weightage)" style={{ marginBottom: 16 }}>
              {kpas.map((k) => (
                <div key={k.id} style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{k.title}</div>
                      <span style={weightBadge}>{k.weightage}%</span>
                      {prevKpaRatings[k.id] && (
                        <div style={{ fontSize: 12, color: '#d97706', marginTop: 4, fontWeight: 600 }}>
                          {prevRatingLabel}: {prevKpaRatings[k.id].rating}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {prevKpaRatings[k.id] && isEditable && (
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Accept or Override?</div>
                      )}
                      <input
                        type="number" min="0" max={k.weightage} step="0.1"
                        value={kpaRatings[k.id]?.rating || ''}
                        onChange={(e) => setKpaRatings((p) => ({ ...p, [k.id]: { ...p[k.id], rating: Math.min(Math.max(0, e.target.value), k.weightage) } }))}
                        placeholder={`Max ${k.weightage}`}
                        style={ratingInputStyle}
                        disabled={!isEditable}
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={kpaRatings[k.id]?.remarks || ''}
                    onChange={(e) => setKpaRatings((p) => ({ ...p, [k.id]: { ...p[k.id], remarks: e.target.value } }))}
                    placeholder="Remarks (optional)"
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}
                    disabled={!isEditable}
                  />
                </div>
              ))}
            </Card>
          )}

          {/* Attribute Ratings */}
          {(valuesAttrs.length > 0 || competencyAttrs.length > 0) && (
            <Card title="Rate Values & Competencies (1–5)" style={{ marginBottom: 16 }}>
              {[{ label: 'Values', list: valuesAttrs }, { label: 'Competencies', list: competencyAttrs }].map(({ label, list }) => (
                list.length > 0 && (
                  <div key={label} style={{ marginBottom: 20 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f', marginBottom: 12 }}>{label}</h4>
                    {list.map((attr) => (
                      <div key={attr.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>{attr.name}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{attr.description}</div>
                            {prevAttrRatings[attr.id] && (
                              <div style={{ fontSize: 12, color: '#d97706', marginTop: 4, fontWeight: 600 }}>
                                {prevRatingLabel}: {prevAttrRatings[attr.id].rating}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {prevAttrRatings[attr.id] && isEditable && (
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Accept or Override?</div>
                            )}
                            <input
                              type="number" min="1" max="5" step="0.1"
                              value={attrRatings[attr.id]?.rating || ''}
                              onChange={(e) => setAttrRatings((p) => ({ ...p, [attr.id]: { rating: e.target.value } }))}
                              placeholder="1–5"
                              style={ratingInputStyle}
                              disabled={!isEditable}
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          value={attrRatings[attr.id]?.remarks || ''}
                          onChange={(e) => setAttrRatings((p) => ({ ...p, [attr.id]: { ...p[attr.id], remarks: e.target.value } }))}
                          placeholder="Remarks (optional)"
                          style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}
                          disabled={!isEditable}
                        />
                      </div>
                    ))}
                  </div>
                )
              ))}
            </Card>
          )}

          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Remarks for {action?.actionLabel}
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Your assessment remarks..."
                  style={{ width: '100%', padding: 10, border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, height: 80, resize: 'vertical' }}
                  disabled={!isEditable}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              {isEditable && (
                <>
                  <Button onClick={handleSaveRatings} loading={saving} variant="outline">Save Draft Ratings</Button>
                  <Button onClick={handleAction} loading={acting} variant="success">
                    {action.actionLabel}
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}

const weightBadge = {
  display: 'inline-block', background: '#dbeafe', color: '#1d4ed8',
  padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700,
};
const ratingInputStyle = {
  width: 80, padding: '6px 10px', border: '1.5px solid #d1d5db',
  borderRadius: 8, fontSize: 14, fontWeight: 700, textAlign: 'center',
};
