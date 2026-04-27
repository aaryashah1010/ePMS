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

test('computeAttributeScore averages the latest attribute ratings on a 1-5 scale', () => {
  const score = computeAttributeScore(
    [
      { attributeId: 'a1', rating: 3, updatedAt: '2026-01-01T00:00:00Z', attribute: { type: 'VALUES' } },
      { attributeId: 'a1', rating: 4, updatedAt: '2026-02-01T00:00:00Z', attribute: { type: 'VALUES' } },
      { attributeId: 'a2', rating: 5, updatedAt: '2026-03-01T00:00:00Z', attribute: { type: 'VALUES' } },
      { attributeId: 'a3', rating: 1, updatedAt: '2026-01-01T00:00:00Z', attribute: { type: 'COMPETENCIES' } },
    ],
    'VALUES',
  );

  // Latest per attribute: a1=4, a2=5 → avg = 4.5
  assert.equal(score, 4.5);
});

test('computeAttributeScore returns null when no ratings match the requested type', () => {
  const score = computeAttributeScore(
    [{ attributeId: 'a1', rating: 5, attribute: { type: 'COMPETENCIES' } }],
    'VALUES',
  );
  assert.equal(score, null);
});

test('computeFinalScore converts KPA from 0-100 to 1-5 and applies weights', () => {
  // kpa=82 → 4.1 (×0.50 = 2.05), values null → 0, competencies=4 (×0.25 = 1)
  const score = computeFinalScore(82, null, 4, { kpa: 50, values: 25, competencies: 25 });
  assert.equal(score, 3.05);
});

test('computeFinalScore returns null when KPA is null', () => {
  assert.equal(computeFinalScore(null, 4, 4, { kpa: 60, values: 20, competencies: 20 }), null);
});

test('getRatingBand maps 1-5 scores to bands', () => {
  assert.equal(getRatingBand(4.6), 'Outstanding');
  assert.equal(getRatingBand(3.8), 'Good');
  assert.equal(getRatingBand(2.7), 'Average');
  assert.equal(getRatingBand(1.6), 'Below Average');
  assert.equal(getRatingBand(1.2), 'Poor');
  assert.equal(getRatingBand(null), null);
});
