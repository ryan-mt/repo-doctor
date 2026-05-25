import { describe, expect, test } from "bun:test";
import { hasBlockers, scoreResults, statusFromResults } from "../src/core/score.ts";
import type { CheckResult } from "../src/types.ts";

function pass(id: string, severity: CheckResult["severity"] = "info"): CheckResult {
  return { id, name: id, status: "pass", severity };
}
function fail(id: string, severity: CheckResult["severity"] = "blocker"): CheckResult {
  return { id, name: id, status: "fail", severity };
}
function warn(id: string, severity: CheckResult["severity"] = "warning"): CheckResult {
  return { id, name: id, status: "warn", severity };
}

describe("scoreResults", () => {
  test("all passing returns 100", () => {
    expect(scoreResults([pass("a"), pass("b"), pass("c")])).toBe(100);
  });

  test("empty results returns 100", () => {
    expect(scoreResults([])).toBe(100);
  });

  test("blocker fail drops score", () => {
    const score = scoreResults([pass("a"), fail("b", "blocker")]);
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test("warning weighs half on warn status", () => {
    const passOnly = scoreResults([pass("a", "warning"), pass("b", "warning")]);
    const halfWarn = scoreResults([pass("a", "warning"), warn("b", "warning")]);
    expect(halfWarn).toBeLessThan(passOnly);
  });

  test("score is clamped between 0 and 100", () => {
    const allBlockers = scoreResults([
      fail("a", "blocker"),
      fail("b", "blocker"),
      fail("c", "blocker"),
    ]);
    expect(allBlockers).toBe(0);
  });
});

describe("hasBlockers", () => {
  test("returns true when a blocker fails", () => {
    expect(hasBlockers([fail("x", "blocker")])).toBe(true);
  });
  test("returns false when only warnings fail", () => {
    expect(hasBlockers([fail("x", "warning")])).toBe(false);
  });
  test("returns false for empty input", () => {
    expect(hasBlockers([])).toBe(false);
  });
});

describe("statusFromResults", () => {
  test("blocker → not ready to deploy", () => {
    expect(statusFromResults([fail("x", "blocker")])).toBe("Not ready to deploy");
  });
  test("warnings only → ready with warnings", () => {
    expect(statusFromResults([warn("x")])).toBe("Ready with warnings");
  });
  test("all pass → ready", () => {
    expect(statusFromResults([pass("x"), pass("y")])).toBe("Ready");
  });
});
