import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLI = join(import.meta.dir, "..", "src", "cli.ts");

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "repo-doctor-cli-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function runCli(
  args: string[],
  cwd = dir
): Promise<{ stdout: string; stderr: string; code: number }> {
  const proc = Bun.spawn(["bun", "run", CLI, ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, NO_COLOR: "1" },
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout, stderr, code };
}

describe("CLI: --version and --help", () => {
  test("--version prints the version", async () => {
    const { stdout, code } = await runCli(["--version"]);
    expect(code).toBe(0);
    expect(stdout).toMatch(/repo-doctor \d+\.\d+\.\d+/);
  });

  test("--help prints usage", async () => {
    const { stdout, code } = await runCli(["--help"]);
    expect(code).toBe(0);
    expect(stdout).toContain("Usage");
    expect(stdout).toContain("repo-doctor");
  });
});

describe("CLI: scan --json", () => {
  test("emits a valid JSON document with expected shape", async () => {
    await Bun.write(
      join(dir, "package.json"),
      JSON.stringify({ name: "demo", version: "0.0.1" })
    );
    const { stdout, code } = await runCli(["scan", "--json"]);
    expect(code).toBe(0);
    const parsed = JSON.parse(stdout);
    expect(typeof parsed.score).toBe("number");
    expect(typeof parsed.status).toBe("string");
    expect(typeof parsed.ready).toBe("boolean");
    expect(Array.isArray(parsed.blockers)).toBe(true);
    expect(Array.isArray(parsed.warnings)).toBe(true);
    expect(Array.isArray(parsed.passed)).toBe(true);
  });

  test("json output contains no ANSI escape sequences", async () => {
    await Bun.write(
      join(dir, "package.json"),
      JSON.stringify({ name: "demo", version: "0.0.1" })
    );
    const { stdout } = await runCli(["scan", "--json"]);
    // eslint-disable-next-line no-control-regex
    expect(stdout).not.toMatch(/\x1b\[/);
  });
});

describe("CLI: scan --ci", () => {
  test("exits 1 when blockers exist (missing package.json)", async () => {
    const { code } = await runCli(["scan", "--ci"]);
    expect(code).toBe(1);
  });

  test("exits 0 when only warnings exist", async () => {
    await Bun.write(
      join(dir, "package.json"),
      JSON.stringify({
        name: "demo",
        version: "0.0.1",
        scripts: { build: "echo", test: "echo", lint: "echo", typecheck: "echo" },
      })
    );
    await Bun.write(join(dir, "bun.lock"), "");
    const { code } = await runCli(["scan", "--ci"]);
    expect(code).toBe(0);
  });
});

describe("CLI: unknown command", () => {
  test("exits with code 2", async () => {
    const { code, stderr } = await runCli(["explode"]);
    expect(code).toBe(2);
    expect(stderr).toContain("unknown command");
  });
});
