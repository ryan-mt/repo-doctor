import type { CheckResult, Report } from "../types.ts";
import { hasBlockers, scoreResults, statusFromResults } from "./score.ts";

export function buildReport(results: CheckResult[]): Report {
  const blockers: CheckResult[] = [];
  const warnings: CheckResult[] = [];
  const passed: CheckResult[] = [];
  const skipped: CheckResult[] = [];

  for (const r of results) {
    if (r.status === "skip") {
      skipped.push(r);
    } else if (r.status === "fail" && r.severity === "blocker") {
      blockers.push(r);
    } else if (r.status === "fail" || r.status === "warn") {
      warnings.push(r);
    } else if (r.status === "pass") {
      passed.push(r);
    }
  }

  const score = scoreResults(results);
  const status = statusFromResults(results);

  return {
    score,
    status,
    ready: !hasBlockers(results),
    blockers,
    warnings,
    passed,
    skipped,
  };
}

export function reportToJson(report: Report): string {
  return JSON.stringify(report, null, 2);
}
