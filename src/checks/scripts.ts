import type { CheckResult } from "../types.ts";

interface ScriptSpec {
  id: string;
  name: string;
  severity: "blocker" | "warning" | "info";
}

const REQUIRED_SCRIPTS: ScriptSpec[] = [
  { id: "build", name: "build script", severity: "warning" },
  { id: "test", name: "test script", severity: "warning" },
  { id: "lint", name: "lint script", severity: "info" },
  { id: "typecheck", name: "typecheck script", severity: "info" },
];

export const RUNNABLE_SCRIPTS = ["typecheck", "test", "lint", "build"] as const;
export type RunnableScript = (typeof RUNNABLE_SCRIPTS)[number];

export function isRunnableScript(name: string): name is RunnableScript {
  return (RUNNABLE_SCRIPTS as readonly string[]).includes(name);
}

export function checkScripts(
  packageJson: Record<string, unknown> | null
): CheckResult[] {
  if (!packageJson) return [];

  const scripts =
    (packageJson.scripts as Record<string, string> | undefined) ?? {};
  const results: CheckResult[] = [];

  for (const spec of REQUIRED_SCRIPTS) {
    const value = scripts[spec.id];
    const hasScript = typeof value === "string" && value.length > 0;
    if (hasScript) {
      results.push({
        id: `script-${spec.id}`,
        name: `${spec.name} exists`,
        status: "pass",
        severity: "info",
      });
    } else {
      results.push({
        id: `script-${spec.id}`,
        name: `no ${spec.id} script found`,
        status: "warn",
        severity: spec.severity,
      });
    }
  }

  return results;
}

export interface RunScriptResult {
  ok: boolean;
  output: string;
  timedOut: boolean;
  durationMs: number;
}

export interface RunScriptOptions {
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 60_000;

export async function runScript(
  root: string,
  packageManager: string,
  scriptName: string,
  options: RunScriptOptions = {}
): Promise<RunScriptResult> {
  if (!isRunnableScript(scriptName)) {
    return {
      ok: false,
      output: `script "${scriptName}" is not in the runnable allow-list (${RUNNABLE_SCRIPTS.join(", ")})`,
      timedOut: false,
      durationMs: 0,
    };
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const cmd = packageManager === "bun" ? "bun" : packageManager;
  const started = Date.now();

  const proc = Bun.spawn([cmd, "run", scriptName], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    try {
      proc.kill();
    } catch {
      // process may already be dead — safe to ignore
    }
  }, timeoutMs);

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  clearTimeout(timer);

  const durationMs = Date.now() - started;
  const combined = (stdout + stderr).trim();
  const output = timedOut
    ? `timed out after ${Math.round(timeoutMs / 1000)}s — ${combined || "no output captured"}`
    : combined;

  return {
    ok: !timedOut && exitCode === 0,
    output,
    timedOut,
    durationMs,
  };
}
