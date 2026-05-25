import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkPackageJson } from "../src/checks/package-json.ts";
import { checkScripts } from "../src/checks/scripts.ts";
import { checkLockfile } from "../src/checks/lockfile.ts";
import { checkEnv } from "../src/checks/env.ts";
import { checkGit } from "../src/checks/git.ts";
import { runChecks } from "../src/core/run-checks.ts";
import { buildReport } from "../src/core/report.ts";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "repo-doctor-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("checkPackageJson", () => {
  test("missing file is blocker", async () => {
    const { result, packageJson } = await checkPackageJson(dir);
    expect(result.status).toBe("fail");
    expect(result.severity).toBe("blocker");
    expect(packageJson).toBeNull();
  });

  test("invalid JSON is blocker", async () => {
    await Bun.write(join(dir, "package.json"), "{ not valid json");
    const { result, packageJson } = await checkPackageJson(dir);
    expect(result.status).toBe("fail");
    expect(result.severity).toBe("blocker");
    expect(packageJson).toBeNull();
  });

  test("valid package.json passes", async () => {
    await Bun.write(
      join(dir, "package.json"),
      JSON.stringify({ name: "x", version: "0.0.1" })
    );
    const { result, packageJson } = await checkPackageJson(dir);
    expect(result.status).toBe("pass");
    expect(packageJson?.name).toBe("x");
  });
});

describe("checkScripts", () => {
  test("no package.json yields no results", () => {
    expect(checkScripts(null)).toEqual([]);
  });

  test("missing build/test reported as warnings", () => {
    const results = checkScripts({ scripts: {} });
    const ids = results.map((r) => r.id);
    expect(ids).toContain("script-build");
    expect(ids).toContain("script-test");
    const build = results.find((r) => r.id === "script-build")!;
    expect(build.status).toBe("warn");
    expect(build.severity).toBe("warning");
  });

  test("present scripts pass", () => {
    const results = checkScripts({
      scripts: { build: "bun build src/cli.ts", test: "bun test" },
    });
    const build = results.find((r) => r.id === "script-build")!;
    expect(build.status).toBe("pass");
  });
});

describe("checkLockfile", () => {
  test("no lockfile yields warning", async () => {
    const { results, packageManager } = await checkLockfile(dir);
    expect(packageManager).toBe("unknown");
    expect(results[0]!.status).toBe("warn");
  });

  test("single bun.lock passes and reports bun", async () => {
    await Bun.write(join(dir, "bun.lock"), "");
    const { results, packageManager } = await checkLockfile(dir);
    expect(packageManager).toBe("bun");
    expect(results[0]!.status).toBe("pass");
  });

  test("multiple lockfiles is blocker", async () => {
    await Bun.write(join(dir, "bun.lock"), "");
    await Bun.write(join(dir, "package-lock.json"), "{}");
    const { results } = await checkLockfile(dir);
    expect(results[0]!.severity).toBe("blocker");
    expect(results[0]!.status).toBe("fail");
  });
});

describe("checkEnv", () => {
  test("no .env yields no result", async () => {
    expect(await checkEnv(dir)).toEqual([]);
  });

  test(".env without .env.example warns", async () => {
    await Bun.write(join(dir, ".env"), "SECRET=1");
    const results = await checkEnv(dir);
    expect(results[0]!.status).toBe("warn");
    expect(results[0]!.id).toBe("env-example");
  });

  test(".env.example present passes", async () => {
    await Bun.write(join(dir, ".env.example"), "SECRET=");
    const results = await checkEnv(dir);
    expect(results[0]!.status).toBe("pass");
  });
});

describe("checkGit", () => {
  test("missing git warns", async () => {
    const results = await checkGit(dir);
    expect(results[0]!.id).toBe("git-repo");
    expect(results[0]!.status).toBe("warn");
  });
});

describe("runChecks integration", () => {
  test("missing package.json builds a blocker report", async () => {
    const results = await runChecks({ root: dir });
    const report = buildReport(results);
    expect(report.ready).toBe(false);
    expect(report.blockers.length).toBeGreaterThan(0);
    expect(report.score).toBeLessThan(100);
  });

  test("clean project with package.json builds a healthier report", async () => {
    await Bun.write(
      join(dir, "package.json"),
      JSON.stringify({
        name: "demo",
        version: "0.1.0",
        scripts: { build: "x", test: "x", lint: "x", typecheck: "x" },
      })
    );
    await Bun.write(join(dir, "bun.lock"), "");
    const results = await runChecks({ root: dir });
    const report = buildReport(results);
    expect(report.blockers.length).toBe(0);
    expect(report.score).toBeGreaterThan(50);
  });
});
