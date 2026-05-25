export type CheckStatus = "pass" | "warn" | "fail" | "skip";

export type CheckSeverity = "blocker" | "warning" | "info";

export interface CheckResult {
  id: string;
  name: string;
  status: CheckStatus;
  severity: CheckSeverity;
  message?: string;
  details?: string;
}

export type PackageManager = "bun" | "pnpm" | "npm" | "yarn" | "unknown";

export interface ProjectInfo {
  root: string;
  packageManager: PackageManager;
  hasPackageJson: boolean;
  hasGit: boolean;
  packageJson: Record<string, unknown> | null;
  packageJsonError: string | null;
}

export interface Report {
  score: number;
  status: string;
  ready: boolean;
  blockers: CheckResult[];
  warnings: CheckResult[];
  passed: CheckResult[];
  skipped: CheckResult[];
}
