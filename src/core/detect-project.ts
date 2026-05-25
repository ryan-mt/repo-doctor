import { join } from "node:path";
import type { PackageManager, ProjectInfo } from "../types.ts";
import { hasGit } from "../checks/git.ts";
import { detectLockfiles } from "../checks/lockfile.ts";

export async function detectProject(root: string): Promise<ProjectInfo> {
  const pkgPath = join(root, "package.json");
  const pkgFile = Bun.file(pkgPath);
  const hasPackageJson = await pkgFile.exists();

  let packageJson: Record<string, unknown> | null = null;
  let packageJsonError: string | null = null;

  if (hasPackageJson) {
    try {
      const text = await pkgFile.text();
      packageJson = JSON.parse(text) as Record<string, unknown>;
    } catch (err) {
      packageJsonError = (err as Error).message;
    }
  } else {
    packageJsonError = "missing";
  }

  const { primary } = await detectLockfiles(root);
  const fromField = readPackageManagerField(packageJson);
  const packageManager: PackageManager = fromField ?? primary;

  return {
    root,
    packageManager,
    hasPackageJson,
    hasGit: await hasGit(root),
    packageJson,
    packageJsonError,
  };
}

function readPackageManagerField(
  pkg: Record<string, unknown> | null
): PackageManager | null {
  if (!pkg) return null;
  const field = pkg.packageManager;
  if (typeof field !== "string") return null;
  if (field.startsWith("bun")) return "bun";
  if (field.startsWith("pnpm")) return "pnpm";
  if (field.startsWith("npm")) return "npm";
  if (field.startsWith("yarn")) return "yarn";
  return null;
}
