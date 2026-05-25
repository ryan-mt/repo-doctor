import { join } from "node:path";
import type { CheckResult, ProjectInfo } from "../types.ts";

export async function checkPackageJson(root: string): Promise<{
  result: CheckResult;
  packageJson: ProjectInfo["packageJson"];
  packageJsonError: string | null;
}> {
  const path = join(root, "package.json");
  const file = Bun.file(path);
  const exists = await file.exists();

  if (!exists) {
    return {
      result: {
        id: "package-json-exists",
        name: "package.json found",
        status: "fail",
        severity: "blocker",
        message: "no package.json in repo root",
      },
      packageJson: null,
      packageJsonError: "missing",
    };
  }

  let text: string;
  try {
    text = await file.text();
  } catch (err) {
    return {
      result: {
        id: "package-json-exists",
        name: "package.json found",
        status: "fail",
        severity: "blocker",
        message: `cannot read package.json: ${(err as Error).message}`,
      },
      packageJson: null,
      packageJsonError: "unreadable",
    };
  }

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return {
      result: {
        id: "package-json-exists",
        name: "package.json found",
        status: "pass",
        severity: "info",
      },
      packageJson: parsed,
      packageJsonError: null,
    };
  } catch (err) {
    return {
      result: {
        id: "package-json-exists",
        name: "package.json is invalid",
        status: "fail",
        severity: "blocker",
        message: `JSON parse error: ${(err as Error).message}`,
      },
      packageJson: null,
      packageJsonError: "invalid-json",
    };
  }
}
