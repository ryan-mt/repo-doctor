import { join } from "node:path";
import type { CheckResult, PackageManager } from "../types.ts";

interface LockfileSpec {
  file: string;
  pm: PackageManager;
}

const LOCKFILES: LockfileSpec[] = [
  { file: "bun.lockb", pm: "bun" },
  { file: "bun.lock", pm: "bun" },
  { file: "pnpm-lock.yaml", pm: "pnpm" },
  { file: "package-lock.json", pm: "npm" },
  { file: "yarn.lock", pm: "yarn" },
];

export async function detectLockfiles(
  root: string
): Promise<{ found: LockfileSpec[]; primary: PackageManager }> {
  const found: LockfileSpec[] = [];
  for (const spec of LOCKFILES) {
    const exists = await Bun.file(join(root, spec.file)).exists();
    if (exists) found.push(spec);
  }
  const primary: PackageManager = found.length > 0 ? found[0]!.pm : "unknown";
  return { found, primary };
}

export async function checkLockfile(root: string): Promise<{
  results: CheckResult[];
  packageManager: PackageManager;
}> {
  const { found, primary } = await detectLockfiles(root);
  const results: CheckResult[] = [];

  if (found.length === 0) {
    results.push({
      id: "lockfile-present",
      name: "no lockfile detected",
      status: "warn",
      severity: "warning",
      message: "install dependencies to generate one",
    });
    return { results, packageManager: "unknown" };
  }

  if (found.length === 1) {
    results.push({
      id: "lockfile-present",
      name: `lockfile detected (${found[0]!.file})`,
      status: "pass",
      severity: "info",
    });
    return { results, packageManager: primary };
  }

  const files = found.map((f) => f.file).join(", ");
  results.push({
    id: "lockfile-mismatch",
    name: "multiple lockfiles present",
    status: "fail",
    severity: "blocker",
    message: `keep only one: ${files}`,
  });
  return { results, packageManager: primary };
}
