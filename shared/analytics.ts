export function pearsonCorrelation(pairs: Array<{ x: number; y: number }>): number | null {
  if (pairs.length < 2) return null;

  const xMean = pairs.reduce((total, pair) => total + pair.x, 0) / pairs.length;
  const yMean = pairs.reduce((total, pair) => total + pair.y, 0) / pairs.length;
  const numerator = pairs.reduce(
    (total, pair) => total + (pair.x - xMean) * (pair.y - yMean),
    0,
  );
  const xVariance = pairs.reduce((total, pair) => total + (pair.x - xMean) ** 2, 0);
  const yVariance = pairs.reduce((total, pair) => total + (pair.y - yMean) ** 2, 0);
  const denominator = Math.sqrt(xVariance * yVariance);

  return denominator === 0 ? null : numerator / denominator;
}

export function secondsBetween(start: Date, end: Date): number {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
}
