import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectProject } from "../src/core/detect-project.ts";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "repo-doctor-detect-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("detectProject — package manager detection", () => {
  test("unknown when nothing is present", async () => {
    const info = await detectProject(dir);
    expect(info.packageManager).toBe("unknown");
    expect(info.hasPackageJson).toBe(false);
  });

  test("derives from packageManager field when present", async () => {
    await Bun.write(
      join(dir, "package.json"),
      JSON.stringify({ name: "x", packageManager: "pnpm@9.1.0" })
    );
    const info = await detectProject(dir);
    expect(info.packageManager).toBe("pnpm");
  });

  test("packageManager field beats lockfile", async () => {
    await Bun.write(
      join(dir, "package.json"),
      JSON.stringify({ name: "x", packageManager: "bun@1.1.0" })
    );
    await Bun.write(join(dir, "package-lock.json"), "{}");
    const info = await detectProject(dir);
    expect(info.packageManager).toBe("bun");
  });

  test("falls back to lockfile when field is absent", async () => {
    await Bun.write(
      join(dir, "package.json"),
      JSON.stringify({ name: "x" })
    );
    await Bun.write(join(dir, "yarn.lock"), "");
    const info = await detectProject(dir);
    expect(info.packageManager).toBe("yarn");
  });

  test("invalid packageManager field is ignored and falls back", async () => {
    await Bun.write(
      join(dir, "package.json"),
      JSON.stringify({ name: "x", packageManager: "weirdpm@1.0" })
    );
    await Bun.write(join(dir, "bun.lock"), "");
    const info = await detectProject(dir);
    expect(info.packageManager).toBe("bun");
  });

  test("malformed package.json is reported via packageJsonError", async () => {
    await Bun.write(join(dir, "package.json"), "{ broken");
    const info = await detectProject(dir);
    expect(info.hasPackageJson).toBe(true);
    expect(info.packageJson).toBeNull();
    expect(info.packageJsonError).not.toBeNull();
  });
});
