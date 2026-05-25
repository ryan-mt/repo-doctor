import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isRunnableScript, runScript } from "../src/checks/scripts.ts";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "repo-doctor-run-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("isRunnableScript", () => {
  test("accepts allow-listed scripts", () => {
    expect(isRunnableScript("build")).toBe(true);
    expect(isRunnableScript("test")).toBe(true);
    expect(isRunnableScript("lint")).toBe(true);
    expect(isRunnableScript("typecheck")).toBe(true);
  });

  test("rejects everything else", () => {
    expect(isRunnableScript("publish")).toBe(false);
    expect(isRunnableScript("postinstall")).toBe(false);
    expect(isRunnableScript("anything")).toBe(false);
  });
});

describe("runScript", () => {
  test("rejects a script that isn't on the allow-list", async () => {
    await Bun.write(
      join(dir, "package.json"),
      JSON.stringify({ scripts: { publish: "echo nope" } })
    );
    const result = await runScript(dir, "bun", "publish");
    expect(result.ok).toBe(false);
    expect(result.output).toContain("allow-list");
  });

  test("returns ok=true when an allow-listed script succeeds", async () => {
    await Bun.write(
      join(dir, "package.json"),
      JSON.stringify({ scripts: { test: "true" } })
    );
    const result = await runScript(dir, "bun", "test");
    expect(result.ok).toBe(true);
    expect(result.timedOut).toBe(false);
  });

  test("returns ok=false when the script exits non-zero", async () => {
    await Bun.write(
      join(dir, "package.json"),
      JSON.stringify({ scripts: { lint: "exit 7" } })
    );
    const result = await runScript(dir, "bun", "lint");
    expect(result.ok).toBe(false);
    expect(result.timedOut).toBe(false);
  });

  test("times out a long-running script and reports it", async () => {
    await Bun.write(
      join(dir, "package.json"),
      JSON.stringify({ scripts: { build: "sleep 5" } })
    );
    const result = await runScript(dir, "bun", "build", { timeoutMs: 200 });
    expect(result.timedOut).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.output).toContain("timed out");
  });
});
