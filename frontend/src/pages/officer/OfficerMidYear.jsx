import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import CycleSelector from '../../components/CycleSelector';
import { midYearAPI } from '../../services/api';

export default function OfficerMidYear() {
  const [cycleId, setCycleId] = useState('');
  const [midReviews, setMidReviews] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [remarkMap, setRemarkMap] = useState({});
  const [ratingMap, setRatingMap] = useState({});
  const [submitting, setSubmitting] = useState('');

  const load = async (cid) => {
    if (!cid) return;
    try {
      const m = await midYearAPI.getTeam(cid);
      setMidReviews(m.data.reviews || []);
    } catch (err) {
      setMidReviews([]);
    }
  };

  useEffect(() => { load(cycleId); }, [cycleId]);

  const handleAddRemark = async (userId) => {
    const remarks = remarkMap[userId];
    const rating = ratingMap[userId];
    if (!remarks?.trim()) return setMsg({ type: 'error', text: 'Please enter remarks.' });
    if (!rating) return setMsg({ type: 'error', text: 'Please enter a manager rating.' });
    setSubmitting(userId);
    try {
      await midYearAPI.addRemarks(cycleId, userId, remarks, parseFloat(rating));
      setMsg({ type: 'success', text: 'Remarks and rating added.' });
      load(cycleId);
      setRemarkMap((prev) => ({ ...prev, [userId]: '' }));
      setRatingMap((prev) => ({ ...prev, [userId]: '' }));
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
    } finally { setSubmitting(''); }
  };

  return (
    <Layout>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Mid-Year Reviews (Team)</h1>
      <div style={{ marginBottom: 20 }}>
        <CycleSelector value={cycleId} onChange={setCycleId} minPhase="MID_YEAR_REVIEW" />
      </div>

      {cycleId && (
        <>
          <Alert type={msg.type || 'info'} message={msg.text} />

          {midReviews.length === 0 ? (
            <Card><p style={{ color: '#94a3b8', textAlign: 'center', padding: 30 }}>No mid-year reviews submitted.</p></Card>
          ) : (
            midReviews.map((r) => (
              <Card key={r.id} title={`${r.user?.name} — Mid-Year`} style={{ marginBottom: 16 }}>
                <Badge label={r.status} />
                <p style={{ marginTop: 12, fontSize: 14, color: '#1e293b' }}>{r.progress}</p>
                {r.selfRating && <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Self Rating: {r.selfRating}</p>}
                {r.reportingRemarks && (
                  <div style={{ marginTop: 12, background: '#f0fdf4', padding: 12, borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: 13 }}>Your Remarks:</strong>
                      {r.managerRating && <strong style={{ fontSize: 13, color: '#166534' }}>Rating: {r.managerRating}</strong>}
                    </div>
                    <p style={{ fontSize: 13, marginTop: 4 }}>{r.reportingRemarks}</p>
                  </div>
                )}
                {r.status === 'SUBMITTED' && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Manager Rating (1-5)</label>
                      <input
                        type="number" min="1" max="5" step="0.1"
                        value={ratingMap[r.userId] || ''}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val !== '' && Number(val) > 5) val = '5';
                          setRatingMap((prev) => ({ ...prev, [r.userId]: val }));
                        }}
                        placeholder="1-5"
                        style={{ width: 80, padding: '6px 10px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, fontWeight: 700 }}
                      />
                    </div>
                    <textarea
                      value={remarkMap[r.userId] || ''}
                      onChange={(e) => setRemarkMap((prev) => ({ ...prev, [r.userId]: e.target.value }))}
                      placeholder="Enter your remarks..."
                      style={{ width: '100%', padding: 10, border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, height: 80, resize: 'vertical' }}
                    />
                    <button
                      onClick={() => handleAddRemark(r.userId)}
                      disabled={submitting === r.userId}
                      style={remarkBtnStyle}
                    >
                      {submitting === r.userId ? 'Saving...' : 'Submit Remarks & Rating'}
                    </button>
                  </div>
                )}
              </Card>
            ))
          )}
        </>
      )}
    </Layout>
  );
}

const remarkBtnStyle = {
  marginTop: 8, padding: '8px 18px', background: '#2563eb', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
