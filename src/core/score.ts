import type { CheckResult } from "../types.ts";

const WEIGHTS: Record<CheckResult["severity"], number> = {
  blocker: 25,
  warning: 8,
  info: 2,
};

export function scoreResults(results: CheckResult[]): number {
  if (results.length === 0) return 100;

  let total = 0;
  let lost = 0;

  for (const r of results) {
    if (r.status === "skip") continue;
    const weight = WEIGHTS[r.severity];
    total += weight;
    if (r.status === "fail") {
      lost += weight;
    } else if (r.status === "warn") {
      lost += weight * 0.5;
    }
  }

  if (total === 0) return 100;
  const score = Math.round(((total - lost) / total) * 100);
  return Math.max(0, Math.min(100, score));
}

export function hasBlockers(results: CheckResult[]): boolean {
  return results.some((r) => r.severity === "blocker" && r.status === "fail");
}

export function statusFromResults(results: CheckResult[]): string {
  if (hasBlockers(results)) return "Not ready to deploy";
  const hasWarnings = results.some(
    (r) => r.status === "warn" || r.status === "fail"
  );
  if (hasWarnings) return "Ready with warnings";
  return "Ready";
}
