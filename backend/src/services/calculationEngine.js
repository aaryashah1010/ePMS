/**
 * Calculation Engine for e-PMS
 *
 * KPA Score = SUM(weight × rating) out of 100, then /20 → 1-5 scale
 * Values Score = AVG(values ratings) → already 1-5
 * Competencies Score = AVG(competencies ratings) → already 1-5
 * Overall = (KPA_1to5 × 0.60) + (Values × 0.20) + (Competencies × 0.20) → 1-5 scale
 *
 * Rating Band (1-5):
 *   4.5 - 5.0  → Outstanding
 *   3.5 - 4.49 → Good
 *   2.5 - 3.49 → Average
 *   1.5 - 2.49 → Below Average
 *   1.0 - 1.49 → Poor
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

  // totalScore is out of 100 (sum of weighted KPA ratings)
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

  // Return average on 1-5 scale (values and competencies are rated 1-5)
  const avg1to5 = totalRating / count;
  return parseFloat(avg1to5.toFixed(2));
}

function computeFinalScore(kpaScore, valuesScore, competenciesScore, weights) {
  if (kpaScore === null) return null;
  
  // Convert KPA score from 0-100 to 1-5 scale by dividing by 20
  const kpa1to5 = kpaScore / 20;
  const vs = valuesScore ?? 0; // already 1-5
  const cs = competenciesScore ?? 0; // already 1-5
  
  // Weights are in percentages (e.g., 60, 20, 20)
  const kW = (weights?.kpa ?? 60) / 100;
  const vW = (weights?.values ?? 20) / 100;
  const cW = (weights?.competencies ?? 20) / 100;

  // Result is on 1-5 scale
  const score = (kpa1to5 * kW) + (vs * vW) + (cs * cW);
  return parseFloat(score.toFixed(2));
}

function getRatingBand(score) {
  if (score === null) return null;
  if (score >= 4.5) return 'Outstanding';
  if (score >= 3.5) return 'Good';
  if (score >= 2.5) return 'Average';
  if (score >= 1.5) return 'Below Average';
  return 'Poor';
}

module.exports = { computeKpaScore, computeAttributeScore, computeFinalScore, getRatingBand };
