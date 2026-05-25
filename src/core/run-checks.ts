import type { CheckResult } from "../types.ts";
import { checkPackageJson } from "../checks/package-json.ts";
import {
  RUNNABLE_SCRIPTS,
  checkScripts,
  runScript,
} from "../checks/scripts.ts";
import { checkLockfile } from "../checks/lockfile.ts";
import { checkGit } from "../checks/git.ts";
import { checkEnv } from "../checks/env.ts";
import { detectProject } from "./detect-project.ts";

export interface RunOptions {
  root: string;
  runScripts?: boolean;
  runTimeoutMs?: number;
}

export async function runChecks(options: RunOptions): Promise<CheckResult[]> {
  const { root } = options;
  const results: CheckResult[] = [];

  const pkg = await checkPackageJson(root);
  results.push(pkg.result);

  const lock = await checkLockfile(root);
  results.push(...lock.results);

  results.push(...checkScripts(pkg.packageJson));

  results.push(...(await checkGit(root)));

  results.push(...(await checkEnv(root)));

  if (options.runScripts && pkg.packageJson) {
    const project = await detectProject(root);
    const pm = project.packageManager === "unknown" ? "bun" : project.packageManager;
    const scripts =
      (pkg.packageJson.scripts as Record<string, string> | undefined) ?? {};

    for (const name of RUNNABLE_SCRIPTS) {
      if (!scripts[name]) continue;
      const result = await runScript(root, pm, name, {
        timeoutMs: options.runTimeoutMs,
      });
      results.push(toCheckResult(name, result));
    }
  }

  return results;
}

function toCheckResult(
  name: string,
  result: { ok: boolean; output: string; timedOut: boolean; durationMs: number }
): CheckResult {
  if (result.ok) {
    return {
      id: `run-${name}`,
      name: `${name} passed (${result.durationMs}ms)`,
      status: "pass",
      severity: "info",
    };
  }

  const label = result.timedOut ? `${name} timed out` : `${name} failed`;
  return {
    id: `run-${name}`,
    name: label,
    status: "fail",
    severity: "blocker",
    message: firstErrorLine(result.output),
    details: result.output,
  };
}

function firstErrorLine(output: string): string {
  const lines = output.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines[lines.length - 1] ?? "see details for full output";
}
