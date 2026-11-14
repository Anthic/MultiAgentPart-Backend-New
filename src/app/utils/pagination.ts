// Parse a user-supplied integer query value and clamp it to a safe range.
// Prevents limit=1000000 (full-collection dumps) and NaN / negative values.
export const clampInt = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number => {
  const parsed = parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};
