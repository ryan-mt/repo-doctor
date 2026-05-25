import { join } from "node:path";
import type { CheckResult } from "../types.ts";

export async function hasGit(root: string): Promise<boolean> {
  return await Bun.file(join(root, ".git/HEAD")).exists();
}

export async function checkGit(root: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const present = await hasGit(root);

  if (!present) {
    results.push({
      id: "git-repo",
      name: "no git repository",
      status: "warn",
      severity: "warning",
      message: "run `git init` to initialize",
    });
    return results;
  }

  results.push({
    id: "git-repo",
    name: "git repository detected",
    status: "pass",
    severity: "info",
  });

  try {
    const proc = Bun.spawn(["git", "status", "--porcelain"], {
      cwd: root,
      stdout: "pipe",
      stderr: "pipe",
    });
    const out = (await new Response(proc.stdout).text()).trim();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      results.push({
        id: "git-status",
        name: "git status check failed",
        status: "warn",
        severity: "warning",
      });
      return results;
    }

    if (out.length === 0) {
      results.push({
        id: "git-status",
        name: "working tree clean",
        status: "pass",
        severity: "info",
      });
    } else {
      const count = out.split("\n").length;
      results.push({
        id: "git-status",
        name: "uncommitted changes",
        status: "warn",
        severity: "warning",
        message: `${count} file${count === 1 ? "" : "s"} modified or untracked`,
      });
    }
  } catch {
    results.push({
      id: "git-status",
      name: "git not available",
      status: "warn",
      severity: "warning",
    });
  }

  return results;
}
