// architecture: float tolerances for tests (geo-math.md: never `toBe` on floats).
export const EPS_M = 1e-6;
export const EPS_S = 1e-6;
export const EPS_DEG = 1e-9;

export const approxEqual = (a: number, b: number, eps: number): boolean => Math.abs(a - b) <= eps;
