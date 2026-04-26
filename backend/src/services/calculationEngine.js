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

  // Group ratings by KPA
  const groups = {};
  for (const rating of kpaRatings) {
    if (!groups[rating.kpaGoalId]) groups[rating.kpaGoalId] = [];
    groups[rating.kpaGoalId].push(rating); // Store the full rating object to sort by date
  }

  let totalScore = 0;
  for (const goal of kpaGoals) {
    const ratingsForGoal = groups[goal.id];
    if (ratingsForGoal && ratingsForGoal.length > 0) {
      // Sort descending by updatedAt to get the most recent rating (final accepted rating)
      ratingsForGoal.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      const finalRating = ratingsForGoal[0].rating;
      totalScore += finalRating;
    }
  }

  return parseFloat(totalScore.toFixed(2));
}

function computeAttributeScore(attributeRatings, type) {
  const filtered = attributeRatings.filter((r) => r.attribute && r.attribute.type === type);
  if (filtered.length === 0) return null;

  // Group by attributeId
  const groups = {};
  for (const r of filtered) {
    if (!groups[r.attributeId]) groups[r.attributeId] = [];
    groups[r.attributeId].push(r);
  }

  let totalRating = 0;
  let count = 0;

  for (const attrId in groups) {
    const ratingsForAttr = groups[attrId];
    if (ratingsForAttr && ratingsForAttr.length > 0) {
      ratingsForAttr.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      totalRating += ratingsForAttr[0].rating;
      count++;
    }
  }

  if (count === 0) return null;

  const avg1to5 = totalRating / count;
  const outOf100 = (avg1to5 / 5) * 100;
  return parseFloat(outOf100.toFixed(2));
}

function computeFinalScore(kpaScore, valuesScore, competenciesScore, weights) {
  if (kpaScore === null) return null;
  const vs = valuesScore ?? 0;
  const cs = competenciesScore ?? 0;
  
  // Weights are in percentages (e.g., 60, 20, 20)
  const kW = (weights?.kpa ?? 60) / 100;
  const vW = (weights?.values ?? 20) / 100;
  const cW = (weights?.competencies ?? 20) / 100;

  const score = (kpaScore * kW) + (vs * vW) + (cs * cW);
  return parseFloat(score.toFixed(2));
}

function getRatingBand(score) {
  if (score === null) return null;
  if (score >= 90) return 'Outstanding';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Average';
  if (score >= 40) return 'Below Average';
  return 'Poor';
}

module.exports = { computeKpaScore, computeAttributeScore, computeFinalScore, getRatingBand };
