/**
 * Calculation Engine for e-PMS
 *
 * Weighted KPA Score = SUM(weight × rating) / 100
 * Values Score = AVG(values ratings)
 * Competencies Score = AVG(competencies ratings)
 * Overall = (KPA × 0.60) + (Values × 0.20) + (Competencies × 0.20)
 */

function computeKpaScore(kpaGoals, kpaRatings) {
  if (!kpaRatings || kpaRatings.length === 0) return null;

  let weightedSum = 0;
  for (const rating of kpaRatings) {
    const goal = kpaGoals.find((g) => g.id === rating.kpaGoalId);
    if (goal) {
      weightedSum += (goal.weightage * rating.rating);
    }
  }
  return parseFloat((weightedSum / 100).toFixed(2));
}

function computeAttributeScore(attributeRatings, type) {
  const filtered = attributeRatings.filter((r) => r.attribute && r.attribute.type === type);
  if (filtered.length === 0) return null;
  const avg = filtered.reduce((s, r) => s + r.rating, 0) / filtered.length;
  return parseFloat(avg.toFixed(2));
}

function computeFinalScore(kpaScore, valuesScore, competenciesScore) {
  if (kpaScore === null) return null;
  const vs = valuesScore ?? 0;
  const cs = competenciesScore ?? 0;
  const score = (kpaScore * 0.60) + (vs * 0.20) + (cs * 0.20);
  return parseFloat(score.toFixed(2));
}

function getRatingBand(score) {
  if (score === null) return null;
  if (score < 2) return 'Poor';
  if (score < 3) return 'Below Average';
  if (score < 4) return 'Average';
  if (score < 5) return 'Good';
  return 'Outstanding';
}

module.exports = { computeKpaScore, computeAttributeScore, computeFinalScore, getRatingBand };
