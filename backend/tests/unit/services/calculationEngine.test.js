const test = require('node:test');
const assert = require('node:assert/strict');

const {
  computeKpaScore,
  computeAttributeScore,
  computeFinalScore,
  getRatingBand,
} = require('../../../src/services/calculationEngine');

test('computeKpaScore uses the latest rating per KPA goal', () => {
  const score = computeKpaScore(
    [{ id: 'k1' }, { id: 'k2' }],
    [
      { kpaGoalId: 'k1', rating: 20, updatedAt: '2026-01-01T00:00:00Z' },
      { kpaGoalId: 'k1', rating: 30, updatedAt: '2026-02-01T00:00:00Z' },
      { kpaGoalId: 'k2', rating: 40, updatedAt: '2026-03-01T00:00:00Z' },
    ],
  );

  assert.equal(score, 70);
});

test('computeAttributeScore averages the latest attribute ratings and scales to 100', () => {
  const score = computeAttributeScore(
    [
      { attributeId: 'a1', rating: 3, updatedAt: '2026-01-01T00:00:00Z', attribute: { type: 'VALUES' } },
      { attributeId: 'a1', rating: 4, updatedAt: '2026-02-01T00:00:00Z', attribute: { type: 'VALUES' } },
      { attributeId: 'a2', rating: 5, updatedAt: '2026-03-01T00:00:00Z', attribute: { type: 'VALUES' } },
      { attributeId: 'a3', rating: 1, updatedAt: '2026-01-01T00:00:00Z', attribute: { type: 'COMPETENCIES' } },
    ],
    'VALUES',
  );

  assert.equal(score, 90);
});

test('computeFinalScore honors configured weights and tolerates missing attribute scores', () => {
  const score = computeFinalScore(82, null, 70, { kpa: 50, values: 25, competencies: 25 });
  assert.equal(score, 58.5);
});

test('getRatingBand returns correct score buckets', () => {
  assert.equal(getRatingBand(95), 'Outstanding');
  assert.equal(getRatingBand(75), 'Good');
  assert.equal(getRatingBand(60), 'Average');
  assert.equal(getRatingBand(45), 'Below Average');
  assert.equal(getRatingBand(12), 'Poor');
  assert.equal(getRatingBand(null), null);
});
